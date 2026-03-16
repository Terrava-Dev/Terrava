import { MapContainer, TileLayer, useMapEvents, Polygon, useMap } from "react-leaflet"
import { useState, useEffect, useRef } from "react"
import { LatLng } from "leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "./PropertyMap.css"

// ── Fix default icon ───────────────────────────────
L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25,41], iconAnchor: [12,41],
})

// ── Draw marker as SVG circle overlaid on map ──────
// We NO longer use L.Marker for numbered points.
// Instead we draw an SVG overlay so html2canvas captures them.
// Points are rendered as an SVG layer inside the map container.

// ── Area calc ──────────────────────────────────────
function calcAreaAcres(pts: LatLng[]): number {
  if (pts.length < 3) return 0
  const R = 6371000
  let area = 0
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const xi = (pts[i].lng * Math.PI) / 180
    const yi = Math.log(Math.tan(Math.PI / 4 + (pts[i].lat * Math.PI) / 360))
    const xj = (pts[j].lng * Math.PI) / 180
    const yj = Math.log(Math.tan(Math.PI / 4 + (pts[j].lat * Math.PI) / 360))
    area += xi * yj - xj * yi
  }
  return (Math.abs(area) / 2) * R * R * 0.000247105
}

type Props = { setPoints: (p: LatLng[]) => void; setArea: (a: number) => void }

function FlyTo({ target }: { target: [number,number] | null }) {
  const map = useMap()
  useEffect(() => { if (target) map.flyTo(target, 20, { duration: 1.4 }) }, [target])
  return null
}

function ClickHandler({ onMapClick }: { onMapClick: (l: LatLng) => void }) {
  useMapEvents({ click: e => onMapClick(e.latlng) })
  return null
}

