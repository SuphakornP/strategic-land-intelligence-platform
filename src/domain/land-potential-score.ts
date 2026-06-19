import {
  type CategoryScore,
  type CompetitorProject,
  type GISLayer,
  type LandParcel,
  type LandPotentialScore,
  type MarketSignal,
  type RiskLevel,
  type RiskSignal,
  type ScoreCategoryDefinition,
  type ScoreCategoryId,
} from "./land-intelligence-types.js";
import {
  clamp,
  clampScore,
  haversineDistanceKm,
  round,
  scoreHigherIsBetter,
  scoreLowerIsBetter,
  weightedAverage,
} from "../shared/math.js";

export const LAND_POTENTIAL_SCORING_VERSION = "land-potential-score-v1";

export const LAND_POTENTIAL_SCORE_CATEGORIES: readonly ScoreCategoryDefinition[] =
  [
    {
      id: "locationAccessibility",
      label: "Location & Accessibility",
      weight: 25,
    },
    {
      id: "planningBuildability",
      label: "Planning & Buildability",
      weight: 20,
    },
    {
      id: "marketDemand",
      label: "Market Demand",
      weight: 20,
    },
    {
      id: "competitivePosition",
      label: "Competitive Position",
      weight: 15,
    },
    {
      id: "landCostFeasibility",
      label: "Land Cost & Feasibility",
      weight: 10,
    },
    {
      id: "riskConstraint",
      label: "Risk & Constraint",
      weight: 10,
    },
  ];

export const LAND_POTENTIAL_SCORE_WEIGHTS = Object.freeze(
  Object.fromEntries(
    LAND_POTENTIAL_SCORE_CATEGORIES.map((category) => [
      category.id,
      category.weight,
    ]),
  ) as Record<ScoreCategoryId, number>,
);

export interface LandPotentialScoreInput {
  parcel: LandParcel;
  competitors?: CompetitorProject[];
  marketSignals?: MarketSignal[];
  riskSignals?: RiskSignal[];
  gisLayers?: GISLayer[];
}

export function calculateLandPotentialScore(
  input: LandPotentialScoreInput,
): LandPotentialScore {
  assertWeightsTotal100();

  const categoryScores = [
    scoreLocationAccessibility(input.parcel),
    scorePlanningBuildability(input.parcel),
    scoreMarketDemand(input.parcel, input.marketSignals ?? []),
    scoreCompetitivePosition(input.parcel, input.competitors ?? []),
    scoreLandCostFeasibility(input.parcel),
    scoreRiskConstraint(
      input.parcel,
      input.riskSignals ?? [],
      input.gisLayers ?? [],
    ),
  ];

  const categories = Object.fromEntries(
    categoryScores.map((categoryScore) => [categoryScore.id, categoryScore]),
  ) as Record<ScoreCategoryId, CategoryScore>;

  const totalScore = round(
    categoryScores.reduce((sum, category) => sum + category.weightedScore, 0),
    1,
  );

  return {
    totalScore,
    grade: gradeScore(totalScore),
    categories,
    scoringVersion: LAND_POTENTIAL_SCORING_VERSION,
  };
}

export function assertWeightsTotal100(): void {
  const totalWeight = LAND_POTENTIAL_SCORE_CATEGORIES.reduce(
    (sum, category) => sum + category.weight,
    0,
  );

  if (totalWeight !== 100) {
    throw new Error(`Land potential score weights must total 100, got ${totalWeight}`);
  }
}

