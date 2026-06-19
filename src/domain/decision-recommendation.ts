import {
  type DecisionRecommendation,
  type LandParcel,
  type LandPotentialScore,
  type ProductFitRecommendation,
  type RiskSignal,
} from "./land-intelligence-types.js";

export interface DecisionRecommendationInput {
  parcel: LandParcel;
  score: LandPotentialScore;
  productFit: ProductFitRecommendation;
  riskSignals?: RiskSignal[];
}

export function recommendLandDecision(
  input: DecisionRecommendationInput,
): DecisionRecommendation {
  const riskSignals = input.riskSignals ?? [];
  const blockingRisks = findBlockingRisks(input.parcel, riskSignals);
  const riskScore = input.score.categories.riskConstraint.rawScore;
  const feasibilityScore = input.score.categories.landCostFeasibility.rawScore;
  const planningScore = input.score.categories.planningBuildability.rawScore;
  const marketScore = input.score.categories.marketDemand.rawScore;
  const topFit = input.productFit.topFit;

  if (
    blockingRisks.length > 0 ||
    input.score.totalScore < 55 ||
    riskScore < 35 ||
    feasibilityScore < 35 ||
    topFit.score < 45
  ) {
    return {
      decision: "no-go",
      confidence: blockingRisks.length > 0 ? 92 : 78,
      reasons: compactReasons([
        blockingRisks.length > 0
          ? `Blocking risk: ${blockingRisks[0]}`
          : undefined,
        input.score.totalScore < 55
          ? `Total score ${input.score.totalScore} is below investment threshold`
          : undefined,
        riskScore < 35 ? `Risk score ${riskScore} is too weak` : undefined,
        feasibilityScore < 35
          ? `Land cost feasibility ${feasibilityScore} is too weak`
          : undefined,
        topFit.score < 45
          ? `Top product fit ${topFit.score} is below minimum viable fit`
          : undefined,
      ]),
      nextActions: [
        "Archive opportunity or revisit only if risk, title, or price materially changes",
      ],
      blockingRisks,
    };
  }

  if (
    ["owned", "landBank"].includes(input.parcel.controlStatus) &&
    input.score.totalScore >= 72 &&
    planningScore >= 65 &&
    marketScore >= 60 &&
    topFit.score >= 65
  ) {
    return {
      decision: "develop",
      confidence: confidenceFromScore(input.score.totalScore, topFit.score),
      reasons: [
        `Controlled parcel with total score ${input.score.totalScore}`,
        `Planning score ${planningScore} and market score ${marketScore} support launch readiness`,
        `${topFit.productType} is the strongest product fit at ${topFit.score}`,
      ],
      nextActions: [
        "Start concept feasibility and launch phasing",
        "Validate permitting path, unit mix, and target pricing",
      ],
      blockingRisks,
    };
  }

  if (
    ["opportunity", "underOption"].includes(input.parcel.controlStatus) &&
    input.score.totalScore >= 78 &&
    topFit.score >= 70 &&
    feasibilityScore >= 55 &&
    riskScore >= 50
  ) {
    return {
      decision: "buy",
      confidence: confidenceFromScore(input.score.totalScore, topFit.score),
      reasons: [
        `Acquisition candidate with total score ${input.score.totalScore}`,
        `Land cost feasibility ${feasibilityScore} clears acquisition threshold`,
        `${topFit.productType} fit score ${topFit.score} provides a credible development thesis`,
      ],
      nextActions: [
        "Proceed to negotiation gate and exclusivity request",
        "Commission legal, flood, and infrastructure due diligence",
      ],
      blockingRisks,
    };
  }

  if (
    input.score.totalScore >= 60 ||
    (input.parcel.location.strategicCorridor && input.score.totalScore >= 55)
  ) {
    return {
      decision: "hold",
      confidence: 64,
      reasons: [
        `Total score ${input.score.totalScore} is investable but not decisive`,
        `Top fit ${topFit.productType} scored ${topFit.score}`,
        holdReason(input.parcel.controlStatus),
      ],
      nextActions: [
        "Keep in pipeline and monitor price, planning, and demand signals",
        "Re-score after material change in title, infrastructure, or launch conditions",
      ],
      blockingRisks,
    };
  }

  return {
    decision: "no-go",
    confidence: 72,
    reasons: [
      `Total score ${input.score.totalScore} does not justify continued pursuit`,
      `Best product fit is ${topFit.productType} at ${topFit.score}`,
    ],
    nextActions: ["Close current review cycle and retain data for benchmarking"],
    blockingRisks,
  };
}

function findBlockingRisks(
  parcel: LandParcel,
  riskSignals: RiskSignal[],
): string[] {
  const parcelFlags = parcel.risk.criticalFlags ?? [];
  const criticalSignals = riskSignals
    .filter(
      (signal) =>
        signal.severity === 5 && !signal.mitigatable && signal.probability >= 0.65,
    )
    .map((signal) => signal.description);

  return [...parcelFlags, ...criticalSignals];
}

function compactReasons(
  reasons: Array<string | undefined>,
): string[] {
  return reasons.filter((reason): reason is string => Boolean(reason));
}

function confidenceFromScore(totalScore: number, topFitScore: number): number {
  return Math.min(92, Math.round(60 + (totalScore - 70) * 1.2 + (topFitScore - 65) * 0.5));
}

function holdReason(controlStatus: LandParcel["controlStatus"]): string {
  switch (controlStatus) {
    case "landBank":
    case "owned":
      return "Controlled land should wait for clearer launch economics";
    case "opportunity":
    case "underOption":
      return "Acquisition should wait for stronger evidence or pricing";
  }
}
