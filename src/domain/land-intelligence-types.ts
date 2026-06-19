export type ParcelId = string;
export type CompetitorProjectId = string;
export type MarketSignalId = string;
export type RiskSignalId = string;
export type GISLayerId = string;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type BangkokMetroZone = "innerBangkok" | "outerBangkok" | "periUrban";

export type ControlStatus = "opportunity" | "underOption" | "landBank" | "owned";

export type ProductType =
  | "condominium"
  | "townhome"
  | "singleDetached"
  | "mixedUse"
  | "homeOfficeRetail";

export type MarketSegment =
  | "affordable"
  | "midMarket"
  | "upperMid"
  | "premium"
  | "luxury";

export type RiskLevel = "low" | "medium" | "high" | "severe";

export interface LandParcel {
  id: ParcelId;
  name: string;
  geometry: Coordinates[];
  location: {
    subdistrict?: string;
    district: string;
    province: string;
    coordinates: Coordinates;
    nearestTransitStation?: string;
    strategicCorridor?: string;
    metroZone: BangkokMetroZone;
  };
  site: {
    areaRai: number;
    areaSqWah: number;
    frontageMeters: number;
    roadWidthMeters: number;
    shapeEfficiencyScore: number;
    ownershipComplexity:
      | "singleOwner"
      | "multipleCooperativeOwners"
      | "fragmentedOwners"
      | "disputedTitle";
  };
  planning: {
    zoningCode: string;
    zoningDescription: string;
    far: number;
    buildabilityScore: number;
    infrastructureReadinessScore: number;
    allowableProductTypes: ProductType[];
    gisLayerIds: GISLayerId[];
    constraintNotes?: string[];
  };
  accessibility: {
    distanceToMassTransitMeters: number;
    distanceToExpresswayKm: number;
    distanceToCbdKm: number;
    driveTimeToCbdMinutes: number;
  };
  market: {
    primaryCatchment: string;
    targetSegments: MarketSegment[];
    estimatedResidentialPricePerSqm: number;
    demandDepthScore: number;
  };
  financials: {
    askingPricePerSqWah: number;
    targetLandCostPerSqWah: number;
    estimatedGrossMarginPct: number;
    capexComplexityScore: number;
  };
  risk: {
    flood: RiskLevel;
    legal: RiskLevel;
    environmental: RiskLevel;
    communityPolitical: RiskLevel;
    criticalFlags?: string[];
  };
  controlStatus: ControlStatus;
  tags?: string[];
}

export interface GISLayer {
  id: GISLayerId;
  name: string;
  type:
    | "zoning"
    | "transport"
    | "flood"
    | "environment"
    | "infrastructure"
    | "ownership";
  appliesToParcelIds?: ParcelId[];
  district?: string;
  province?: string;
  attributes: Record<string, string | number | boolean>;
}

export interface CompetitorProject {
  id: CompetitorProjectId;
  name: string;
  developer: string;
  productType: ProductType;
  segment: MarketSegment;
  location: {
    district: string;
    province: string;
    coordinates: Coordinates;
  };
  units: number;
  launchedYear: number;
  salesRatePct: number;
  averagePricePerSqm: number;
  distanceToMassTransitMeters?: number;
  status: "selling" | "recentlySoldOut" | "planned";
}

export interface NearbyCompetitorProject extends CompetitorProject {
  distanceKm: number;
}

export interface MarketSignal {
  id: MarketSignalId;
  district: string;
  province: string;
  productType?: ProductType;
  segment?: MarketSegment;
  period: string;
  source: string;
  demandIndex: number;
  absorptionUnitsPerMonth: number;
  priceGrowthPctYoY: number;
  inventoryMonths: number;
  confidence: number;
}

export interface RiskSignal {
  id: RiskSignalId;
  parcelId?: ParcelId;
  district?: string;
  province?: string;
  type:
    | "flood"
    | "legal"
    | "environment"
    | "infrastructure"
    | "community"
    | "market";
  severity: 1 | 2 | 3 | 4 | 5;
  probability: number;
  mitigatable: boolean;
  description: string;
}

export type ScoreCategoryId =
  | "locationAccessibility"
  | "planningBuildability"
  | "marketDemand"
  | "competitivePosition"
  | "landCostFeasibility"
  | "riskConstraint";

export interface ScoreCategoryDefinition {
  id: ScoreCategoryId;
  label: string;
  weight: number;
}

export interface CategoryScore extends ScoreCategoryDefinition {
  rawScore: number;
  weightedScore: number;
  evidence: string[];
}

export interface LandPotentialScore {
  totalScore: number;
  grade: "A" | "B" | "C" | "D" | "E";
  categories: Record<ScoreCategoryId, CategoryScore>;
  scoringVersion: string;
}

export interface ProductFit {
  productType: ProductType;
  segment: MarketSegment;
  score: number;
  rationale: string;
  fitDrivers: string[];
  cautions: string[];
}

export interface ProductFitRecommendation {
  topFit: ProductFit;
  rankedFits: ProductFit[];
}

export type LandDecision = "buy" | "hold" | "develop" | "no-go";

export interface DecisionRecommendation {
  decision: LandDecision;
  confidence: number;
  reasons: string[];
  nextActions: string[];
  blockingRisks: string[];
}

export interface LandIntelligenceAssessment {
  parcel: LandParcel;
  score: LandPotentialScore;
  productFit: ProductFitRecommendation;
  decision: DecisionRecommendation;
  nearbyCompetitors: NearbyCompetitorProject[];
  marketSignals: MarketSignal[];
  riskSignals: RiskSignal[];
}
