# 🏃 Next Sprint Plan

เอกสารนี้เสนอแผน sprint ถัดไปหลัง prototype เพื่อให้ทีมเริ่มพัฒนา production foundation ได้เป็นลำดับ

## 🎯 Sprint Goal

เปลี่ยน prototype จาก in-memory demo ไปสู่ foundation ที่พร้อมเชื่อม backend และ PostGIS โดยไม่ทำลาย clean architecture ที่มีอยู่

## ⏱️ ระยะเวลาแนะนำ

2 สัปดาห์ สำหรับทีมเล็ก 3-5 คน

## 👥 Role ที่ควรมี

| Role | Responsibility |
|---|---|
| Tech Lead | ออกแบบ backend/API/PostGIS boundary |
| Backend Engineer | สร้าง API, migration, repository adapter |
| Frontend Engineer | ปรับ UI ให้เรียก API และจัด loading/error states |
| Data/GIS Engineer | ออก schema, geometry validation, sample import |
| QA Engineer | เพิ่ม integration tests และ test data |

## 📌 Sprint Backlog

| Priority | Task | Owner | Acceptance Criteria |
|---|---|---|---|
| P0 | เลือก backend framework | Tech Lead | มี decision record ว่าใช้ framework อะไรและเหตุผล |
| P0 | ตั้ง PostGIS local dev | Backend/Data | `docker compose up` แล้วมี PostgreSQL + PostGIS |
| P0 | สร้าง migration แรก | Backend | มี tables สำหรับ parcels, competitors, market_signals, risk_signals |
| P0 | สร้าง API `GET /parcels` | Backend | frontend หรือ curl อ่าน parcel list ได้ |
| P0 | สร้าง API `GET /parcels/:id/assessment` | Backend | คืน score/product fit/decision ได้ |
| P0 | ทำ PostGIS repository adapter | Backend/Data | use case เดิมใช้ data จาก database ได้ |
| P1 | Seed demo data ลง database | Data | sample data ถูก migrate/seed และ query ได้ |
| P1 | Frontend data loading จาก API | Frontend | dashboard ไม่ import sample data โดยตรง |
| P1 | Error/loading/empty state | Frontend | UI รับมือ API fail/empty ได้ |
| P1 | Integration tests | QA/Backend | tests ครอบคลุม API + repository |

## 🧪 Sprint Verification

ต้องผ่านอย่างน้อย:

```bash
npm run build
npm run test
npm audit --omit=dev
```

หลังเพิ่ม backend อาจต้องเพิ่ม:

```bash
docker compose up -d
npm run test:integration
```

## ✅ Sprint Exit Criteria

- ระบบยังเปิด dashboard ได้
- dashboard เรียกข้อมูลผ่าน API ไม่ใช่ in-memory presentation data
- PostGIS มี schema และ seed demo data
- use cases เดิมยังถูกใช้ ไม่ย้าย business logic ไปอยู่ใน controller/UI
- มี migration และ README สำหรับ local database setup
- tests ผ่านใน local และ CI

## ⚠️ Risks ใน Sprint นี้

| Risk | Mitigation |
|---|---|
| Scope ใหญ่เกินไป | จำกัดเป้าหมายแค่ read-only API ก่อน |
| Business logic หลุดไปอยู่ backend controller | บังคับให้ controller เรียก application use case เท่านั้น |
| GIS schema ออกแบบเร็วเกินไป | เริ่มจาก minimal schema และเก็บ extension point |
| Frontend regress | รักษา presentation mapper และเพิ่ม component smoke test |

## 🧭 หลังจบ Sprint นี้ควรไปต่ออะไร

1. เพิ่ม upload/import data
2. เพิ่ม source registry
3. เพิ่ม zoning/flood/transport layer จริง
4. เพิ่ม authentication/RBAC
5. ทำ pilot dataset กับทีม AP

