import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from "react-leaflet";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Layers3,
  MapPin,
  PauseCircle,
  Radar,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  layerOptions,
  loadDashboardData,
  type DashboardData,
  type DecisionTone,
  type LayerId,
  type Parcel,
} from "./data";

type ScoreStyle = CSSProperties & { "--score": string };

const decisionLabels: Record<DecisionTone, string> = {
  go: "แนะนำเดินหน้า",
  watch: "เฝ้าติดตาม",
  hold: "ชะลอ",
};

const decisionIcons = {
  go: CheckCircle2,
  watch: AlertTriangle,
  hold: PauseCircle,
};

function scoreStyle(value: number): ScoreStyle {
  return { "--score": `${Math.max(0, Math.min(value, 100))}%` };
}

function parcelColor(tone: DecisionTone) {
  if (tone === "go") return "#A6192E";
  if (tone === "watch") return "#B7791F";
  return "#667085";
}

function formatMoney(value: number) {
  return `฿${value.toLocaleString("th-TH", {
    maximumFractionDigits: 0,
  })}M`;
}

function MapFocus({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 13, { duration: 0.55 });
  }, [center, map]);

  return null;
}

function DecisionIcon({ tone }: { tone: DecisionTone }) {
  const Icon = decisionIcons[tone];
  return <Icon size={18} strokeWidth={2.2} />;
}

