import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useLang } from "../context/LanguageContext"
import PropertyPDFModal from "./PropertyPDFModal"
import { PROPERTY_STATUSES, getStatus } from "../models/propertyStatus"
import "./PropertyCard.css"

const STATUS_DOT_CLASS: Record<string, string> = {
  available:   "status-dot-available",
  enquired:    "status-dot-enquired",
  hold:        "status-dot-hold",
  negotiating: "status-dot-negotiating",
  rented:      "status-dot-rented",
  sold:        "status-dot-sold",
}

const BASE_URL = `${import.meta.env.VITE_API_URL}`
const IMG_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? ''
function getBoundaryCenter(points: { latitude: number; longitude: number }[]) {
  if (!points || points.length === 0) return null
  const lat = points.reduce((s, p) => s + Number(p.latitude), 0) / points.length
  const lng = points.reduce((s, p) => s + Number(p.longitude), 0) / points.length
  return { lat, lng }
}

function openInMaps(lat: number, lng: number, label: string) {
  window.open(`https://www.google.com/maps?q=${lat},${lng}&z=19&label=${encodeURIComponent(label)}`, "_blank")
}

const SUBTYPE_ICONS: Record<string, string> = {
  "1bhk":"🛏️","2bhk":"🛏️","3bhk":"🛏️","4bhk":"🛏️","duplex":"🏡","villa":"🏰",
  "independent":"🏠","studio":"🪑","agricultural":"🌾","residential":"🏘️",
  "industrial":"🏭","panchayat":"📜","waterfront":"🌊","corner_plot":"📐",
  "ground_floor":"⬇️","first_floor":"1️⃣","second_floor":"2️⃣","furnished":"🪑",
  "semi_furnished":"🛋️","showroom":"🏪","office":"💼","warehouse":"🏬","shop":"🛍️",
  "mango":"🥭","coconut":"🥥","paddy":"🌾","flower":"🌸","vegetable":"🥦",
  "poultry":"🐔","fish_pond":"🐟","mixed_crop":"🌱","dtcp_approved":"✅",
  "rera_approved":"🏛️","gated_community":"🔒","villa_plot":"🏰","open_plot":"🟩",
}

type PropertyImage  = { id: number; imageUrl: string; propertyId: number }
type BoundaryPoint  = { id: number; latitude: number; longitude: number; propertyId: number }

type Property = {
  id: number
  title: string
  locationName: string
  totalAreaInSqFt: number
  pricePerAcre: number
  pricePerSqFt: number
  totalPrice: number
  amenities?: string
  propertyType?: string
  status?: string
  notes?: string
  images?: PropertyImage[]
  boundaryPoints?: BoundaryPoint[]
}

type Props = {
  property: Property
  index?: number
  onDeleted?: (id: number) => void
  onStatusChanged?: (id: number, status: string) => void
}

