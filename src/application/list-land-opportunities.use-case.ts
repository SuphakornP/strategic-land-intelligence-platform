import {
  type LandDecision,
  type LandIntelligenceAssessment,
  type ProductType,
} from "../domain/index.js";
import { EvaluateLandParcelUseCase } from "./evaluate-land-parcel.use-case.js";
import {
  type LandIntelligenceRepositories,
  type LandParcelSelector,
} from "./repositories.js";

export interface LandOpportunityQuery extends LandParcelSelector {
  minScore?: number;
  decisions?: LandDecision[];
  topProductType?: ProductType;
}

export class ListLandOpportunitiesUseCase {
  private readonly evaluator: EvaluateLandParcelUseCase;

  constructor(private readonly repositories: LandIntelligenceRepositories) {
    this.evaluator = new EvaluateLandParcelUseCase(repositories);
  }

  async execute(query: LandOpportunityQuery = {}): Promise<LandIntelligenceAssessment[]> {
    const parcels = await this.repositories.parcels.findBySelector(query);
    const assessments = await Promise.all(
      parcels.map((parcel) => this.evaluator.execute(parcel.id)),
    );

    return assessments
      .filter((assessment) => {
        const scoreMatches =
          query.minScore === undefined ||
          assessment.score.totalScore >= query.minScore;
        const decisionMatches =
          !query.decisions ||
          query.decisions.includes(assessment.decision.decision);
        const productMatches =
          !query.topProductType ||
          assessment.productFit.topFit.productType === query.topProductType;

        return scoreMatches && decisionMatches && productMatches;
      })
      .sort((a, b) => b.score.totalScore - a.score.totalScore);
  }
}