export function LandIntelligenceDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [corridor, setCorridor] = useState("ทั้งหมด");
  const [activeLayers, setActiveLayers] = useState<LayerId[]>([
    "transit",
    "competitor",
    "price",
  ]);

  useEffect(() => {
    let isMounted = true;

    loadDashboardData().then((data) => {
      if (!isMounted) return;
      setDashboardData(data);
      setSelectedId(data.parcels[0]?.id ?? null);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const parcels = dashboardData?.parcels ?? [];
  const portfolioKpis = dashboardData?.portfolioKpis ?? [];
  const corridorOptions = useMemo(
    () => ["ทั้งหมด", ...new Set(parcels.map((parcel) => parcel.corridor))],
    [parcels],
  );
  const selectedParcel =
    parcels.find((parcel) => parcel.id === selectedId) ?? parcels[0];

  const filteredParcels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return parcels.filter((parcel) => {
      const matchesCorridor = corridor === "ทั้งหมด" || parcel.corridor === corridor;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [parcel.id, parcel.name, parcel.district, parcel.corridor]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCorridor && matchesQuery;
    });
  }, [corridor, parcels, query]);

  const mapParcels = filteredParcels.length > 0 ? filteredParcels : parcels;

  function toggleLayer(layerId: LayerId) {
    setActiveLayers((current) =>
      current.includes(layerId)
        ? current.filter((item) => item !== layerId)
        : [...current, layerId],
    );
  }

  if (!dashboardData || !selectedParcel) {
    return (
      <div className="loading-shell">
        <div>
          <strong>Loading land intelligence workspace</strong>
          <small>กำลังเตรียม scoring, map layers และ portfolio view</small>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="filter-rail" aria-label="ตัวกรองและเมนูหลัก">
        <div className="brand-lockup">
          <div>
            <strong>Land Intelligence</strong>
            <span>Strategic acquisition cockpit</span>
          </div>
        </div>

        <nav className="rail-nav" aria-label="เมนูงาน">
          <button className="nav-item active" type="button">
            <MapPin size={17} />
            แผนที่โอกาส
          </button>
          <button className="nav-item" type="button">
            <TrendingUp size={17} />
            Pipeline
          </button>
          <button className="nav-item" type="button">
            <ShieldCheck size={17} />
            Risk desk
          </button>
        </nav>

        <section className="rail-section">
          <div className="section-heading">
            <SlidersHorizontal size={16} />
            ตัวกรองหลัก
          </div>
          <label className="search-field">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาโซน / รหัสแปลง"
            />
          </label>
          <label className="field-label" htmlFor="corridor">
            Strategic corridor
          </label>
          <select
            id="corridor"
            value={corridor}
            onChange={(event) => setCorridor(event.target.value)}
          >
            {corridorOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </section>

        <section className="rail-section">
          <div className="section-heading">
            <Layers3 size={16} />
            ชั้นข้อมูล
          </div>
          <div className="layer-list">
            {layerOptions.map((layer) => (
              <button
                aria-pressed={activeLayers.includes(layer.id)}
                className={`layer-toggle tone-${layer.tone}`}
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                type="button"
              >
                <span />
                {layer.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rail-section rail-meta">
          <span>ขอบเขตข้อมูล</span>
          <strong>กรุงเทพฯ และปริมณฑล</strong>
          <span>ปรับปรุงล่าสุด 19 มิ.ย. 2026 09:40</span>
        </section>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">AP Thailand / Land Acquisition</span>
            <h1>พิจารณาแปลงที่ดินเชิงกลยุทธ์</h1>
          </div>
          <button className="sync-button" type="button">
            <RefreshCw size={16} />
            Sync data
          </button>
        </header>

        <section className="kpi-strip" aria-label="สรุป KPI">
          {portfolioKpis.map((kpi) => (
            <div className="kpi-item" key={kpi.label}>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small>{kpi.detail}</small>
            </div>
          ))}
        </section>

        <section className="map-workspace" aria-label="แผนที่และชั้นข้อมูล">
          <div className="map-toolbar">
            <div>
              <strong>Opportunity map</strong>
              <span>
                แสดง {mapParcels.length} แปลงจากพอร์ตที่ผ่านการคัดกรองเบื้องต้น
              </span>
            </div>
            <div className="map-context">
              <span>Selected</span>
              <strong>{selectedParcel.id}</strong>
            </div>
          </div>

          <div className="map-frame">
            <MapContainer
              center={selectedParcel.center}
              className="land-map"
              scrollWheelZoom={false}
              zoom={13}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapFocus center={selectedParcel.center} />
              {mapParcels.map((parcel) => (
                <ParcelPolygon
                  key={parcel.id}
                  parcel={parcel}
                  selected={parcel.id === selectedParcel.id}
                  setSelectedId={setSelectedId}
                />
              ))}

              {activeLayers.includes("competitor") &&
                selectedParcel.competitors.map((competitor) => (
                  <CircleMarker
                    center={competitor.center}
                    key={competitor.name}
                    pathOptions={{
                      color: "#9A5B13",
                      fillColor: "#F59E0B",
                      fillOpacity: 0.75,
                      weight: 2,
                    }}
                    radius={7}
                  >
                    <Tooltip direction="top" sticky>
                      {competitor.name}
                      <br />
                      {competitor.stage} · {competitor.distanceKm} กม.
                    </Tooltip>
                  </CircleMarker>
                ))}
              <ZoomControl position="bottomright" />
            </MapContainer>

            <div className="map-overlay">
              <div className="legend-row">
                <span className="legend-dot decision-go" />
                เดินหน้า
              </div>
              <div className="legend-row">
                <span className="legend-dot decision-watch" />
                เฝ้าติดตาม
              </div>
              <div className="legend-row">
                <span className="legend-dot decision-hold" />
                ชะลอ
              </div>
            </div>

            {activeLayers.includes("transit") && (
              <div className="transit-band">
                <Route size={15} />
                BTS/MRT catchment 800 ม.
              </div>
            )}

            {activeLayers.includes("flood") && (
              <div className="risk-band">
                <ShieldCheck size={15} />
                Flood layer: ตรวจชั้นน้ำท่วมซ้ำซาก
              </div>
            )}
          </div>
        </section>

        <section className="portfolio-section" aria-label="พอร์ตแปลงที่ดิน">
          <div className="portfolio-header">
            <div>
              <strong>Land parcel portfolio</strong>
              <span>เรียงตามคะแนนโอกาสและ readiness</span>
            </div>
            <span>{filteredParcels.length} รายการ</span>
          </div>
          <div className="parcel-table" role="table" aria-label="รายการแปลง">
            <div className="parcel-row parcel-head" role="row">
              <span role="columnheader">แปลง</span>
              <span role="columnheader">โซน</span>
              <span role="columnheader">ขนาด</span>
              <span role="columnheader">มูลค่า</span>
              <span role="columnheader">Score</span>
            </div>
            {filteredParcels.map((parcel) => (
              <button
                className={`parcel-row ${
                  parcel.id === selectedParcel.id ? "selected" : ""
                }`}
                key={parcel.id}
                onClick={() => setSelectedId(parcel.id)}
                role="row"
                type="button"
              >
                <span role="cell">
                  <strong>{parcel.id}</strong>
                  <small>{parcel.name}</small>
                </span>
                <span role="cell">{parcel.corridor}</span>
                <span role="cell">{parcel.areaRai.toFixed(1)} ไร่</span>
                <span role="cell">{formatMoney(parcel.askingPriceM)}</span>
                <span role="cell" className="score-cell">
                  {parcel.score}
                  <ChevronRight size={15} />
                </span>
              </button>
            ))}
            {filteredParcels.length === 0 && (
              <div className="empty-state">ไม่พบแปลงที่ตรงกับตัวกรองปัจจุบัน</div>
            )}
          </div>
        </section>
      </main>

      <aside className="inspector" aria-label="รายละเอียดแปลงและข้อเสนอแนะ">
        <section className="decision-summary">
          <div className={`decision-badge tone-${selectedParcel.decisionTone}`}>
            <DecisionIcon tone={selectedParcel.decisionTone} />
            {decisionLabels[selectedParcel.decisionTone]}
          </div>
          <h2>{selectedParcel.name}</h2>
          <p>{selectedParcel.decisionReason}</p>
          <div className="decision-action">
            <span>{selectedParcel.recommendedDecision}</span>
            <strong>{selectedParcel.score}/100</strong>
          </div>
        </section>

        <section className="inspector-section">
          <div className="section-title">
            <Target size={16} />
            Scoring breakdown
          </div>
          <div className="score-list">
            {selectedParcel.scores.map((score) => (
              <div className="score-line" key={score.id}>
                <span>{score.label}</span>
                <div className="score-track" style={scoreStyle(score.value)}>
                  <span />
                </div>
                <strong>{score.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="inspector-section">
          <div className="section-title">
            <Building2 size={16} />
            Product fit
          </div>
          <div className="fit-list">
            {selectedParcel.productFit.map((product) => (
              <div className="fit-row" key={product.name}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.note}</span>
                </div>
                <em>{product.fit}%</em>
              </div>
            ))}
          </div>
        </section>

        <section className="inspector-section">
          <div className="section-title">
            <Radar size={16} />
            Competitor context
          </div>
          <div className="competitor-list">
            {selectedParcel.competitors.map((competitor) => (
              <div className="competitor-row" key={competitor.name}>
                <div>
                  <strong>{competitor.name}</strong>
                  <span>
                    {competitor.stage} · {competitor.distanceKm} กม.
                  </span>
                </div>
                <span>
                  ฿{Math.round(competitor.averagePricePerSqm / 1000)}K/ตร.ม.
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="inspector-section">
          <div className="section-title">
            <BadgeCheck size={16} />
            Data confidence
          </div>
          <div className="confidence-gauge">
            <div style={scoreStyle(Math.round(selectedParcel.confidence * 100))}>
              <span />
            </div>
            <strong>{Math.round(selectedParcel.confidence * 100)}%</strong>
          </div>
          <div className="source-list">
            {selectedParcel.sourceBadges.map((source) => (
              <div className="source-badge" key={source.label}>
                <span>{source.label}</span>
                <strong>{source.confidence}%</strong>
                <small>{source.updated}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="inspector-section compact-metrics">
          <div>
            <CircleDollarSign size={16} />
            <span>ราคาเสนอ</span>
            <strong>{formatMoney(selectedParcel.askingPriceM)}</strong>
          </div>
          <div>
            <MapPin size={16} />
            <span>พื้นที่</span>
            <strong>{selectedParcel.areaRai.toFixed(1)} ไร่</strong>
          </div>
        </section>
      </aside>
    </div>
  );
}

function ParcelPolygon({
  parcel,
  selected,
  setSelectedId,
}: {
  parcel: Parcel;
  selected: boolean;
  setSelectedId: (id: string) => void;
}) {
  const color = parcelColor(parcel.decisionTone);

  return (
    <Polygon
      eventHandlers={{
        click: () => setSelectedId(parcel.id),
      }}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: selected ? 0.27 : 0.14,
        opacity: 0.95,
        weight: selected ? 4 : 2,
      }}
      positions={parcel.coordinates}
    >
      <Tooltip direction="top" sticky>
        <strong>{parcel.id}</strong> {parcel.name}
        <br />
        Score {parcel.score} / Confidence {Math.round(parcel.confidence * 100)}%
      </Tooltip>
    </Polygon>
  );
}
