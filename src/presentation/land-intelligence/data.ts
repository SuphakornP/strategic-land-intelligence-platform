import {
  type LandDecision,
  type LandIntelligenceAssessment,
  type ScoreCategoryId,
} from "../../domain/land-intelligence-types";
import { landIntelligenceService } from "../../infrastructure/land-intelligence-container";

export type DecisionTone = "go" | "watch" | "hold";

export type ScoreLine = {
  id: ScoreCategoryId;
  label: string;
  value: number;
  weight: number;
  evidence: string[];
};

export type Parcel = {
  id: string;
  name: string;
  district: string;
  corridor: string;
  status: string;
  areaRai: number;
  askingPriceM: number;
  score: number;
  confidence: number;
  decision: LandDecision;
  decisionTone: DecisionTone;
  recommendedDecision: string;
  decisionReason: string;
  nextActions: string[];
  center: [number, number];
  coordinates: [number, number][];
  scores: ScoreLine[];
  productFit: {
    name: string;
    fit: number;
    note: string;
  }[];
  competitors: {
    name: string;
    stage: string;
    distanceKm: number;
    averagePricePerSqm: number;
    center: [number, number];
  }[];
  sourceBadges: {
    label: string;
    confidence: number;
    updated: string;
  }[];
};

export type PortfolioKpi = {
  label: string;
  value: string;
  detail: string;
};

export type DashboardData = {
  parcels: Parcel[];
  portfolioKpis: PortfolioKpi[];
};

export async function loadDashboardData(): Promise<DashboardData> {
  const [assessments, summary] = await Promise.all([
    landIntelligenceService.listAssessments(),
    landIntelligenceService.portfolioSummary(),
  ]);

  return {
    parcels: assessments.map(toPresentationParcel),
    portfolioKpis: [
      {
        label: "แปลงในพอร์ต",
        value: summary.parcelCount.toLocaleString("th-TH"),
        detail: `${summary.buyOrDevelopCount} แปลงเข้าเกณฑ์เดินหน้า`,
      },
      {
        label: "มูลค่าโอกาส",
        value: `฿${summary.totalOpportunityValueMillionBaht.toLocaleString(
          "th-TH",
        )}M`,
        detail: "จากราคาเสนอรวมใน demo portfolio",
      },
      {
        label: "คะแนนเฉลี่ย",
        value: summary.averageScore.toLocaleString("th-TH"),
        detail: "Land Potential Score / 100",
      },
      {
        label: "มั่นใจข้อมูล",
        value: `${Math.round(summary.averageConfidence * 100)}%`,
        detail: "จาก decision confidence เฉลี่ย",
      },
    ],
  };
}

export const layerOptions = [
  { id: "transit", label: "รถไฟฟ้า", tone: "blue" },
  { id: "competitor", label: "คู่แข่ง", tone: "amber" },
  { id: "flood", label: "น้ำท่วม", tone: "green" },
  { id: "price", label: "ราคาที่ดิน", tone: "red" },
] as const;

export type LayerId = (typeof layerOptions)[number]["id"];

function toPresentationParcel(assessment: LandIntelligenceAssessment): Parcel {
  const { parcel, score, decision, productFit } = assessment;

  return {
    id: parcel.id,
    name: parcel.name,
    district: parcel.location.district,
    corridor: parcel.location.strategicCorridor ?? "Unassigned",
    status: statusLabel(parcel.controlStatus),
    areaRai: parcel.site.areaRai,
    askingPriceM:
      (parcel.financials.askingPricePerSqWah * parcel.site.areaSqWah) /
      1_000_000,
    score: score.totalScore,
    confidence: normalizeConfidence(decision.confidence),
    decision: decision.decision,
    decisionTone: decisionTone(decision.decision),
    recommendedDecision: decisionLabel(decision.decision),
    decisionReason: decision.reasons[0],
    nextActions: decision.nextActions,
    center: [
      parcel.location.coordinates.latitude,
      parcel.location.coordinates.longitude,
    ],
    coordinates: parcel.geometry.map((point) => [
      point.latitude,
      point.longitude,
    ]),
    scores: Object.values(score.categories).map((category) => ({
      id: category.id,
      label: categoryLabel(category.id),
      value: category.rawScore,
      weight: category.weight,
      evidence: category.evidence,
    })),
    productFit: productFit.rankedFits.slice(0, 3).map((fit) => ({
      name: productLabel(fit.productType),
      fit: fit.score,
      note: fit.rationale,
    })),
    competitors: assessment.nearbyCompetitors.slice(0, 3).map((competitor) => ({
      name: competitor.name,
      stage: competitor.status === "selling" ? "ขายต่อเนื่อง" : "อยู่ระหว่างแผน",
      distanceKm: competitor.distanceKm,
      averagePricePerSqm: competitor.averagePricePerSqm,
      center: [
        competitor.location.coordinates.latitude,
        competitor.location.coordinates.longitude,
      ],
    })),
    sourceBadges: [
      {
        label: "Land / Cadastre",
        confidence: sourceConfidence(parcel.risk.legal),
        updated: "19 มิ.ย. 2026",
      },
      {
        label: "Market signal",
        confidence: Math.round(
          average(
            assessment.marketSignals.map(
              (signal) => normalizeConfidence(signal.confidence) * 100,
            ),
          ),
        ),
        updated: assessment.marketSignals[0]?.period ?? "N/A",
      },
      {
        label: "Risk layer",
        confidence: sourceConfidence(parcel.risk.flood),
        updated: "รายเดือน",
      },
    ],
  };
}

function categoryLabel(id: ScoreCategoryId): string {
  const labels: Record<ScoreCategoryId, string> = {
    locationAccessibility: "ทำเลและการเข้าถึง",
    planningBuildability: "ผังเมืองและพัฒนาได้",
    marketDemand: "แรงซื้อและตลาด",
    competitivePosition: "ตำแหน่งเทียบคู่แข่ง",
    landCostFeasibility: "ต้นทุนและ feasibility",
    riskConstraint: "ความเสี่ยงและข้อจำกัด",
  };

  return labels[id];
}

function productLabel(productType: string): string {
  const labels: Record<string, string> = {
    condominium: "Condominium",
    townhome: "Townhome",
    singleDetached: "Detached House",
    mixedUse: "Mixed-use",
    homeOfficeRetail: "Home Office / Retail",
  };

  return labels[productType] ?? productType;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    opportunity: "คัดกรอง",
    underOption: "อยู่ระหว่างเจรจา",
    landBank: "ถือครอง",
    owned: "ถือครอง",
  };

  return labels[status] ?? status;
}

function decisionTone(decision: LandDecision): DecisionTone {
  if (decision === "buy" || decision === "develop") return "go";
  if (decision === "hold") return "watch";
  return "hold";
}

function decisionLabel(decision: LandDecision): string {
  const labels: Record<LandDecision, string> = {
    buy: "เดินหน้าเจรจาซื้อ",
    hold: "เฝ้าติดตาม / รอเงื่อนไข",
    develop: "เข้าสู่ feasibility พัฒนา",
    "no-go": "ไม่ควรเข้าในรอบนี้",
  };

  return labels[decision];
}

function sourceConfidence(level: string): number {
  const confidence: Record<string, number> = {
    low: 92,
    medium: 82,
    high: 68,
    severe: 52,
  };

  return confidence[level] ?? 75;
}

function average(values: number[]): number {
  if (values.length === 0) return 75;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeConfidence(value: number): number {
  return value > 1 ? value / 100 : value;
}
