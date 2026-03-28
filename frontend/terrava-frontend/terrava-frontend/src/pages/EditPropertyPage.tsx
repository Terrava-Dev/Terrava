import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useNavigate, useParams } from "react-router-dom"
import PropertyMap from "../components/PropertyMap"
import { LatLng } from "leaflet"
import { useLang } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import { uploadPropertyImages } from "../services/propertyImageUpload"
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

type ExistingImage = { id: number; imageUrl: string; propertyId: number }

export default function EditPropertyPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const { t }     = useLang()
  const { agent } = useAuth()
  const mapRef    = useRef<HTMLDivElement>(null)

  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

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

  // ── NEW: DTCP / RERA ──────────────────────────────
  const [dtcpApproved, setDtcpApproved] = useState(false)
  const [reraApproved, setReraApproved] = useState(false)
  const [reraNumber, setReraNumber]     = useState("")

  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [deletingImgIds, setDeletingImgIds] = useState<number[]>([])
  const [newImages, setNewImages]           = useState<File[]>([])
  const [newPreviews, setNewPreviews]       = useState<string[]>([])
  const [mapSnapshot, setMapSnapshot]       = useState<string | null>(null)
  const [capturingMap, setCapturingMap]     = useState(false)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/properties/${id}`)
        const p   = res.data
        setTitle(p.title)
        setLocationName(p.locationName ?? "")
        setSqftInput(Math.round(Number(p.totalAreaInSqFt ?? 0)))
        setPricePerSqft(Number(p.pricePerSqFt ?? 0))
        if (p.amenities) setAmenities(p.amenities.split(",").filter(Boolean))
        if (p.notes)    setNotes(p.notes)
        if (p.propertyType) {
          const parts = (p.propertyType as string).split(",").filter(Boolean)
          if (parts.length > 0) setPropertyType(parts[0])
          if (parts.length > 1) setSubTypes(parts.slice(1))
        }
        // Load DTCP / RERA
        setDtcpApproved(!!p.dtcpApproved)
        setReraApproved(!!p.reraApproved)
        setReraNumber(p.reraNumber ?? "")

        setExistingImages(p.images ?? [])
        if (p.boundaryPoints?.length)
          setPoints(p.boundaryPoints.map((bp: { latitude: number; longitude: number }) => new LatLng(bp.latitude, bp.longitude)))
      } catch { setNotFound(true) }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const toggleAmenity = (val: string) =>
    setAmenities(prev => prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val])

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files    = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"))
    const existing = existingImages.length - deletingImgIds.length
    const total    = existing + newImages.length + (mapSnapshot ? 1 : 0)
    const added    = files.slice(0, Math.max(0, 6 - total))
    setNewImages(prev => [...prev, ...added])
    setNewPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))])
  }

  const removeNew = (i: number) => {
    setNewImages(prev => prev.filter((_, idx) => idx !== i))
    setNewPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const toggleDeleteExisting = (imgId: number) =>
    setDeletingImgIds(prev => prev.includes(imgId) ? prev.filter(x => x !== imgId) : [...prev, imgId])

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

  const existingCount = existingImages.length - deletingImgIds.length
  const totalImages   = existingCount + newImages.length + (mapSnapshot ? 1 : 0)
  const canSave       = title.trim().length > 0 && locationName.trim().length > 0

  const submitUpdate = async () => {
    if (saving || !canSave) return
    setSaving(true); setError("")
    try {
      await axios.put(`${BASE_URL}/properties/${id}`, {
        id: Number(id), title, locationName,
        totalAreaInSqFt: sqftInput,
        pricePerAcre:    pricePerSqft * 43560,
        pricePerSqFt:    pricePerSqft,
        amenities:       amenities.join(","),
        propertyType:    [propertyType, ...subTypes].join(","),
        notes,
        agentId:         agent?.agentId,
        dtcpApproved,
        reraApproved,
        reraNumber:      reraApproved ? reraNumber : "",
      })
      if (points.length >= 3)
        await axios.post(`${BASE_URL}/property-boundaries`,
          points.map((p, i) => ({ propertyId: Number(id), latitude: p.lat, longitude: p.lng, orderIndex: i }))
        )
      await Promise.all(deletingImgIds.map(imgId => axios.delete(`${BASE_URL}/property-images/${imgId}`)))
      const allNew: File[] = []
      if (mapSnapshot) {
        const blob = await fetch(mapSnapshot).then(r => r.blob())
        allNew.push(new File([blob], "map-boundary.jpg", { type: "image/jpeg" }))
      }
      allNew.push(...newImages)
      if (allNew.length > 0) {
        await uploadPropertyImages(`${BASE_URL}/property-images/upload/${id}`, allNew)
      }
      setSaved(true)
      setTimeout(() => navigate("/properties"), 1800)
    } catch { setError(t("error_msg")) }
    finally { setSaving(false) }
  }

  if (saved) return (
    <div className="add-page"><div className="success-screen">
      <div className="success-icon">✅</div>
      <h2 className="success-title">Property Updated!</h2>
      <p className="success-sub">"{title}" has been saved.</p>
      <div className="success-spinner"/>
    </div></div>
  )

  if (loading) return (
    <div className="add-page"><div className="success-screen">
      <div className="success-spinner"/>
      <p style={{marginTop:16,color:"var(--text-3)",fontSize:14}}>Loading property…</p>
    </div></div>
  )

  if (notFound) return (
    <div className="add-page"><div className="success-screen">
      <div className="success-icon">❌</div>
      <h2 className="success-title">Not Found</h2>
      <button className="next-btn" style={{maxWidth:200}} onClick={() => navigate("/properties")}>Go Home</button>
    </div></div>
  )

  return (
    <div className="add-page">
      <div className="add-topbar">
        <button className="back-btn" onClick={() => navigate("/properties")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h1 className="add-page-title">Edit Property</h1>
          <p className="add-page-sub">Update details below</p>
        </div>
      </div>

      <div className="sp-layout">
        <div className="sp-left">

          {/* Basic Info */}
          <div className="sp-section">
            <div className="sp-section-label"><span className="sp-section-icon">📋</span> Basic Info</div>
            <div className="field-group">
              <label className="field-label">{t("property_name")}</label>
              <input className="field-input" placeholder={t("property_name_ph")} value={title} onChange={e => setTitle(e.target.value)}/>
            </div>
            <div className="field-group">
              <label className="field-label">{t("location")}</label>
              <input className="field-input" placeholder={t("location_ph")} value={locationName} onChange={e => setLocationName(e.target.value)}/>
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

          {/* ── DTCP / RERA ── */}
          <div className="sp-section">
            <div className="sp-section-label"><span className="sp-section-icon">📜</span> Legal Approvals</div>
            <div className="approval-grid">

              <button
                className={`approval-btn ${dtcpApproved ? "approval-active approval-dtcp" : ""}`}
                onClick={() => setDtcpApproved(p => !p)}
              >
                <div className="approval-icon">🏛️</div>
                <div className="approval-name">DTCP</div>
                <div className="approval-sub">Approved</div>
                {dtcpApproved && <span className="approval-check">✓</span>}
              </button>

              <button
                className={`approval-btn ${reraApproved ? "approval-active approval-rera" : ""}`}
                onClick={() => setReraApproved(p => !p)}
              >
                <div className="approval-icon">🏗️</div>
                <div className="approval-name">RERA</div>
                <div className="approval-sub">Registered</div>
                {reraApproved && <span className="approval-check">✓</span>}
              </button>

            </div>

            {reraApproved && (
              <div className="field-group" style={{ marginTop: 12 }}>
                <label className="field-label">RERA Number <span className="optional">(optional)</span></label>
                <input
                  className="field-input"
                  placeholder="e.g. TN/01/Building/0001/2024"
                  value={reraNumber}
                  onChange={e => setReraNumber(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Area & Price */}
          <div className="sp-section">
            <div className="sp-section-label"><span className="sp-section-icon">📐</span> Area & Price</div>
            <div className="sp-row">
              <div className="field-group" style={{flex:1}}>
                <label className="field-label">Area (sq ft)</label>
                <div className="sqft-input-wrap">
                  <input className="field-input sqft-input" type="number" placeholder="e.g. 2400" min={0}
                    value={sqftInput||""} onChange={e => setSqftInput(Number(e.target.value))}/>
                  <span className="sqft-suffix">sq ft</span>
                </div>
              </div>
              <div className="field-group" style={{flex:1}}>
                <label className="field-label">Price / sq ft <span className="optional">(opt)</span></label>
                <div className="price-input-wrap">
                  <span className="price-prefix">₹</span>
                  <input className="field-input price-input" type="number" placeholder="e.g. 500" min={0}
                    value={pricePerSqft||""} onChange={e => setPricePerSqft(Number(e.target.value))}/>
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
                  </div></>)}
              </div>
            )}
          </div>

          {/* Amenities */}
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

          {/* Photos */}
          <div className="sp-section">
            <div className="sp-section-label"><span className="sp-section-icon">📸</span> Photos <span className="sp-optional">{totalImages}/6</span></div>
            {existingImages.length > 0 && (
              <div className="img-preview-grid" style={{marginBottom:10}}>
                {existingImages.map(img => (
                  <div key={img.id} className={`img-preview-item ${deletingImgIds.includes(img.id)?"img-marked-delete":""}`}>
                    <img src={`${BASE_URL}${img.imageUrl}`} alt="" className="img-preview-thumb"/>
                    <button className={`img-remove-btn ${deletingImgIds.includes(img.id)?"img-undo-btn":""}`}
                      onClick={() => toggleDeleteExisting(img.id)}>
                      {deletingImgIds.includes(img.id) ? "↩" : "✕"}
                    </button>
                    {deletingImgIds.includes(img.id) && <div className="img-delete-overlay">Delete</div>}
                  </div>
                ))}
              </div>
            )}
            {newPreviews.length > 0 && (
              <div className="img-preview-grid" style={{marginBottom:10}}>
                {newPreviews.map((src,i) => (
                  <div key={i} className="img-preview-item">
                    <img src={src} alt="" className="img-preview-thumb"/>
                    <button className="img-remove-btn" onClick={() => removeNew(i)}>✕</button>
                    <div className="img-new-badge">New</div>
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
                {existingImages.length+newImages.length===0?"Add Photos":`Add More (${totalImages}/6)`}
                <input type="file" accept="image/*" multiple className="img-file-input" onChange={handleImagePick}/>
              </label>
            )}
          </div>

          {/* Notes */}
          <div className="sp-section">
            <div className="sp-section-label"><span className="sp-section-icon">📝</span> Notes <span className="sp-optional">optional</span></div>
            <textarea className="field-input field-textarea" placeholder={t("notes_ph")} value={notes} onChange={e => setNotes(e.target.value)} rows={3}/>
          </div>

        </div>

        {/* Map */}
        <div className="sp-right">
          <div className="sp-section sp-map-section">
            <div className="sp-section-label"><span className="sp-section-icon">🗺️</span> Land Boundary <span className="sp-optional">optional</span></div>
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

        <div className="sp-actions">
          {error && <div className="error-msg">{error}</div>}
          <button className={`save-btn ${saving?"saving":""} ${!canSave?"disabled":""}`} onClick={submitUpdate} disabled={saving||!canSave}>
            {saving ? <><span className="spinner"/>{t("saving")}</> :
              <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Changes</>}
          </button>
        </div>

      </div>
    </div>
  )
}
