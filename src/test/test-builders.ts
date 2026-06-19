import {
  LAND_POTENTIAL_SCORING_VERSION,
  LAND_POTENTIAL_SCORE_CATEGORIES,
  type CategoryScore,
  type CompetitorProject,
  type LandParcel,
  type LandPotentialScore,
  type MarketSignal,
  type ProductFitRecommendation,
  type RiskSignal,
  type ScoreCategoryId,
} from "../domain/index.js";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export function createParcel(overrides: DeepPartial<LandParcel> = {}): LandParcel {
  const base: LandParcel = {
    id: "LP-TEST-001",
    name: "Test Parcel",
    geometry: [
      { latitude: 13.7583, longitude: 100.5661 },
      { latitude: 13.7593, longitude: 100.5661 },
      { latitude: 13.7593, longitude: 100.5671 },
      { latitude: 13.7583, longitude: 100.5671 },
    ],
    location: {
      subdistrict: "Test",
      district: "Huai Khwang",
      province: "Bangkok",
      coordinates: { latitude: 13.7588, longitude: 100.5666 },
      nearestTransitStation: "MRT Test",
      strategicCorridor: "Test Corridor",
      metroZone: "innerBangkok",
    },
    site: {
      areaRai: 6,
      areaSqWah: 2400,
      frontageMeters: 60,
      roadWidthMeters: 18,
      shapeEfficiencyScore: 90,
      ownershipComplexity: "singleOwner",
    },
    planning: {
      zoningCode: "C5",
      zoningDescription: "Commercial high-density mixed-use zone",
      far: 8,
      buildabilityScore: 92,
      infrastructureReadinessScore: 90,
      allowableProductTypes: ["condominium", "mixedUse", "homeOfficeRetail"],
      gisLayerIds: [],
    },
    accessibility: {
      distanceToMassTransitMeters: 250,
      distanceToExpresswayKm: 1,
      distanceToCbdKm: 4,
      driveTimeToCbdMinutes: 15,
    },
    market: {
      primaryCatchment: "Test Catchment",
      targetSegments: ["upperMid", "premium"],
      estimatedResidentialPricePerSqm: 170000,
      demandDepthScore: 88,
    },
    financials: {
      askingPricePerSqWah: 900000,
      targetLandCostPerSqWah: 1000000,
      estimatedGrossMarginPct: 28,
      capexComplexityScore: 88,
    },
    risk: {
      flood: "low",
      legal: "low",
      environmental: "low",
      communityPolitical: "low",
    },
    controlStatus: "opportunity",
    tags: ["test"],
  };

  return mergeDeep(base, overrides);
}

export function createMarketSignal(
  overrides: DeepPartial<MarketSignal> = {},
): MarketSignal {
  return mergeDeep(
    {
      id: "MS-TEST-001",
      district: "Huai Khwang",
      province: "Bangkok",
      productType: "condominium",
      segment: "upperMid",
      period: "2026-Q2",
      source: "test",
      demandIndex: 90,
      absorptionUnitsPerMonth: 82,
      priceGrowthPctYoY: 6,
      inventoryMonths: 8,
      confidence: 88,
    } satisfies MarketSignal,
    overrides,
  );
}

export function createCompetitor(
  overrides: DeepPartial<CompetitorProject> = {},
): CompetitorProject {
  return mergeDeep(
    {
      id: "CP-TEST-001",
      name: "Nearby Test Condo",
      developer: "Test Developer",
      productType: "condominium",
      segment: "upperMid",
      location: {
        district: "Huai Khwang",
        province: "Bangkok",
        coordinates: { latitude: 13.7595, longitude: 100.567 },
      },
      units: 420,
      launchedYear: 2025,
      salesRatePct: 76,
      averagePricePerSqm: 180000,
      distanceToMassTransitMeters: 300,
      status: "selling",
    } satisfies CompetitorProject,
    overrides,
  );
}

export function createRiskSignal(
  overrides: DeepPartial<RiskSignal> = {},
): RiskSignal {
  return mergeDeep(
    {
      id: "RS-TEST-001",
      parcelId: "LP-TEST-001",
      type: "flood",
      severity: 2,
      probability: 0.25,
      mitigatable: true,
      description: "Test risk",
    } satisfies RiskSignal,
    overrides,
  );
}

export function createScore(
  categoryRawScores: Partial<Record<ScoreCategoryId, number>> = {},
  totalScore = 80,
): LandPotentialScore {
  const categories = Object.fromEntries(
    LAND_POTENTIAL_SCORE_CATEGORIES.map((category) => {
      const rawScore = categoryRawScores[category.id] ?? totalScore;
      const categoryScore: CategoryScore = {
        ...category,
        rawScore,
        weightedScore: Math.round(rawScore * category.weight) / 100,
        evidence: ["test"],
      };

      return [category.id, categoryScore];
    }),
  ) as Record<ScoreCategoryId, CategoryScore>;

  return {
    totalScore,
    grade: totalScore >= 85 ? "A" : totalScore >= 70 ? "B" : "C",
    categories,
    scoringVersion: LAND_POTENTIAL_SCORING_VERSION,
  };
}

export function createProductFit(
  score = 78,
  productType: ProductFitRecommendation["topFit"]["productType"] = "condominium",
): ProductFitRecommendation {
  return {
    topFit: {
      productType,
      segment: "upperMid",
      score,
      rationale: "test",
      fitDrivers: ["test"],
      cautions: [],
    },
    rankedFits: [
      {
        productType,
        segment: "upperMid",
        score,
        rationale: "test",
        fitDrivers: ["test"],
        cautions: [],
      },
    ],
  };
}

function mergeDeep<T>(base: T, overrides: DeepPartial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(overrides)) {
    return (overrides === undefined ? base : overrides) as T;
  }

  const result: Record<string, unknown> = { ...base };

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    const baseValue = result[key];

    if (Array.isArray(value)) {
      result[key] = value;
      return;
    }

    if (isPlainObject(baseValue) && isPlainObject(value)) {
      result[key] = mergeDeep(baseValue, value);
      return;
    }

    result[key] = value;
  });

  return result as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
