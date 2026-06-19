import {
  type CompetitorProject,
  type GISLayer,
  type LandParcel,
  type MarketSignal,
  type NearbyCompetitorProject,
  type ProductType,
  type RiskSignal,
} from "../domain/land-intelligence-types.js";
import {
  type CompetitorProjectRepository,
  type GISLayerRepository,
  type LandIntelligenceRepositories,
  type LandParcelRepository,
  type LandParcelSelector,
  type MarketSignalRepository,
  type RiskSignalRepository,
} from "../application/repositories.js";
import { haversineDistanceKm, round } from "../shared/math.js";
import {
  sampleCompetitorProjects,
  sampleGISLayers,
  sampleLandParcels,
  sampleMarketSignals,
  sampleRiskSignals,
} from "./sample-land-intelligence-data.js";

export class InMemoryLandParcelRepository implements LandParcelRepository {
  constructor(private readonly parcels: LandParcel[] = sampleLandParcels) {}

  async list(): Promise<LandParcel[]> {
    return [...this.parcels];
  }

  async findById(id: string): Promise<LandParcel | undefined> {
    return this.parcels.find((parcel) => parcel.id === id);
  }

  async findBySelector(selector: LandParcelSelector): Promise<LandParcel[]> {
    return this.parcels.filter((parcel) => {
      const districtMatches =
        selector.district === undefined ||
        normalize(parcel.location.district) === normalize(selector.district);
      const provinceMatches =
        selector.province === undefined ||
        normalize(parcel.location.province) === normalize(selector.province);
      const metroZoneMatches =
        selector.metroZone === undefined ||
        parcel.location.metroZone === selector.metroZone;
      const controlStatusMatches =
        selector.controlStatus === undefined ||
        parcel.controlStatus === selector.controlStatus;
      const minAreaMatches =
        selector.minAreaRai === undefined ||
        parcel.site.areaRai >= selector.minAreaRai;
      const maxAreaMatches =
        selector.maxAreaRai === undefined ||
        parcel.site.areaRai <= selector.maxAreaRai;
      const askingPriceMatches =
        selector.maxAskingPricePerSqWah === undefined ||
        parcel.financials.askingPricePerSqWah <= selector.maxAskingPricePerSqWah;
      const productMatches =
        selector.productType === undefined ||
        parcel.planning.allowableProductTypes.includes(selector.productType);
      const tagMatches =
        selector.tags === undefined ||
        selector.tags.every((tag) => parcel.tags?.includes(tag));

      return (
        districtMatches &&
        provinceMatches &&
        metroZoneMatches &&
        controlStatusMatches &&
        minAreaMatches &&
        maxAreaMatches &&
        askingPriceMatches &&
        productMatches &&
        tagMatches
      );
    });
  }
}

export class InMemoryCompetitorProjectRepository
  implements CompetitorProjectRepository
{
  constructor(
    private readonly competitors: CompetitorProject[] = sampleCompetitorProjects,
  ) {}

  async findNearParcel(
    parcel: LandParcel,
    radiusKm = 3.5,
  ): Promise<NearbyCompetitorProject[]> {
    return this.competitors
      .map((competitor) => ({
        ...competitor,
        distanceKm: round(
          haversineDistanceKm(
            parcel.location.coordinates,
            competitor.location.coordinates,
          ),
          2,
        ),
      }))
      .filter((competitor) => competitor.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
}

export class InMemoryMarketSignalRepository implements MarketSignalRepository {
  constructor(private readonly signals: MarketSignal[] = sampleMarketSignals) {}

  async findRelevant(
    parcel: LandParcel,
    productType?: ProductType,
  ): Promise<MarketSignal[]> {
    return this.signals
      .filter((signal) => {
        const sameDistrict =
          normalize(signal.district) === normalize(parcel.location.district);
        const sameProvince =
          normalize(signal.province) === normalize(parcel.location.province);
        const productMatches =
          productType === undefined
            ? !signal.productType ||
              parcel.planning.allowableProductTypes.includes(signal.productType)
            : !signal.productType || signal.productType === productType;
        const segmentMatches =
          !signal.segment || parcel.market.targetSegments.includes(signal.segment);

        return sameDistrict && sameProvince && productMatches && segmentMatches;
      })
      .sort((a, b) => b.confidence - a.confidence);
  }
}

export class InMemoryRiskSignalRepository implements RiskSignalRepository {
  constructor(private readonly signals: RiskSignal[] = sampleRiskSignals) {}

  async findForParcel(parcel: LandParcel): Promise<RiskSignal[]> {
    return this.signals.filter((signal) => {
      const parcelMatches = signal.parcelId === parcel.id;
      const districtMatches =
        signal.district !== undefined &&
        normalize(signal.district) === normalize(parcel.location.district);
      const provinceMatches =
        signal.province !== undefined &&
        normalize(signal.province) === normalize(parcel.location.province);
      const broadProvinceMatches =
        signal.district === undefined &&
        signal.province !== undefined &&
        normalize(signal.province) === normalize(parcel.location.province);

      return parcelMatches || (districtMatches && provinceMatches) || broadProvinceMatches;
    });
  }
}

export class InMemoryGISLayerRepository implements GISLayerRepository {
  constructor(private readonly layers: GISLayer[] = sampleGISLayers) {}

  async findForParcel(parcel: LandParcel): Promise<GISLayer[]> {
    return this.layers.filter((layer) => {
      const parcelMatches = layer.appliesToParcelIds?.includes(parcel.id) ?? false;
      const districtMatches =
        layer.district !== undefined &&
        normalize(layer.district) === normalize(parcel.location.district);
      const provinceMatches =
        layer.province !== undefined &&
        normalize(layer.province) === normalize(parcel.location.province);

      return parcelMatches || (districtMatches && provinceMatches);
    });
  }
}

export function createDemoLandIntelligenceRepositories(): LandIntelligenceRepositories {
  return {
    parcels: new InMemoryLandParcelRepository(),
    competitors: new InMemoryCompetitorProjectRepository(),
    marketSignals: new InMemoryMarketSignalRepository(),
    riskSignals: new InMemoryRiskSignalRepository(),
    gisLayers: new InMemoryGISLayerRepository(),
  };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
