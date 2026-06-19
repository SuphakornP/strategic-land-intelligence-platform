import {
  type BangkokMetroZone,
  type ControlStatus,
  type GISLayer,
  type LandParcel,
  type MarketSignal,
  type NearbyCompetitorProject,
  type ProductType,
  type RiskSignal,
} from "../domain/land-intelligence-types.js";

export interface LandParcelSelector {
  district?: string;
  province?: string;
  metroZone?: BangkokMetroZone;
  controlStatus?: ControlStatus;
  minAreaRai?: number;
  maxAreaRai?: number;
  maxAskingPricePerSqWah?: number;
  productType?: ProductType;
  tags?: string[];
}

export interface LandParcelRepository {
  list(): Promise<LandParcel[]>;
  findById(id: string): Promise<LandParcel | undefined>;
  findBySelector(selector: LandParcelSelector): Promise<LandParcel[]>;
}

export interface CompetitorProjectRepository {
  findNearParcel(
    parcel: LandParcel,
    radiusKm?: number,
  ): Promise<NearbyCompetitorProject[]>;
}

export interface MarketSignalRepository {
  findRelevant(parcel: LandParcel, productType?: ProductType): Promise<MarketSignal[]>;
}

export interface RiskSignalRepository {
  findForParcel(parcel: LandParcel): Promise<RiskSignal[]>;
}

export interface GISLayerRepository {
  findForParcel(parcel: LandParcel): Promise<GISLayer[]>;
}

export interface LandIntelligenceRepositories {
  parcels: LandParcelRepository;
  competitors: CompetitorProjectRepository;
  marketSignals: MarketSignalRepository;
  riskSignals: RiskSignalRepository;
  gisLayers: GISLayerRepository;
}
