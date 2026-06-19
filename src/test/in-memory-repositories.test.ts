import { describe, expect, it } from "vitest";
import { EvaluateLandParcelUseCase } from "../application/index.js";
import {
  createDemoLandIntelligenceRepositories,
  InMemoryCompetitorProjectRepository,
  InMemoryLandParcelRepository,
  InMemoryMarketSignalRepository,
  sampleCompetitorProjects,
  sampleLandParcels,
  sampleMarketSignals,
} from "../infrastructure/index.js";

describe("in-memory land intelligence repositories", () => {
  it("selects parcels by geography, product type, and area", async () => {
    const repository = new InMemoryLandParcelRepository(sampleLandParcels);

    const parcels = await repository.findBySelector({
      province: "กรุงเทพฯ",
      metroZone: "outerBangkok",
      productType: "mixedUse",
      minAreaRai: 10,
    });

    expect(parcels.map((parcel) => parcel.id)).toEqual(["AP-LAND-BNK-022"]);
  });

  it("selects pipeline parcels by status, price ceiling, and tags", async () => {
    const repository = new InMemoryLandParcelRepository(sampleLandParcels);

    const parcels = await repository.findBySelector({
      controlStatus: "opportunity",
      maxAskingPricePerSqWah: 300000,
      tags: ["mixed-use"],
    });

    expect(parcels.map((parcel) => parcel.id)).toEqual(["AP-LAND-BNK-022"]);
  });

  it("returns nearby competitors sorted by distance", async () => {
    const parcel = sampleLandParcels.find((item) => item.id === "AP-LAND-BNK-014");
    const repository = new InMemoryCompetitorProjectRepository(
      sampleCompetitorProjects,
    );

    if (!parcel) {
      throw new Error("Expected Rama 9 sample parcel");
    }

    const competitors = await repository.findNearParcel(parcel, 2);

    expect(competitors.map((competitor) => competitor.id)).toEqual([
      "COMP-IDEO-R9",
      "COMP-NUE-R9",
    ]);
    expect(competitors[0]?.distanceKm).toBeLessThanOrEqual(
      competitors[1]?.distanceKm ?? Number.POSITIVE_INFINITY,
    );
  });

  it("filters market signals by parcel and requested product type", async () => {
    const parcel = sampleLandParcels.find((item) => item.id === "AP-LAND-BNK-022");
    const repository = new InMemoryMarketSignalRepository(sampleMarketSignals);

    if (!parcel) {
      throw new Error("Expected Bang Na sample parcel");
    }

    const townhomeSignals = await repository.findRelevant(parcel, "townhome");

    expect(townhomeSignals.map((signal) => signal.id)).toEqual(["MKT-BANGNA-MIX"]);
  });

  it("supports end-to-end sample parcel assessment through the use case", async () => {
    const repositories = createDemoLandIntelligenceRepositories();
    const useCase = new EvaluateLandParcelUseCase(repositories);

    const bangNa = await useCase.execute("AP-LAND-BNK-022");
    const rangsit = await useCase.execute("AP-LAND-PTT-031");

    expect(bangNa.score.totalScore).toBeGreaterThan(60);
    expect(bangNa.productFit.rankedFits.length).toBeGreaterThan(0);
    expect(rangsit.decision.decision).toBe("no-go");
    expect(rangsit.decision.blockingRisks).toContain("ราคาเสนอสูงกว่า benchmark");
  });
});