// ── SVG marker overlay — rendered INSIDE the map div ──
// This gets captured by html2canvas correctly
function SvgMarkers({ points, mapRef }: { points: LatLng[]; mapRef: React.RefObject<HTMLDivElement | null> }) {
  const map = useMap()
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1)
    map.on("move zoom moveend zoomend", handler)
    return () => { map.off("move zoom moveend zoomend", handler) }
  }, [map])

  if (points.length === 0) return null

  const container = mapRef.current?.querySelector(".leaflet-container") as HTMLElement | null
  if (!container) return null
  const rect = container.getBoundingClientRect()
  const W = rect.width, H = rect.height

  const toPixel = (latlng: LatLng) => {
    const pt = map.latLngToContainerPoint(latlng)
    return { x: pt.x, y: pt.y }
  }

  const polyPoints = points.map(toPixel)
  const polyStr    = polyPoints.map(p => `${p.x},${p.y}`).join(" ")

  return (
    <div className="pmap-svg-overlay" style={{ width: W, height: H }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* Polygon fill */}
        {points.length >= 3 && (
          <polygon
            points={polyStr}
            fill="rgba(232,160,32,0.18)"
            stroke="#e8a020"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}
        {/* Numbered circles */}
        {polyPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="13" fill="#e8a020" stroke="white" strokeWidth="2.5"/>
            <text
              x={p.x} y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="11"
              fontWeight="700"
              fontFamily="DM Sans, sans-serif"
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

type NominatimResult = { display_name: string; lat: string; lon: string }

export default function PropertyMap({ setPoints, setArea }: Props) {
  const [points, setLocalPoints]  = useState<LatLng[]>([])
  const [center]                  = useState<[number,number]>([11.0168, 76.9558])
  const [flyTarget, setFlyTarget] = useState<[number,number] | null>(null)
  const [searchMode, setSearchMode] = useState<"place"|"latlng">("place")
  const [query, setQuery]           = useState("")
  const [results, setResults]       = useState<NominatimResult[]>([])
  const [searching, setSearching]   = useState(false)
  const [searchErr, setSearchErr]   = useState("")
  const [latInput, setLatInput]     = useState("")
  const [lngInput, setLngInput]     = useState("")
  const [locating, setLocating]     = useState(false)
  const debounceRef                 = useRef<ReturnType<typeof setTimeout>|null>(null)
  const wrapperRef                  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos =>
      setFlyTarget([pos.coords.latitude, pos.coords.longitude])
    )
  }, [])

  const goToCurrentLocation = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      pos => { setFlyTarget([pos.coords.latitude, pos.coords.longitude]); setLocating(false) },
      () => setLocating(false)
    )
  }

  const searchPlace = async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true); setSearchErr("")
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in`, { headers: { "Accept-Language": "en" } })
      const data: NominatimResult[] = await res.json()
      setResults(data)
      if (!data.length) setSearchErr("No results found.")
    } catch { setSearchErr("Search failed.") }
    finally { setSearching(false) }
  }

  const handleQueryChange = (val: string) => {
    setQuery(val); setResults([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchPlace(val), 600)
  }

  const selectResult = (r: NominatimResult) => {
    setFlyTarget([parseFloat(r.lat), parseFloat(r.lon)])
    setQuery(r.display_name.split(",")[0])
    setResults([])
  }

  const goToLatLng = () => {
    const lat = parseFloat(latInput), lng = parseFloat(lngInput)
    if (isNaN(lat) || isNaN(lng)) { setSearchErr("Enter valid coordinates"); return }
    setFlyTarget([lat, lng]); setSearchErr("")
  }

  const handleMapClick = (latlng: LatLng) => {
    const next = [...points, latlng]
    setLocalPoints(next); setPoints(next); setArea(calcAreaAcres(next))
  }

  const undoLast = () => {
    const next = points.slice(0, -1)
    setLocalPoints(next); setPoints(next); setArea(calcAreaAcres(next))
  }

  const reset = () => { setLocalPoints([]); setPoints([]); setArea(0) }

  return (
    <div className="pmap-wrapper" ref={wrapperRef}>

      {/* ── Search toolbar ── */}
      <div className="pmap-toolbar">
        <div className="pmap-mode-group">
          <button className={`pmap-tab ${searchMode==="place"?"active":""}`}
            onClick={() => { setSearchMode("place"); setSearchErr("") }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search
          </button>
          <button className={`pmap-tab ${searchMode==="latlng"?"active":""}`}
            onClick={() => { setSearchMode("latlng"); setSearchErr("") }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            Coordinates
          </button>
          <button className={`pmap-tab pmap-locate ${locating?"loading":""}`}
            onClick={goToCurrentLocation} disabled={locating}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
            {locating ? "Locating…" : "My Location"}
          </button>
        </div>

        {searchMode === "place" && (
          <div className="pmap-search-row">
            <div className="pmap-input-wrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="pmap-input" placeholder="Search village, area, city…"
                value={query} onChange={e => handleQueryChange(e.target.value)} />
              {searching && <span className="pmap-spin" />}
            </div>
            {results.length > 0 && (
              <div className="pmap-dropdown">
                {results.map((r, i) => (
                  <button key={i} className="pmap-drop-item" onClick={() => selectResult(r)}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {searchMode === "latlng" && (
          <div className="pmap-latlng-row">
            <input className="pmap-input" type="number" placeholder="Latitude (11.0168)"
              value={latInput} onChange={e => setLatInput(e.target.value)} />
            <input className="pmap-input" type="number" placeholder="Longitude (76.9558)"
              value={lngInput} onChange={e => setLngInput(e.target.value)} />
            <button className="pmap-go-btn" onClick={goToLatLng}>Go</button>
          </div>
        )}

        {searchErr && <p className="pmap-err">{searchErr}</p>}
      </div>

      {/* ── Map ── */}
      <div className="pmap-map-container" ref={wrapperRef as React.RefObject<HTMLDivElement>}>
        <MapContainer center={center} zoom={19} minZoom={5} maxZoom={22}
          style={{ height: "360px", width: "100%" }} zoomControl={true}>
          <TileLayer attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={19} maxZoom={22} />
          <TileLayer attribution='Labels &copy; Esri'
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={19} maxZoom={22} />
          <FlyTo target={flyTarget} />
          <ClickHandler onMapClick={handleMapClick} />
          <SvgMarkers points={points} mapRef={wrapperRef} />
        </MapContainer>
      </div>

      {/* ── Bottom bar ── */}
      <div className="pmap-bottombar">
        <button className="pmap-ctrl-btn" onClick={undoLast} disabled={points.length === 0}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7h10a5 5 0 0 1 0 10H9"/><path d="M3 7l4-4M3 7l4 4"/></svg>
          Undo
        </button>
        <button className="pmap-ctrl-btn pmap-ctrl-reset" onClick={reset} disabled={points.length === 0}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          Reset
        </button>
        {points.length >= 3 && (
          <div className="pmap-area-chip">
            {Math.round(calcAreaAcres(points) * 43560).toLocaleString()} sq ft
          </div>
        )}
        {points.length > 0 && points.length < 3 && (
          <span className="pmap-need-more">{3 - points.length} more point{3 - points.length > 1 ? "s" : ""} needed</span>
        )}
      </div>

    </div>
  )
}