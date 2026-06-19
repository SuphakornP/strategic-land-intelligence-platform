import {
  calculateLandPotentialScore,
  recommendLandDecision,
  recommendProductFit,
  type LandIntelligenceAssessment,
} from "../domain/index.js";
import { type LandIntelligenceRepositories } from "./repositories.js";

export class LandParcelNotFoundError extends Error {
  constructor(parcelId: string) {
    super(`Land parcel not found: ${parcelId}`);
    this.name = "LandParcelNotFoundError";
  }
}

export class EvaluateLandParcelUseCase {
  constructor(private readonly repositories: LandIntelligenceRepositories) {}

  async execute(parcelId: string): Promise<LandIntelligenceAssessment> {
    const parcel = await this.repositories.parcels.findById(parcelId);

    if (!parcel) {
      throw new LandParcelNotFoundError(parcelId);
    }

    const [nearbyCompetitors, marketSignals, riskSignals, gisLayers] =
      await Promise.all([
        this.repositories.competitors.findNearParcel(parcel, 3.5),
        this.repositories.marketSignals.findRelevant(parcel),
        this.repositories.riskSignals.findForParcel(parcel),
        this.repositories.gisLayers.findForParcel(parcel),
      ]);

    const score = calculateLandPotentialScore({
      parcel,
      competitors: nearbyCompetitors,
      marketSignals,
      riskSignals,
      gisLayers,
    });
    const productFit = recommendProductFit({
      parcel,
      marketSignals,
      competitors: nearbyCompetitors,
    });
    const decision = recommendLandDecision({
      parcel,
      score,
      productFit,
      riskSignals,
    });

    return {
      parcel,
      score,
      productFit,
      decision,
      nearbyCompetitors,
      marketSignals,
      riskSignals,
    };
  }
}