function scoreLocationAccessibility(parcel: LandParcel): CategoryScore {
  const transitScore = scoreLowerIsBetter(
    parcel.accessibility.distanceToMassTransitMeters,
    [
      { max: 300, score: 100 },
      { max: 800, score: 85 },
      { max: 1500, score: 65 },
      { max: 2500, score: 40 },
    ],
    20,
  );
  const roadScore = weightedAverage([
    {
      value: scoreHigherIsBetter(
        parcel.site.roadWidthMeters,
        [
          { min: 16, score: 100 },
          { min: 12, score: 82 },
          { min: 8, score: 62 },
          { min: 6, score: 38 },
        ],
        18,
      ),
      weight: 0.55,
    },
    {
      value: scoreHigherIsBetter(
        parcel.site.frontageMeters,
        [
          { min: 45, score: 100 },
          { min: 30, score: 82 },
          { min: 18, score: 62 },
          { min: 10, score: 38 },
        ],
        18,
      ),
      weight: 0.45,
    },
  ]);
  const cbdScore = scoreLowerIsBetter(
    parcel.accessibility.distanceToCbdKm,
    [
      { max: 5, score: 95 },
      { max: 10, score: 85 },
      { max: 20, score: 65 },
      { max: 35, score: 45 },
    ],
    25,
  );
  const expresswayScore = scoreLowerIsBetter(
    parcel.accessibility.distanceToExpresswayKm,
    [
      { max: 1, score: 95 },
      { max: 3, score: 80 },
      { max: 6, score: 60 },
      { max: 10, score: 40 },
    ],
    25,
  );
  const rawScore = weightedAverage([
    { value: transitScore, weight: 0.35 },
    { value: roadScore, weight: 0.25 },
    { value: cbdScore, weight: 0.25 },
    { value: expresswayScore, weight: 0.15 },
  ]);

  return categoryScore("locationAccessibility", rawScore, [
    `${parcel.accessibility.distanceToMassTransitMeters}m to mass transit`,
    `${parcel.site.roadWidthMeters}m road width and ${parcel.site.frontageMeters}m frontage`,
    `${parcel.accessibility.distanceToCbdKm}km to CBD`,
  ]);
}

function scorePlanningBuildability(parcel: LandParcel): CategoryScore {
  const farScore = scoreHigherIsBetter(
    parcel.planning.far,
    [
      { min: 8, score: 100 },
      { min: 6, score: 85 },
      { min: 4, score: 70 },
      { min: 2.5, score: 50 },
    ],
    30,
  );
  const productFlexibilityScore = scoreHigherIsBetter(
    parcel.planning.allowableProductTypes.length,
    [
      { min: 4, score: 95 },
      { min: 3, score: 82 },
      { min: 2, score: 68 },
    ],
    45,
  );
  const rawScore = weightedAverage([
    { value: parcel.planning.buildabilityScore, weight: 0.38 },
    { value: parcel.site.shapeEfficiencyScore, weight: 0.18 },
    { value: parcel.planning.infrastructureReadinessScore, weight: 0.22 },
    { value: farScore, weight: 0.14 },
    { value: productFlexibilityScore, weight: 0.08 },
  ]);

  return categoryScore("planningBuildability", rawScore, [
    `Zoning ${parcel.planning.zoningCode} with FAR ${parcel.planning.far}`,
    `Buildability ${parcel.planning.buildabilityScore}/100`,
    `Infrastructure readiness ${parcel.planning.infrastructureReadinessScore}/100`,
  ]);
}

function scoreMarketDemand(
  parcel: LandParcel,
  marketSignals: MarketSignal[],
): CategoryScore {
  const relevantSignals = filterRelevantMarketSignals(parcel, marketSignals);

  if (relevantSignals.length === 0) {
    const rawScore = weightedAverage([
      { value: parcel.market.demandDepthScore, weight: 0.7 },
      { value: 55, weight: 0.3 },
    ]);

    return categoryScore("marketDemand", rawScore, [
      `No external market signals; using parcel demand depth ${parcel.market.demandDepthScore}/100`,
    ]);
  }

  const demandIndex = average(relevantSignals.map((signal) => signal.demandIndex));
  const absorptionScore = scoreHigherIsBetter(
    average(relevantSignals.map((signal) => signal.absorptionUnitsPerMonth)),
    [
      { min: 85, score: 100 },
      { min: 55, score: 82 },
      { min: 32, score: 62 },
      { min: 15, score: 42 },
    ],
    22,
  );
  const priceGrowthScore = scoreHigherIsBetter(
    average(relevantSignals.map((signal) => signal.priceGrowthPctYoY)),
    [
      { min: 8, score: 100 },
      { min: 5, score: 82 },
      { min: 2, score: 62 },
      { min: 0, score: 42 },
    ],
    22,
  );
  const inventoryScore = scoreLowerIsBetter(
    average(relevantSignals.map((signal) => signal.inventoryMonths)),
    [
      { max: 6, score: 100 },
      { max: 12, score: 82 },
      { max: 18, score: 62 },
      { max: 24, score: 42 },
    ],
    22,
  );
  const confidenceScore = average(
    relevantSignals.map((signal) => signal.confidence),
  );
  const rawScore = weightedAverage([
    { value: parcel.market.demandDepthScore, weight: 0.25 },
    { value: demandIndex, weight: 0.3 },
    { value: absorptionScore, weight: 0.18 },
    { value: priceGrowthScore, weight: 0.15 },
    { value: inventoryScore, weight: 0.08 },
    { value: confidenceScore, weight: 0.04 },
  ]);

  return categoryScore("marketDemand", rawScore, [
    `${relevantSignals.length} relevant market signal(s)`,
    `Demand index average ${round(demandIndex)}/100`,
    `Inventory average ${round(average(relevantSignals.map((signal) => signal.inventoryMonths)))} months`,
  ]);
}

