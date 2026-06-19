# 🧾 Implementation Inventory

เอกสารนี้เป็นรายการ inventory ของสิ่งที่ถูก implement แล้วใน prototype เพื่อให้ทีม AP Thailand และทีมพัฒนาเห็นขอบเขตจริงของระบบปัจจุบัน

## 🖥️ Frontend / UX

| Feature | สถานะ | Source |
|---|---|---|
| Dashboard shell | ✅ ทำแล้ว | `src/presentation/land-intelligence/Dashboard.tsx` |
| Left navigation/filter rail | ✅ ทำแล้ว | `Dashboard.tsx`, `src/index.css` |
| KPI strip | ✅ ทำแล้ว | `Dashboard.tsx`, `data.ts` |
| Interactive map | ✅ ทำแล้ว | React Leaflet |
| Parcel polygon click/select | ✅ ทำแล้ว | `ParcelPolygon` component |
| Layer toggle | ✅ ทำแล้ว | `layerOptions` |
| Portfolio table | ✅ ทำแล้ว | `Dashboard.tsx` |
| Right inspector panel | ✅ ทำแล้ว | `Dashboard.tsx` |
| Responsive layout | ✅ ทำแล้ว | `src/index.css` |

## 🧠 Domain Logic

| Capability | สถานะ | Source |
|---|---|---|
| Land Potential Score | ✅ ทำแล้ว | `src/domain/land-potential-score.ts` |
| Score category weights | ✅ ทำแล้ว | `LAND_POTENTIAL_SCORE_CATEGORIES` |
| Product Fit Recommendation | ✅ ทำแล้ว | `src/domain/product-fit.ts` |
| Decision Recommendation | ✅ ทำแล้ว | `src/domain/decision-recommendation.ts` |
| Risk penalty logic | ✅ ทำแล้ว | `land-potential-score.ts`, `decision-recommendation.ts` |
| Evidence per score category | ✅ ทำแล้ว | `CategoryScore.evidence` |
| Model versioning field | ✅ เบื้องต้น | `scoringVersion` |

## 🧱 Application Layer

| Use Case | สถานะ | Source |
|---|---|---|
| Evaluate one parcel | ✅ ทำแล้ว | `src/application/evaluate-land-parcel.use-case.ts` |
| List/rank opportunities | ✅ ทำแล้ว | `src/application/list-land-opportunities.use-case.ts` |
| Repository contracts | ✅ ทำแล้ว | `src/application/repositories.ts` |

## 🗄️ Infrastructure Layer

| Adapter/Data | สถานะ | Source |
|---|---|---|
| In-memory parcel repository | ✅ ทำแล้ว | `src/infrastructure/in-memory-land-intelligence-repositories.ts` |
| In-memory competitor repository | ✅ ทำแล้ว | same file |
| In-memory market signal repository | ✅ ทำแล้ว | same file |
| In-memory risk signal repository | ✅ ทำแล้ว | same file |
| In-memory GIS layer repository | ✅ ทำแล้ว | same file |
| Sample data | ✅ ทำแล้ว | `src/infrastructure/sample-land-intelligence-data.ts` |
| PostGIS adapter | ❌ ยังไม่ทำ | Phase 1 production foundation |
| API adapter | ❌ ยังไม่ทำ | Phase 1 production foundation |

## 🧪 Tests

| Test Area | สถานะ | Source |
|---|---|---|
| Scoring weights and boundaries | ✅ ทำแล้ว | `src/test/land-potential-score.test.ts` |
| Decision recommendation | ✅ ทำแล้ว | `src/test/decision-recommendation.test.ts` |
| In-memory repositories | ✅ ทำแล้ว | `src/test/in-memory-repositories.test.ts` |
| Frontend component tests | ❌ ยังไม่ทำ | Phase 1 hardening |
| E2E tests | ❌ ยังไม่ทำ | Phase 2/3 |
| Data quality tests | ❌ ยังไม่ทำ | Phase 1 data ingestion |

## 📚 Documentation

| Document | สถานะ |
|---|---|
| Architecture blueprint | ✅ ทำแล้ว |
| Data model | ✅ ทำแล้ว |
| Product roadmap | ✅ ทำแล้ว |
| Testing/evaluation | ✅ ทำแล้ว |
| Current state | ✅ ไฟล์นี้และ `current-state.md` |
| Detailed phase plan | ✅ `docs/roadmap/development-phases.md` |
| Master backlog | ✅ `docs/delivery/master-backlog.md` |
| Next sprint plan | ✅ `docs/delivery/next-sprint-plan.md` |

