import { describe, expect, it } from "vitest";
import { recommendLandDecision } from "../domain/index.js";
import {
  createParcel,
  createProductFit,
  createRiskSignal,
  createScore,
} from "./test-builders.js";

describe("recommendLandDecision", () => {
  it("recommends develop for controlled, high-scoring land", () => {
    const recommendation = recommendLandDecision({
      parcel: createParcel({ controlStatus: "owned" }),
      score: createScore(
        {
          planningBuildability: 82,
          marketDemand: 78,
          landCostFeasibility: 84,
          riskConstraint: 76,
        },
        81,
      ),
      productFit: createProductFit(82, "townhome"),
    });

    expect(recommendation.decision).toBe("develop");
    expect(recommendation.reasons.join(" ")).toContain("Controlled parcel");
  });

  it("recommends buy for an acquisition opportunity with strong fit and feasible cost", () => {
    const recommendation = recommendLandDecision({
      parcel: createParcel({ controlStatus: "opportunity" }),
      score: createScore(
        {
          landCostFeasibility: 72,
          riskConstraint: 80,
        },
        84,
      ),
      productFit: createProductFit(86, "condominium"),
    });

    expect(recommendation.decision).toBe("buy");
    expect(recommendation.nextActions).toContain(
      "Proceed to negotiation gate and exclusivity request",
    );
  });

  it("recommends no-go when a blocking risk exists despite strong score", () => {
    const recommendation = recommendLandDecision({
      parcel: createParcel({
        risk: {
          criticalFlags: ["Unresolved title litigation"],
        },
      }),
      score: createScore(
        {
          landCostFeasibility: 88,
          riskConstraint: 72,
        },
        86,
      ),
      productFit: createProductFit(88, "mixedUse"),
      riskSignals: [
        createRiskSignal({
          severity: 5,
          probability: 0.8,
          mitigatable: false,
          description: "Court injunction blocks transfer",
        }),
      ],
    });

    expect(recommendation.decision).toBe("no-go");
    expect(recommendation.blockingRisks).toEqual([
      "Unresolved title litigation",
      "Court injunction blocks transfer",
    ]);
  });

  it("recommends hold when the score is investable but not decisive", () => {
    const recommendation = recommendLandDecision({
      parcel: createParcel({ controlStatus: "underOption" }),
      score: createScore(
        {
          landCostFeasibility: 60,
          riskConstraint: 62,
        },
        66,
      ),
      productFit: createProductFit(68, "townhome"),
    });

    expect(recommendation.decision).toBe("hold");
    expect(recommendation.reasons.join(" ")).toContain("not decisive");
  });
});
