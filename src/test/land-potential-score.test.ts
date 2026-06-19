import { describe, expect, it } from "vitest";
import {
  LAND_POTENTIAL_SCORE_CATEGORIES,
  calculateLandPotentialScore,
} from "../domain/index.js";
import {
  createCompetitor,
  createMarketSignal,
  createParcel,
  createRiskSignal,
} from "./test-builders.js";

describe("calculateLandPotentialScore", () => {
  it("uses the AP Thailand category weights that sum to 100", () => {
    const totalWeight = LAND_POTENTIAL_SCORE_CATEGORIES.reduce(
      (sum, category) => sum + category.weight,
      0,
    );

    expect(totalWeight).toBe(100);
    expect(LAND_POTENTIAL_SCORE_CATEGORIES.map((category) => category.weight)).toEqual([
      25, 20, 20, 15, 10, 10,
    ]);
  });

  it("keeps every category score bounded and totals the weighted scores", () => {
    const score = calculateLandPotentialScore({
      parcel: createParcel(),
      marketSignals: [createMarketSignal()],
      competitors: [createCompetitor()],
      riskSignals: [createRiskSignal()],
    });

    const weightedTotal = Object.values(score.categories).reduce(
      (sum, category) => sum + category.weightedScore,
      0,
    );

    expect(score.totalScore).toBeGreaterThan(80);
    expect(score.totalScore).toBeCloseTo(weightedTotal, 1);

    Object.values(score.categories).forEach((category) => {
      expect(category.rawScore).toBeGreaterThanOrEqual(0);
      expect(category.rawScore).toBeLessThanOrEqual(100);
      expect(category.weightedScore).toBeGreaterThanOrEqual(0);
      expect(category.weightedScore).toBeLessThanOrEqual(category.weight);
      expect(category.evidence.length).toBeGreaterThan(0);
    });
  });

  it("drives low-access, low-buildability, high-risk land below investment grade", () => {
    const parcel = createParcel({
      site: {
        areaRai: 50,
        roadWidthMeters: 4,
        frontageMeters: 8,
        shapeEfficiencyScore: 35,
        ownershipComplexity: "disputedTitle",
      },
      planning: {
        far: 1.2,
        buildabilityScore: 28,
        infrastructureReadinessScore: 25,
        allowableProductTypes: ["singleDetached"],
      },
      accessibility: {
        distanceToMassTransitMeters: 5200,
        distanceToExpresswayKm: 14,
        distanceToCbdKm: 48,
      },
      market: {
        targetSegments: ["affordable"],
        estimatedResidentialPricePerSqm: 42000,
        demandDepthScore: 30,
      },
      financials: {
        askingPricePerSqWah: 280000,
        targetLandCostPerSqWah: 170000,
        estimatedGrossMarginPct: 7,
        capexComplexityScore: 20,
      },
      risk: {
        flood: "severe",
        legal: "high",
        environmental: "high",
        communityPolitical: "medium",
        criticalFlags: ["Known expropriation conflict"],
      },
    });

    const score = calculateLandPotentialScore({
      parcel,
      marketSignals: [
        createMarketSignal({
          productType: "singleDetached",
          segment: "affordable",
          demandIndex: 35,
          absorptionUnitsPerMonth: 12,
          priceGrowthPctYoY: -1,
          inventoryMonths: 30,
          confidence: 60,
        }),
      ],
      riskSignals: [
        createRiskSignal({
          severity: 5,
          probability: 0.75,
          mitigatable: false,
          description: "Unmitigated severe flood exposure",
        }),
      ],
    });

    expect(score.totalScore).toBeLessThan(45);
    expect(score.grade).toBe("E");
    expect(score.categories.riskConstraint.rawScore).toBeLessThanOrEqual(30);
  });

  it("caps risk and constraint score when an unmitigable critical signal applies", () => {
    const score = calculateLandPotentialScore({
      parcel: createParcel(),
      marketSignals: [createMarketSignal()],
      riskSignals: [
        createRiskSignal({
          severity: 5,
          probability: 0.7,
          mitigatable: false,
          description: "Critical legal defect",
        }),
      ],
    });

    expect(score.categories.riskConstraint.rawScore).toBeLessThanOrEqual(30);
  });
});
