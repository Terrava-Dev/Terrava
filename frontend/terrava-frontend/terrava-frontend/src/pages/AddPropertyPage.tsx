import { useState, useRef } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import PropertyMap from "../components/PropertyMap"
import { LatLng } from "leaflet"
import { useLang } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import "./AddProperty.css"
import { PROPERTY_TYPES } from "../models/propertyTypes"

const BASE_URL = `${import.meta.env.VITE_API_URL}`

const AMENITIES = [
  { value: "water",    labelKey: "amenity_water",    icon: "💧" },
  { value: "electric", labelKey: "amenity_electric", icon: "⚡" },
  { value: "road",     labelKey: "amenity_road",     icon: "🛣️" },
  { value: "trees",    labelKey: "amenity_trees",    icon: "🌳" },
  { value: "fencing",  labelKey: "amenity_fencing",  icon: "🪧" },
  { value: "borewell", labelKey: "amenity_borewell", icon: "🔩" },
]

function sqftToCent(sqft: number) { return sqft / 435.6 }
function sqftToAcre(sqft: number) { return sqft / 43560 }

export default function AddPropertyPage() {
  const navigate  = useNavigate()
  const { t }     = useLang()
  const { agent } = useAuth()
  const mapRef    = useRef<HTMLDivElement>(null)

  const [title, setTitle]               = useState("")
  const [locationName, setLocationName] = useState("")
  const [propertyType, setPropertyType] = useState("land")
  const [subTypes, setSubTypes]         = useState<string[]>([])
  const [amenities, setAmenities]       = useState<string[]>([])
  const [sqftInput, setSqftInput]       = useState(0)
  const [pricePerSqft, setPricePerSqft] = useState(0)
  const [notes, setNotes]               = useState("")
  const [points, setPoints]             = useState<LatLng[]>([])
  const [mapArea, setMapArea]           = useState(0)

  const [uploadedFiles, setUploadedFiles]       = useState<File[]>([])
  const [uploadedPreviews, setUploadedPreviews] = useState<string[]>([])
  const [mapSnapshot, setMapSnapshot]           = useState<string | null>(null)
  const [capturingMap, setCapturingMap]         = useState(false)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState("")

  const toggleAmenity = (val: string) =>
    setAmenities(prev => prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val])

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"))
    const slots = 6 - uploadedFiles.length - (mapSnapshot ? 1 : 0)
    const added = files.slice(0, slots)
    setUploadedFiles(prev => [...prev, ...added])
    setUploadedPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))])
  }

  const removeUploaded = (i: number) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))
    setUploadedPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const captureMap = async () => {
    if (!mapRef.current) return
    setCapturingMap(true)
    try {
      const mapEl = mapRef.current.querySelector(".leaflet-container") as HTMLElement
      if (!(window as any).html2canvas) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script")
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
          s.onload = () => resolve(); s.onerror = () => reject()
          document.head.appendChild(s)
        })
      }
      const captured = await (window as any).html2canvas(mapEl ?? mapRef.current, {
        useCORS: true, allowTaint: true, scale: 1.5, logging: false,
        ignoreElements: (el: Element) =>
          el.classList.contains("leaflet-control-container") ||
          el.classList.contains("leaflet-control-attribution"),
      })
      setMapSnapshot(captured.toDataURL("image/jpeg", 0.92))
    } catch { alert("Could not capture map. Try again.") }
    finally { setCapturingMap(false) }
  }

  const totalImages = uploadedFiles.length + (mapSnapshot ? 1 : 0)
  const canSave     = title.trim().length > 0 && locationName.trim().length > 0

  const submitProperty = async () => {
    if (saving || !canSave) return
    setSaving(true); setError("")
    try {
      const response = await axios.post(`${BASE_URL}/properties`, {
        title, locationName,
        totalAreaInSqFt: sqftInput,
        pricePerAcre:    pricePerSqft * 43560,
        pricePerSqFt:    pricePerSqft,
        amenities:       amenities.join(","),
        propertyType:    [propertyType, ...subTypes].join(","),
        notes,
        agentId:         agent?.agentId,
      })
      const propertyId = response.data.id

      if (points.length >= 3) {
        try {
          await axios.post(`${BASE_URL}/property-boundaries`,
            points.map((p, i) => ({ propertyId, latitude: p.lat, longitude: p.lng, orderIndex: i }))
          )
        } catch (e) {
          console.warn("Boundary save failed (non-critical):", e)
        }
      }

      const allFiles: File[] = []
      if (mapSnapshot) {
        const blob = await fetch(mapSnapshot).then(r => r.blob())
        allFiles.push(new File([blob], "map-boundary.jpg", { type: "image/jpeg" }))
      }
      allFiles.push(...uploadedFiles)

      if (allFiles.length > 0) {
        const fd = new FormData()
        allFiles.forEach(f => fd.append("files", f))
        // Do NOT set Content-Type manually — browser sets it with correct boundary
        await axios.post(`${BASE_URL}/property-images/upload/${propertyId}`, fd)
      }
      setSaved(true)
      setTimeout(() => navigate("/"), 1800)
    } catch (err: any) {
      console.error("Save error:", err)
      const msg = err?.response?.data?.message
        || err?.response?.data
        || err?.message
        || "Unknown error"
      console.error("Detail:", err?.response?.status, msg)
      setError(`Error ${err?.response?.status ?? ""}: ${JSON.stringify(msg)}`)
    } finally { setSaving(false) }
  }

  if (saved) return (
    <div className="add-page">
      <div className="success-screen">
        <div className="success-icon">✅</div>
        <h2 className="success-title">{t("property_saved")}</h2>
        <p className="success-sub">"{title}" {t("property_saved_sub")}</p>
        <div className="success-spinner" />
      </div>
    </div>
  )

  return (
    <div className="add-page">
      <div className="add-topbar">
        <button className="back-btn" onClick={() => navigate("/")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h1 className="add-page-title">{t("add_property_title")}</h1>
          <p className="add-page-sub">Fill in details and mark the boundary</p>
        </div>
      </div>

      <div className="sp-layout">
        <div className="sp-left">

          <div className="sp-section">
            <div className="sp-section-label"><span className="sp-section-icon">📋</span> Basic Info</div>
            <div className="field-group">
              <label className="field-label">{t("property_name")}</label>
              <input className="field-input" placeholder={t("property_name_ph")} value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">{t("location")}</label>
              <input className="field-input" placeholder={t("location_ph")} value={locationName} onChange={e => setLocationName(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">{t("property_type")}</label>
              <div className="type-pills">
                {PROPERTY_TYPES.map(pt => (
                  <button key={pt.value}
                    className={`type-pill ${propertyType===pt.value?"active":""}`}
                    onClick={() => { setPropertyType(pt.value); setSubTypes([]) }}>
                    <span className="pill-icon">{pt.icon}</span>{t(pt.labelKey as Parameters<typeof t>[0])}
                  </button>
                ))}
              </div>
              {/* Sub-type selector */}
              {(() => {
                const subtypes = PROPERTY_TYPES.find(pt => pt.value === propertyType)?.subTypes ?? []
                return subtypes.length > 0 ? (
                  <div className="subtype-grid">
                    {subtypes.map(st => (
                      <button key={st.value}
                        className={`subtype-btn ${subTypes.includes(st.value)?"active":""}`}
                        onClick={() => setSubTypes(prev => prev.includes(st.value) ? prev.filter(x => x !== st.value) : [...prev, st.value])}>
                        <span className="subtype-icon">{st.icon}</span>
                        <span className="subtype-label">{st.label}</span>
                        {subTypes.includes(st.value) && <span className="subtype-check">✓</span>}
                      </button>
                    ))}
                  </div>
                ) : null
              })()}
            </div>
          </div>

          <div className="sp-section">
            <div className="sp-section-label"><span className="sp-section-icon">📐</span> Area & Price</div>
            <div className="sp-row">
              <div className="field-group" style={{flex:1}}>
                <label className="field-label">Area (sq ft)</label>
                <div className="sqft-input-wrap">
                  <input className="field-input sqft-input" type="number" placeholder="e.g. 2400" min={0}
                    value={sqftInput||""} onChange={e => setSqftInput(Number(e.target.value))} />
                  <span className="sqft-suffix">sq ft</span>
                </div>
              </div>
              <div className="field-group" style={{flex:1}}>
                <label className="field-label">Price / sq ft <span className="optional">(opt)</span></label>
                <div className="price-input-wrap">
                  <span className="price-prefix">₹</span>
                  <input className="field-input price-input" type="number" placeholder="e.g. 500" min={0}
                    value={pricePerSqft||""} onChange={e => setPricePerSqft(Number(e.target.value))} />
                </div>
              </div>
            </div>
            {sqftInput > 0 && (
              <div className="conversion-box">
                <div className="conv-row"><span className="conv-icon">📐</span><span className="conv-label">Sq Feet</span><span className="conv-val conv-active">{sqftInput.toLocaleString()} sq ft</span></div>
                <div className="conv-divider"/>
                <div className="conv-row"><span className="conv-icon">🌿</span><span className="conv-label">Cent</span><span className="conv-val">{sqftToCent(sqftInput).toFixed(3)} cent</span></div>
                <div className="conv-divider"/>
                <div className="conv-row"><span className="conv-icon">🗺️</span><span className="conv-label">Acre</span><span className="conv-val conv-highlight">{sqftToAcre(sqftInput).toFixed(4)} acres</span></div>
                {pricePerSqft > 0 && (<><div className="conv-divider"/>
                  <div className="conv-row"><span className="conv-icon">💰</span><span className="conv-label">Total Price</span>
                    <span className="conv-val conv-highlight">₹{(pricePerSqft*sqftInput).toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                  </div></>
                )}
              </div>
            )}
          </div>

          <div className="sp-section">
            <div className="sp-section-label"><span className="sp-section-icon">✨</span> Amenities</div>
            <div className="amenity-grid">
              {AMENITIES.map(a => (
                <button key={a.value} className={`amenity-btn ${amenities.includes(a.value)?"active":""}`} onClick={() => toggleAmenity(a.value)}>
                  <span className="amenity-icon">{a.icon}</span>
                  <span className="amenity-label">{t(a.labelKey as Parameters<typeof t>[0])}</span>
                  {amenities.includes(a.value) && <span className="amenity-check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="sp-section">
            <div className="sp-section-label"><span className="sp-section-icon">📸</span> Photos <span className="sp-optional">{totalImages}/6</span></div>
            {uploadedPreviews.length > 0 && (
              <div className="img-preview-grid" style={{marginBottom:10}}>
                {uploadedPreviews.map((src,i) => (
                  <div key={i} className="img-preview-item">
                    <img src={src} alt="" className="img-preview-thumb"/>
                    <button className="img-remove-btn" onClick={() => removeUploaded(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {mapSnapshot && (
              <div className="map-snapshot-preview" style={{marginBottom:10}}>
                <img src={mapSnapshot} alt="Map" className="map-snapshot-img"/>
                <button className="map-snapshot-remove" onClick={() => setMapSnapshot(null)}>✕ Remove</button>
                <div className="img-new-badge" style={{bottom:8,left:8}}>Map</div>
              </div>
            )}
            {totalImages < 6 && (
              <label className="img-upload-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {uploadedFiles.length===0?"Upload Photos":`Add More (${totalImages}/6)`}
                <input type="file" accept="image/*" multiple className="img-file-input" onChange={handleImagePick}/>
              </label>
            )}
          </div>

          <div className="sp-section">
            <div className="sp-section-label"><span className="sp-section-icon">📝</span> Notes <span className="sp-optional">optional</span></div>
            <textarea className="field-input field-textarea" placeholder={t("notes_ph")} value={notes} onChange={e => setNotes(e.target.value)} rows={3}/>
          </div>

          {error && <div className="error-msg">{error}</div>}
          <button className={`save-btn ${saving?"saving":""} ${!canSave?"disabled":""}`} onClick={submitProperty} disabled={saving||!canSave}>
            {saving ? <><span className="spinner"/>{t("saving")}</> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>{t("save_property")}</>}
          </button>
        </div>

        {/* RIGHT: map */}
        <div className="sp-right">
          <div className="sp-section sp-map-section">
            <div className="sp-section-label"><span className="sp-section-icon">🗺️</span> Mark Land Boundary <span className="sp-optional">optional</span></div>
            <div ref={mapRef}>
              <PropertyMap setPoints={setPoints} setArea={setMapArea}/>
            </div>
            <div className="map-capture-row">
              {points.length >= 3 ? (
                <button className={`capture-map-btn ${capturingMap?"capturing":""} ${mapSnapshot?"captured":""}`}
                  onClick={captureMap} disabled={capturingMap}>
                  {capturingMap ? <><span className="capture-spinner"/>Capturing…</> :
                   mapSnapshot   ? <>✓ Map Saved — Retake</> :
                   <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>Save Map as Photo</>}
                </button>
              ) : (
                <p className="map-tap-hint">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  Tap on the map to mark land boundary points
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}