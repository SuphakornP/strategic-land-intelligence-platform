import {
  type CompetitorProject,
  type LandParcel,
  type MarketSegment,
  type MarketSignal,
  type ProductFit,
  type ProductFitRecommendation,
  type ProductType,
} from "./land-intelligence-types.js";
import {
  clampScore,
  haversineDistanceKm,
  round,
  scoreHigherIsBetter,
  scoreLowerIsBetter,
  weightedAverage,
} from "../shared/math.js";

export interface ProductFitInput {
  parcel: LandParcel;
  marketSignals?: MarketSignal[];
  competitors?: CompetitorProject[];
}

type ProductFitRule = {
  productType: ProductType;
  segment: MarketSegment;
  evaluate: (input: Required<ProductFitInput>) => ProductFit;
};

export function recommendProductFit(
  input: ProductFitInput,
): ProductFitRecommendation {
  const completeInput: Required<ProductFitInput> = {
    parcel: input.parcel,
    marketSignals: input.marketSignals ?? [],
    competitors: input.competitors ?? [],
  };
  const rankedFits = PRODUCT_FIT_RULES.map((rule) =>
    rule.evaluate(completeInput),
  ).sort((a, b) => b.score - a.score);
  const topFit = rankedFits[0];

  if (!topFit) {
    throw new Error("At least one product fit rule is required");
  }

  return {
    topFit,
    rankedFits,
  };
}