function scoreCompetitivePosition(
  parcel: LandParcel,
  competitors: CompetitorProject[],
): CategoryScore {
  const nearbyCompetitors = competitors
    .map((competitor) => ({
      competitor,
      distanceKm: haversineDistanceKm(
        parcel.location.coordinates,
        competitor.location.coordinates,
      ),
    }))
    .filter((item) => item.distanceKm <= 3.5);

  if (nearbyCompetitors.length === 0) {
    return categoryScore("competitivePosition", 68, [
      "No competitor projects within 3.5km; using neutral competitive score",
    ]);
  }

  const activeCompetitors = nearbyCompetitors.filter(
    ({ competitor }) => competitor.status !== "recentlySoldOut",
  );
  const sameProductCompetitors = nearbyCompetitors.filter(({ competitor }) =>
    parcel.planning.allowableProductTypes.includes(competitor.productType),
  );
  const pressureScore = scoreLowerIsBetter(
    activeCompetitors.length,
    [
      { max: 1, score: 90 },
      { max: 3, score: 72 },
      { max: 5, score: 52 },
      { max: 8, score: 34 },
    ],
    20,
  );
  const sameProductPressureScore = scoreLowerIsBetter(
    sameProductCompetitors.length,
    [
      { max: 1, score: 86 },
      { max: 3, score: 68 },
      { max: 5, score: 48 },
    ],
    24,
  );
  const salesMomentumScore = scoreHigherIsBetter(
    average(nearbyCompetitors.map(({ competitor }) => competitor.salesRatePct)),
    [
      { min: 82, score: 88 },
      { min: 65, score: 76 },
      { min: 45, score: 58 },
      { min: 25, score: 40 },
    ],
    25,
  );
  const averageCompetitorPrice = average(
    nearbyCompetitors.map(({ competitor }) => competitor.averagePricePerSqm),
  );
  const priceRatio =
    averageCompetitorPrice > 0
      ? parcel.market.estimatedResidentialPricePerSqm / averageCompetitorPrice
      : 1;
  const pricePositionScore = scoreLowerIsBetter(
    priceRatio,
    [
      { max: 0.95, score: 92 },
      { max: 1.05, score: 84 },
      { max: 1.15, score: 68 },
      { max: 1.3, score: 48 },
    ],
    28,
  );
  const rawScore = weightedAverage([
    { value: pressureScore, weight: 0.32 },
    { value: sameProductPressureScore, weight: 0.22 },
    { value: salesMomentumScore, weight: 0.26 },
    { value: pricePositionScore, weight: 0.2 },
  ]);

  return categoryScore("competitivePosition", rawScore, [
    `${nearbyCompetitors.length} competitor project(s) within 3.5km`,
    `${sameProductCompetitors.length} competitor(s) in allowable product categories`,
    `Competitor sales momentum average ${round(average(nearbyCompetitors.map(({ competitor }) => competitor.salesRatePct)))}%`,
  ]);
}

function scoreLandCostFeasibility(parcel: LandParcel): CategoryScore {
  const landCostRatio =
    parcel.financials.targetLandCostPerSqWah > 0
      ? parcel.financials.askingPricePerSqWah /
        parcel.financials.targetLandCostPerSqWah
      : 2;
  const landCostScore = scoreLowerIsBetter(
    landCostRatio,
    [
      { max: 0.9, score: 100 },
      { max: 1, score: 85 },
      { max: 1.1, score: 68 },
      { max: 1.25, score: 45 },
    ],
    20,
  );
  const marginScore = scoreHigherIsBetter(
    parcel.financials.estimatedGrossMarginPct,
    [
      { min: 28, score: 100 },
      { min: 22, score: 82 },
      { min: 16, score: 62 },
      { min: 10, score: 40 },
    ],
    15,
  );
  const ownershipScore = scoreOwnershipComplexity(parcel);
  const capexScore = parcel.financials.capexComplexityScore;
  const rawScore = weightedAverage([
    { value: landCostScore, weight: 0.36 },
    { value: marginScore, weight: 0.34 },
    { value: ownershipScore, weight: 0.18 },
    { value: capexScore, weight: 0.12 },
  ]);

  return categoryScore("landCostFeasibility", rawScore, [
    `Asking price is ${round(landCostRatio * 100, 0)}% of target land cost`,
    `Estimated gross margin ${parcel.financials.estimatedGrossMarginPct}%`,
    `Ownership complexity ${parcel.site.ownershipComplexity}`,
  ]);
}