export default function PropertyCard({ property, index = 0, onDeleted, onStatusChanged }: Props) {
  const { t }    = useLang()
  const navigate = useNavigate()

  const [imgIndex, setImgIndex]             = useState(0)
  const [showDetail, setShowDetail]         = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [showToast, setShowToast]           = useState(false)
  const [toastMsg, setToastMsg]             = useState("")
  const [deleting, setDeleting]             = useState(false)
  const [deleteErr, setDeleteErr]           = useState("")
  const [showPDFModal, setShowPDFModal]     = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [currentStatus, setCurrentStatus]  = useState(property.status ?? "available")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showStatusMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowStatusMenu(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showStatusMenu])

  // Lock body scroll when detail open
  useEffect(() => {
    document.body.style.overflow = showDetail ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [showDetail])

  const images   = property.images ?? []
  const status   = getStatus(currentStatus)
  const center   = getBoundaryCenter(property.boundaryPoints ?? [])
  const mainImg  = images[0]?.imageUrl
  const subTypes = (property.propertyType ?? "").split(",").filter(Boolean).slice(1)
  const amenList = (property.amenities ?? "").split(",").filter(Boolean)

  const showToastMsg = (msg: string) => {
    setToastMsg(msg); setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleDelete = async () => {
    setDeleting(true); setDeleteErr("")
    try {
      await fetch(`${BASE_URL}/properties/${property.id}`, { method: "DELETE" })
      setShowConfirm(false)
      showToastMsg("Property deleted")
      setTimeout(() => onDeleted?.(property.id), 1800)
    } catch {
      setDeleteErr("Delete failed. Try again.")
      setDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setShowStatusMenu(false); setUpdatingStatus(true)
    try {
      await fetch(`${BASE_URL}/properties/${property.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      setCurrentStatus(newStatus)
      onStatusChanged?.(property.id, newStatus)
      showToastMsg(`Marked as ${getStatus(newStatus).label}`)
    } catch { showToastMsg("Failed to update status") }
    finally { setUpdatingStatus(false) }
  }

  const handleShare = () => {
    const text = `🏡 *${property.title}*\n📍 ${property.locationName}\n📐 ${Math.round(Number(property.totalAreaInSqFt)).toLocaleString()} sq ft\n💰 ₹${property.totalPrice.toLocaleString()}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  return (
    <>
      {/* ══ COMPACT CARD ══════════════════════════════════ */}
      <div className="pcard" style={{ animationDelay: `${index * 60}ms` }} onClick={() => setShowDetail(true)}>

        {/* Thumbnail */}
        <div className="pcard-thumb">
          {mainImg
            ? <img src={`${IMG_URL}${mainImg}`} alt={property.title} className="pcard-thumb-img" />
            : <div className="pcard-thumb-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                </svg>
              </div>
          }
          {/* Image count */}
          {images.length > 1 && (
            <div className="pcard-img-badge">📷 {images.length}</div>
          )}
          {/* Edit / Delete on image */}
          <div className="pcard-quick-btns" onClick={e => e.stopPropagation()}>
            <button className="pcard-qbtn pcard-qbtn-edit" onClick={() => navigate(`/edit-property/${property.id}`)} title="Edit">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className="pcard-qbtn pcard-qbtn-del" onClick={() => setShowConfirm(true)} title="Delete">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Status wrap — outside thumb, overlays top-left of image, dropdown escapes card */}
        <div className="pcard-status-wrap pcard-status-overlay" ref={menuRef} onClick={e => e.stopPropagation()}>
          <button
            className="pcard-status-pill"
            style={{ "--stamp-color": status.stampColor } as React.CSSProperties}
            onClick={() => setShowStatusMenu(v => !v)}
            disabled={updatingStatus}
          >
            <span className={`pcard-status-dot-sm ${STATUS_DOT_CLASS[currentStatus] ?? ""}`} style={{ background: status.stampColor }} />
            {updatingStatus ? "…" : status.label}
            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {showStatusMenu && (
            <div className="pcard-status-menu">
              {PROPERTY_STATUSES.map(s => (
                <button key={s.value}
                  className={`pcard-status-option ${currentStatus === s.value ? "active" : ""}`}
                  style={{ "--opt-color": s.textColor } as React.CSSProperties}
                  onClick={() => handleStatusChange(s.value)}
                >
                  <span className="pcard-status-dot" style={{ background: s.stampColor }} />
                  {s.label}
                  {currentStatus === s.value && <span style={{ marginLeft: "auto" }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pcard-info">
          {/* Price — biggest, first */}
          <p className="pcard-compact-price">₹{property.totalPrice > 0 ? property.totalPrice.toLocaleString() : "—"}</p>

          {/* Title + location */}
          <p className="pcard-compact-title">{property.title}</p>
          <p className="pcard-compact-loc">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {property.locationName}
          </p>

          {/* Property type chips */}
          {property.propertyType && (() => {
            const parts = property.propertyType.split(",").filter(Boolean)
            return (
              <div className="pcard-type-row">
                <span className="pcard-type-main">{parts[0]}</span>
                {parts.slice(1, 3).map(s => (
                  <span key={s} className="pcard-type-sub">{s.replace(/_/g, " ")}</span>
                ))}
              </div>
            )
          })()}

          {/* Area + price meta with icons */}
          <div className="pcard-info-bottom">
            <div className="pcard-compact-meta">
              <span className="pcard-meta-item">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>
                </svg>
                {Math.round(Number(property.totalAreaInSqFt)).toLocaleString()} sq ft
              </span>
              {property.pricePerSqFt > 0 && (
                <span className="pcard-meta-item">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  ₹{property.pricePerSqFt}/sqft
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ══ DETAIL DRAWER ════════════════════════════════ */}
      {showDetail && (
        <div className="detail-overlay" onClick={() => setShowDetail(false)}>
          <div className="detail-sheet" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="detail-header">
              <div>
                <h2 className="detail-title">{property.title}</h2>
                <p className="detail-loc">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {property.locationName}
                </p>
              </div>
              <button className="detail-close" onClick={() => setShowDetail(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Image carousel */}
            {images.length > 0 && (
              <div className="detail-carousel">
                <img src={`${IMG_URL}${images[imgIndex].imageUrl}`} alt="" className="detail-carousel-img" />
                {images.length > 1 && (
                  <>
                    <button className="detail-arrow left" onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}>‹</button>
                    <button className="detail-arrow right" onClick={() => setImgIndex(i => (i + 1) % images.length)}>›</button>
                    <div className="detail-dots">
                      {images.map((_, i) => <span key={i} className={`detail-dot ${i === imgIndex ? "active" : ""}`} />)}
                    </div>
                    <div className="detail-img-count">{imgIndex + 1} / {images.length}</div>
                  </>
                )}
              </div>
            )}

            <div className="detail-body">

              {/* Price stats */}
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="detail-stat-lbl">Total Price</span>
                  <span className="detail-stat-val detail-price">₹{property.totalPrice > 0 ? property.totalPrice.toLocaleString() : "—"}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-lbl">Area</span>
                  <span className="detail-stat-val">{Math.round(Number(property.totalAreaInSqFt)).toLocaleString()} sq ft</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-lbl">Per sq ft</span>
                  <span className="detail-stat-val">₹{property.pricePerSqFt > 0 ? property.pricePerSqFt.toLocaleString() : "—"}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-lbl">Status</span>
                  <span className="detail-stat-val" style={{ color: status.stampColor }}>{status.label}</span>
                </div>
                {property.propertyType && (() => {
                  const parts = property.propertyType.split(",").filter(Boolean)
                  return parts[0] ? (
                    <div className="detail-stat">
                      <span className="detail-stat-lbl">Type</span>
                      <span className="detail-stat-val" style={{ textTransform: "capitalize" }}>{parts[0]}</span>
                    </div>
                  ) : null
                })()}
              </div>

              {/* Sub-types */}
              {subTypes.length > 0 && (
                <div className="detail-section">
                  <p className="detail-section-lbl">Type</p>
                  <div className="detail-chips">
                    {subTypes.map(s => (
                      <span key={s} className="detail-chip detail-chip-green">
                        {SUBTYPE_ICONS[s] ?? "🏷️"} {s.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {amenList.length > 0 && (
                <div className="detail-section">
                  <p className="detail-section-lbl">Amenities</p>
                  <div className="detail-chips">
                    {amenList.map(a => (
                      <span key={a} className="detail-chip detail-chip-amber">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {property.notes && property.notes.trim().length > 0 && (
                <div className="detail-section">
                  <p className="detail-section-lbl">📝 Notes</p>
                  <div className="detail-notes">{property.notes}</div>
                </div>
              )}

              {/* Action buttons */}
              <div className="detail-actions">
                <button className="detail-act detail-act-wa" onClick={handleShare}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
                <button className="detail-act detail-act-pdf" onClick={() => { setShowDetail(false); setShowPDFModal(true) }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  PDF
                </button>
                {center && (
                  <button className="detail-act detail-act-map" onClick={() => openInMaps(center.lat, center.lng, property.title)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
                      <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    View on Map
                  </button>
                )}
                <button className="detail-act detail-act-edit" onClick={() => navigate(`/edit-property/${property.id}`)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
              </div>

              {/* Property ID */}
              <p className="detail-id">Property ID: #{property.id}</p>

            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showPDFModal && <PropertyPDFModal property={property} onClose={() => setShowPDFModal(false)} />}

      {showConfirm && (
        <div className="confirm-overlay" onClick={() => !deleting && setShowConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3 className="confirm-title">Delete Property?</h3>
            <p className="confirm-msg"><strong>"{property.title}"</strong> will be permanently deleted.</p>
            {deleteErr && <p className="confirm-err">{deleteErr}</p>}
            <div className="confirm-btns">
              <button className="confirm-cancel" onClick={() => setShowConfirm(false)} disabled={deleting}>Cancel</button>
              <button className="confirm-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? <><span className="del-spinner" /> Deleting...</> : <>🗑 Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="pcard-toast">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toastMsg}
        </div>
      )}
    </>
  )
}