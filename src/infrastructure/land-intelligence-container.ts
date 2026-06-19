import { ListLandOpportunitiesUseCase } from "../application/list-land-opportunities.use-case.js";
import { type LandIntelligenceAssessment } from "../domain/index.js";
import { createDemoLandIntelligenceRepositories } from "./in-memory-land-intelligence-repositories.js";

export type PortfolioSummary = {
  parcelCount: number;
  totalOpportunityValueMillionBaht: number;
  averageScore: number;
  averageConfidence: number;
  buyOrDevelopCount: number;
};

const repositories = createDemoLandIntelligenceRepositories();
const listLandOpportunities = new ListLandOpportunitiesUseCase(repositories);

export const landIntelligenceService = {
  async listAssessments(): Promise<LandIntelligenceAssessment[]> {
    return listLandOpportunities.execute();
  },

  async portfolioSummary(): Promise<PortfolioSummary> {
    const assessments = await listLandOpportunities.execute();

    if (assessments.length === 0) {
      return {
        parcelCount: 0,
        totalOpportunityValueMillionBaht: 0,
        averageScore: 0,
        averageConfidence: 0,
        buyOrDevelopCount: 0,
      };
    }

    return {
      parcelCount: assessments.length,
      totalOpportunityValueMillionBaht: roundOne(
        assessments.reduce(
          (sum, assessment) =>
            sum +
            (assessment.parcel.financials.askingPricePerSqWah *
              assessment.parcel.site.areaSqWah) /
              1_000_000,
          0,
        ),
      ),
      averageScore: roundOne(
        assessments.reduce(
          (sum, assessment) => sum + assessment.score.totalScore,
          0,
        ) / assessments.length,
      ),
      averageConfidence: roundOne(
        assessments.reduce(
          (sum, assessment) =>
            sum + normalizeConfidence(assessment.decision.confidence),
          0,
        ) / assessments.length,
      ),
      buyOrDevelopCount: assessments.filter((assessment) =>
        ["buy", "develop"].includes(assessment.decision.decision),
      ).length,
    };
  },
};

function normalizeConfidence(value: number): number {
  return value > 1 ? value / 100 : value;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