function scoreRiskConstraint(
  parcel: LandParcel,
  riskSignals: RiskSignal[],
  gisLayers: GISLayer[],
): CategoryScore {
  const intrinsicRiskScore = weightedAverage([
    { value: riskLevelScore(parcel.risk.flood), weight: 0.35 },
    { value: riskLevelScore(parcel.risk.legal), weight: 0.3 },
    { value: riskLevelScore(parcel.risk.environmental), weight: 0.2 },
    { value: riskLevelScore(parcel.risk.communityPolitical), weight: 0.15 },
  ]);
  const signalPenalty = riskSignals.reduce((penalty, signal) => {
    const severityWeight = signal.mitigatable ? 8 : 14;
    return penalty + signal.severity * clamp(signal.probability, 0, 1) * severityWeight;
  }, 0);
  const signalScore =
    riskSignals.length === 0 ? 90 : clampScore(100 - signalPenalty);
  const gisPenalty = gisLayers.reduce((penalty, layer) => {
    if (layer.type === "flood" || layer.type === "environment") {
      return penalty + 6;
    }

    return penalty;
  }, 0);
  const rawBeforeCaps = weightedAverage([
    { value: intrinsicRiskScore, weight: 0.62 },
    { value: signalScore, weight: 0.3 },
    { value: clampScore(100 - gisPenalty), weight: 0.08 },
  ]);
  const hasCriticalParcelFlag = (parcel.risk.criticalFlags?.length ?? 0) > 0;
  const hasCriticalSignal = riskSignals.some(
    (signal) =>
      signal.severity === 5 && !signal.mitigatable && signal.probability >= 0.65,
  );
  const cappedScore =
    hasCriticalParcelFlag || hasCriticalSignal
      ? Math.min(rawBeforeCaps, 30)
      : rawBeforeCaps;

  return categoryScore("riskConstraint", cappedScore, [
    `Flood risk ${parcel.risk.flood}; legal risk ${parcel.risk.legal}`,
    `${riskSignals.length} applicable risk signal(s)`,
    `${gisLayers.length} applicable GIS layer(s)`,
  ]);
}

function categoryScore(
  categoryId: ScoreCategoryId,
  rawScore: number,
  evidence: string[],
): CategoryScore {
  const category = LAND_POTENTIAL_SCORE_CATEGORIES.find(
    (definition) => definition.id === categoryId,
  );

  if (!category) {
    throw new Error(`Unknown score category: ${categoryId}`);
  }

  const normalizedRawScore = round(clampScore(rawScore), 1);

  return {
    ...category,
    rawScore: normalizedRawScore,
    weightedScore: round((normalizedRawScore * category.weight) / 100, 1),
    evidence,
  };
}

function filterRelevantMarketSignals(
  parcel: LandParcel,
  marketSignals: MarketSignal[],
): MarketSignal[] {
  return marketSignals.filter((signal) => {
    const sameDistrict =
      normalize(signal.district) === normalize(parcel.location.district);
    const sameProvince =
      normalize(signal.province) === normalize(parcel.location.province);
    const productMatches =
      !signal.productType ||
      parcel.planning.allowableProductTypes.includes(signal.productType);
    const segmentMatches =
      !signal.segment || parcel.market.targetSegments.includes(signal.segment);

    return sameProvince && sameDistrict && productMatches && segmentMatches;
  });
}

function scoreOwnershipComplexity(parcel: LandParcel): number {
  switch (parcel.site.ownershipComplexity) {
    case "singleOwner":
      return 100;
    case "multipleCooperativeOwners":
      return 72;
    case "fragmentedOwners":
      return 42;
    case "disputedTitle":
      return 12;
  }
}

function riskLevelScore(level: RiskLevel): number {
  switch (level) {
    case "low":
      return 95;
    case "medium":
      return 70;
    case "high":
      return 40;
    case "severe":
      return 15;
  }
}

function gradeScore(score: number): LandPotentialScore["grade"] {
  if (score >= 85) {
    return "A";
  }

  if (score >= 70) {
    return "B";
  }

  if (score >= 60) {
    return "C";
  }

  if (score >= 45) {
    return "D";
  }

  return "E";
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
