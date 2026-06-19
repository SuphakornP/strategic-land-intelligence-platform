# 📋 Master Backlog

เอกสารนี้เป็น backlog รวมสำหรับการพัฒนา Strategic Land Intelligence Platform หลัง prototype โดยจัดกลุ่มตาม epic และ priority

## 🧭 Priority Definition

| Priority | ความหมาย |
|---|---|
| P0 | ต้องมีเพื่อให้ production foundation ใช้งานได้ |
| P1 | สำคัญสำหรับ business value และ pilot |
| P2 | เพิ่มความสมบูรณ์และ scale |
| P3 | advanced capability หลัง rollout |

## 🏗️ Epic 1: Platform Foundation

| Priority | Task | Outcome |
|---|---|---|
| P0 | ตั้ง PostgreSQL + PostGIS | มี spatial system of record |
| P0 | สร้าง migration system | schema เปลี่ยนได้อย่างปลอดภัย |
| P0 | สร้าง Backend API | frontend ไม่ผูกกับ in-memory data |
| P0 | สร้าง repository adapter สำหรับ PostGIS | domain/use case ใช้ data จริงได้ |
| P0 | เพิ่ม environment config | แยก local/dev/staging/prod |
| P1 | เพิ่ม caching strategy | ลด latency ของ spatial query |
| P1 | เพิ่ม observability | trace issue และ performance ได้ |

## 🗺️ Epic 2: GIS & Data Ingestion

| Priority | Task | Outcome |
|---|---|---|
| P0 | Import AP land bank CSV/Excel | ใช้ข้อมูลภายในจริง |
| P0 | Upload GeoJSON/KML/CSV lat-lon | รับข้อมูล scouting/broker ได้ |
| P0 | Geometry validation | ลด geometry error ก่อนเข้า PostGIS |
| P0 | CRS normalization | ใช้มาตรฐานเดียว เช่น EPSG:4326 |
| P1 | Import SHP/KMZ | รองรับไฟล์ GIS จากหน่วยงาน/consultant |
| P1 | Ingestion log | ตรวจสอบว่า source ไหนเข้าระบบเมื่อไร |
| P1 | Data quality dashboard | เห็น stale/error/missing geometry |

## 🧾 Epic 3: Source Governance

| Priority | Task | Outcome |
|---|---|---|
| P0 | Source registry | รู้ source, owner, license, refresh cadence |
| P0 | Data confidence model | ผู้ใช้เห็นความน่าเชื่อถือของข้อมูล |
| P0 | Licensing review field | ป้องกันใช้ข้อมูลผิดเงื่อนไข |
| P1 | Source exception workflow | จัดการ source ที่ยังไม่ approved |
| P1 | Freshness alert | แจ้งเตือนเมื่อ layer เก่าเกิน SLA |

## 🧠 Epic 4: Scoring & Decision Engine

| Priority | Task | Outcome |
|---|---|---|
| P0 | Validate score weights กับ AP | scoring สอดคล้อง business จริง |
| P0 | Persist score result | เก็บคะแนนและ evidence ย้อนหลัง |
| P0 | Score versioning | audit ได้ว่าใช้ model version ไหน |
| P1 | Manual override พร้อมเหตุผล | รองรับ expert judgment |
| P1 | Scenario comparison | เปรียบเทียบ product/price/risk |
| P2 | Sensitivity analysis | เห็นผลต่อ score เมื่อ assumption เปลี่ยน |
| P3 | AI assistant query | ถามตอบข้อมูลที่ดินด้วย natural language |

## 🏙️ Epic 5: Market & Competitor Intelligence

| Priority | Task | Outcome |
|---|---|---|
| P1 | Competitor project registry | เห็นคู่แข่งรอบแปลง |
| P1 | Segment taxonomy | เปรียบเทียบ product/price ได้ถูกต้อง |
| P1 | Market signal table | เก็บ demand, absorption, inventory |
| P1 | Competitor radius query | วิเคราะห์คู่แข่งใน 1/3/5 กม. |
| P2 | Supply density heatmap | เห็นพื้นที่ supply แน่น |
| P2 | Market trend timeline | วิเคราะห์ timing |

## 🖥️ Epic 6: Frontend Workflow

| Priority | Task | Outcome |
|---|---|---|
| P0 | Parcel profile page | เห็นรายละเอียดแปลงครบ |
| P0 | Layer panel จริง | เปิด/ปิด layer จาก backend ได้ |
| P0 | Portfolio ranking | จัดอันดับแปลงตาม score |
| P1 | Source/freshness panel | เห็นข้อมูลและความน่าเชื่อถือ |
| P1 | Upload/import screen | ผู้ใช้เพิ่มข้อมูลได้เอง |
| P1 | Scenario comparison UI | เปรียบเทียบทางเลือกได้ |
| P2 | Decision memo export | ส่งต่อ IC ได้ |

## 🔐 Epic 7: Security & Enterprise Control

| Priority | Task | Outcome |
|---|---|---|
| P0 | Authentication | จำกัดผู้ใช้ |
| P0 | RBAC | แยกสิทธิ์ Executive/Land/Data/Admin |
| P0 | Audit log | ตรวจสอบ action สำคัญ |
| P1 | Sensitive field protection | ป้องกัน deal notes/owner info |
| P1 | API validation/rate limit | ลด security risk |
| P2 | Security review | พร้อม production rollout |

## 🧪 Epic 8: Testing & QA

| Priority | Task | Outcome |
|---|---|---|
| P0 | API integration tests | backend contract เสถียร |
| P0 | Repository tests with PostGIS | spatial query ถูกต้อง |
| P0 | Data quality tests | ingestion ไม่รับข้อมูลผิดรูปแบบ |
| P1 | Frontend component tests | UI behavior ไม่ regress |
| P1 | Playwright E2E | test workflow หลัก end-to-end |
| P2 | Performance tests | map/spatial query รองรับ dataset ใหญ่ |