const PRODUCT_FIT_RULES: ProductFitRule[] = [
  {
    productType: "condominium",
    segment: "upperMid",
    evaluate: ({ parcel, marketSignals, competitors }) => {
      const marketScore = productMarketScore(parcel, marketSignals, "condominium");
      const competitionPenalty = sameProductCompetitionPenalty(
        parcel,
        competitors,
        "condominium",
      );
      const score = weightedAverage([
        {
          value: scoreLowerIsBetter(
            parcel.accessibility.distanceToMassTransitMeters,
            [
              { max: 300, score: 100 },
              { max: 800, score: 86 },
              { max: 1200, score: 64 },
            ],
            25,
          ),
          weight: 0.24,
        },
        {
          value: scoreHigherIsBetter(
            parcel.planning.far,
            [
              { min: 8, score: 100 },
              { min: 6, score: 84 },
              { min: 4, score: 58 },
            ],
            25,
          ),
          weight: 0.2,
        },
        {
          value: scoreAreaFit(parcel.site.areaRai, 2, 10, 16),
          weight: 0.16,
        },
        {
          value: marketScore,
          weight: 0.22,
        },
        {
          value: clampScore(100 - competitionPenalty),
          weight: 0.1,
        },
        {
          value: parcel.planning.allowableProductTypes.includes("condominium")
            ? 100
            : 20,
          weight: 0.08,
        },
      ]);

      return fit("condominium", "upperMid", score, [
        `${parcel.accessibility.distanceToMassTransitMeters}m to rail transit`,
        `FAR ${parcel.planning.far} supports vertical development`,
        `Condo market score ${round(marketScore)}/100`,
      ], cautionsFor(parcel, competitionPenalty));
    },
  },
  {
    productType: "townhome",
    segment: "midMarket",
    evaluate: ({ parcel, marketSignals, competitors }) => {
      const marketScore = productMarketScore(parcel, marketSignals, "townhome");
      const competitionPenalty = sameProductCompetitionPenalty(
        parcel,
        competitors,
        "townhome",
      );
      const score = weightedAverage([
        {
          value: scoreAreaFit(parcel.site.areaRai, 8, 32, 45),
          weight: 0.2,
        },
        {
          value: scoreHigherIsBetter(
            parcel.site.roadWidthMeters,
            [
              { min: 12, score: 95 },
              { min: 8, score: 78 },
              { min: 6, score: 52 },
            ],
            25,
          ),
          weight: 0.16,
        },
        {
          value: outerBangkokFamilyScore(parcel),
          weight: 0.16,
        },
        {
          value: marketScore,
          weight: 0.24,
        },
        {
          value: parcel.planning.infrastructureReadinessScore,
          weight: 0.14,
        },
        {
          value: clampScore(100 - competitionPenalty),
          weight: 0.1,
        },
      ]);

      return fit("townhome", "midMarket", score, [
        `${parcel.site.areaRai} rai supports horizontal phasing`,
        `${parcel.site.roadWidthMeters}m access road`,
        `Townhome market score ${round(marketScore)}/100`,
      ], cautionsFor(parcel, competitionPenalty));
    },
  },
  {
    productType: "singleDetached",
    segment: "premium",
    evaluate: ({ parcel, marketSignals, competitors }) => {
      const marketScore = productMarketScore(
        parcel,
        marketSignals,
        "singleDetached",
      );
      const competitionPenalty = sameProductCompetitionPenalty(
        parcel,
        competitors,
        "singleDetached",
      );
      const score = weightedAverage([
        {
          value: scoreAreaFit(parcel.site.areaRai, 18, 70, 95),
          weight: 0.22,
        },
        {
          value: scoreHigherIsBetter(
            parcel.site.frontageMeters,
            [
              { min: 55, score: 96 },
              { min: 35, score: 78 },
              { min: 20, score: 54 },
            ],
            28,
          ),
          weight: 0.14,
        },
        {
          value: premiumSegmentScore(parcel),
          weight: 0.17,
        },
        {
          value: marketScore,
          weight: 0.22,
        },
        {
          value: parcel.risk.flood === "low" ? 92 : parcel.risk.flood === "medium" ? 68 : 35,
          weight: 0.13,
        },
        {
          value: clampScore(100 - competitionPenalty),
          weight: 0.12,
        },
      ]);

      return fit("singleDetached", "premium", score, [
        `${parcel.site.areaRai} rai site scale`,
        `Target segments: ${parcel.market.targetSegments.join(", ")}`,
        `Single-detached market score ${round(marketScore)}/100`,
      ], cautionsFor(parcel, competitionPenalty));
    },
  },
  {
    productType: "mixedUse",
    segment: "premium",
    evaluate: ({ parcel, marketSignals, competitors }) => {
      const marketScore = productMarketScore(parcel, marketSignals, "mixedUse");
      const competitionPenalty = sameProductCompetitionPenalty(
        parcel,
        competitors,
        "mixedUse",
      );
      const commercialZoningScore =
        /commercial|mixed|พาณิชย์/i.test(parcel.planning.zoningDescription) ||
        parcel.planning.zoningCode.startsWith("C")
          ? 95
          : 48;
      const score = weightedAverage([
        {
          value: scoreAreaFit(parcel.site.areaRai, 5, 24, 45),
          weight: 0.16,
        },
        {
          value: commercialZoningScore,
          weight: 0.16,
        },
        {
          value: scoreLowerIsBetter(
            parcel.accessibility.distanceToMassTransitMeters,
            [
              { max: 400, score: 100 },
              { max: 1000, score: 78 },
              { max: 1800, score: 52 },
            ],
            25,
          ),
          weight: 0.18,
        },
        {
          value: scoreHigherIsBetter(
            parcel.site.roadWidthMeters,
            [
              { min: 16, score: 96 },
              { min: 12, score: 76 },
              { min: 8, score: 50 },
            ],
            25,
          ),
          weight: 0.12,
        },
        {
          value: marketScore,
          weight: 0.24,
        },
        {
          value: clampScore(100 - competitionPenalty),
          weight: 0.14,
        },
      ]);

      return fit("mixedUse", "premium", score, [
        `${parcel.planning.zoningCode} zoning and ${parcel.planning.zoningDescription}`,
        `${parcel.accessibility.distanceToMassTransitMeters}m to transit`,
        `Mixed-use market score ${round(marketScore)}/100`,
      ], cautionsFor(parcel, competitionPenalty));
    },
  },
  {
    productType: "homeOfficeRetail",
    segment: "upperMid",
    evaluate: ({ parcel, marketSignals, competitors }) => {
      const marketScore = productMarketScore(
        parcel,
        marketSignals,
        "homeOfficeRetail",
      );
      const competitionPenalty = sameProductCompetitionPenalty(
        parcel,
        competitors,
        "homeOfficeRetail",
      );
      const score = weightedAverage([
        {
          value: scoreHigherIsBetter(
            parcel.site.frontageMeters,
            [
              { min: 60, score: 96 },
              { min: 40, score: 80 },
              { min: 25, score: 58 },
            ],
            30,
          ),
          weight: 0.22,
        },
        {
          value: scoreHigherIsBetter(
            parcel.site.roadWidthMeters,
            [
              { min: 16, score: 96 },
              { min: 12, score: 78 },
              { min: 8, score: 52 },
            ],
            25,
          ),
          weight: 0.18,
        },
        {
          value: scoreAreaFit(parcel.site.areaRai, 4, 18, 35),
          weight: 0.14,
        },
        {
          value: marketScore,
          weight: 0.24,
        },
        {
          value: parcel.planning.infrastructureReadinessScore,
          weight: 0.1,
        },
        {
          value: clampScore(100 - competitionPenalty),
          weight: 0.12,
        },
      ]);

      return fit("homeOfficeRetail", "upperMid", score, [
        `${parcel.site.frontageMeters}m frontage`,
        `${parcel.site.roadWidthMeters}m road access`,
        `Home-office/retail market score ${round(marketScore)}/100`,
      ], cautionsFor(parcel, competitionPenalty));
    },
  },
];

function fit(
  productType: ProductType,
  segment: MarketSegment,
  score: number,
  fitDrivers: string[],
  cautions: string[],
): ProductFit {
  return {
    productType,
    segment,
    score: round(clampScore(score), 1),
    rationale: `${productType} fit for ${segment} demand`,
    fitDrivers,
    cautions,
  };
}

function productMarketScore(
  parcel: LandParcel,
  signals: MarketSignal[],
  productType: ProductType,
): number {
  const matchingSignals = signals.filter((signal) => {
    const productMatches = !signal.productType || signal.productType === productType;
    const segmentMatches =
      !signal.segment || parcel.market.targetSegments.includes(signal.segment);

    return productMatches && segmentMatches;
  });

  if (matchingSignals.length === 0) {
    return parcel.market.demandDepthScore;
  }

  return weightedAverage(
    matchingSignals.map((signal) => ({
      value: weightedAverage([
        { value: signal.demandIndex, weight: 0.5 },
        {
          value: scoreHigherIsBetter(
            signal.absorptionUnitsPerMonth,
            [
              { min: 80, score: 100 },
              { min: 55, score: 82 },
              { min: 30, score: 62 },
              { min: 15, score: 42 },
            ],
            22,
          ),
          weight: 0.3,
        },
        {
          value: scoreLowerIsBetter(
            signal.inventoryMonths,
            [
              { max: 6, score: 100 },
              { max: 12, score: 82 },
              { max: 18, score: 62 },
            ],
            30,
          ),
          weight: 0.2,
        },
      ]),
      weight: signal.confidence,
    })),
  );
}

function sameProductCompetitionPenalty(
  parcel: LandParcel,
  competitors: CompetitorProject[],
  productType: ProductType,
): number {
  const sameProductNearbyCount = competitors.filter((competitor) => {
    const distanceKm = haversineDistanceKm(
      parcel.location.coordinates,
      competitor.location.coordinates,
    );

    return competitor.productType === productType && distanceKm <= 3.5;
  }).length;

  return scoreHigherIsBetter(
    sameProductNearbyCount,
    [
      { min: 6, score: 46 },
      { min: 4, score: 32 },
      { min: 2, score: 18 },
      { min: 1, score: 8 },
    ],
    0,
  );
}

function scoreAreaFit(
  areaRai: number,
  idealMinRai: number,
  idealMaxRai: number,
  viableMaxRai: number,
): number {
  if (areaRai >= idealMinRai && areaRai <= idealMaxRai) {
    return 100;
  }

  if (areaRai < idealMinRai) {
    const ratio = areaRai / idealMinRai;
    return clampScore(35 + ratio * 55);
  }

  if (areaRai <= viableMaxRai) {
    return clampScore(100 - ((areaRai - idealMaxRai) / viableMaxRai) * 35);
  }

  return 45;
}

function outerBangkokFamilyScore(parcel: LandParcel): number {
  const metroZoneScore =
    parcel.location.metroZone === "outerBangkok"
      ? 95
      : parcel.location.metroZone === "periUrban"
        ? 78
        : 52;
  const segmentScore = parcel.market.targetSegments.some((segment) =>
    ["midMarket", "upperMid"].includes(segment),
  )
    ? 92
    : 55;

  return weightedAverage([
    { value: metroZoneScore, weight: 0.45 },
    { value: segmentScore, weight: 0.55 },
  ]);
}

function premiumSegmentScore(parcel: LandParcel): number {
  if (parcel.market.targetSegments.includes("luxury")) {
    return 95;
  }

  if (parcel.market.targetSegments.includes("premium")) {
    return 88;
  }

  if (parcel.market.targetSegments.includes("upperMid")) {
    return 68;
  }

  return 42;
}

function cautionsFor(parcel: LandParcel, competitionPenalty: number): string[] {
  const cautions: string[] = [];

  if (competitionPenalty >= 30) {
    cautions.push("High same-product competition within the local trade area");
  }

  if (parcel.risk.flood === "high" || parcel.risk.flood === "severe") {
    cautions.push(`Flood risk is ${parcel.risk.flood}`);
  }

  if (parcel.site.ownershipComplexity === "fragmentedOwners") {
    cautions.push("Fragmented ownership may slow acquisition");
  }

  if (parcel.site.ownershipComplexity === "disputedTitle") {
    cautions.push("Title dispute requires legal clearance before commitment");
  }

  return cautions;
}
