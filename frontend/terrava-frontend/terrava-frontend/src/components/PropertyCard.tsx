import { useState, useRef, useEffect } from "react"
import type { CSSProperties } from "react"
import { useNavigate } from "react-router-dom"
import type { Property } from "../models/Property"
import { PROPERTY_STATUSES, getStatus } from "../models/propertyStatus"
import { usePropertyPDF } from "./usePropertyPDF"
import "./PropertyCard.css"

const STATUS_DOT_CLASS: Record<string, string> = {
  available: "status-dot-available",
  enquired: "status-dot-enquired",
  hold: "status-dot-hold",
  negotiating: "status-dot-negotiating",
  rented: "status-dot-rented",
  sold: "status-dot-sold",
}

const BASE_URL = `${import.meta.env.VITE_API_URL}`
const IMG_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ?? ""

const SUBTYPE_ICONS: Record<string, string> = {
  duplex: "Duplex",
  villa: "Villa",
  independent: "Ind",
  studio: "Std",
  agricultural: "Agri",
  residential: "Res",
  industrial: "Ind",
  waterfront: "Lake",
  corner_plot: "Corner",
  furnished: "Full",
  semi_furnished: "Semi",
  showroom: "Show",
  office: "Office",
  warehouse: "Store",
  villa_plot: "Villa",
  open_plot: "Open",
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "available":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    case "enquired":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case "negotiating":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 7h8" />
          <path d="M8 17h8" />
          <path d="M5 12h14" />
        </svg>
      )
    case "hold":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="10" y1="5" x2="10" y2="19" />
          <line x1="14" y1="5" x2="14" y2="19" />
        </svg>
      )
    case "sold":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 12V7a2 2 0 0 0-2-2h-5" />
          <path d="M8 12 3 7l5-5" />
          <path d="M3 7h11a2 2 0 0 1 2 2v11l-4-4H5a2 2 0 0 1-2-2Z" />
        </svg>
      )
    case "rented":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="8" cy="15" r="4" />
          <path d="M10.85 12.15 19 4" />
          <path d="M18 8V5h-3" />
        </svg>
      )
    default:
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

function getBoundaryCenter(points: { latitude: number; longitude: number }[]) {
  if (!points || points.length === 0) return null
  const lat = points.reduce((sum, point) => sum + Number(point.latitude), 0) / points.length
  const lng = points.reduce((sum, point) => sum + Number(point.longitude), 0) / points.length
  return { lat, lng }
}

function openInMaps(lat: number, lng: number, label: string) {
  window.open(`https://www.google.com/maps?q=${lat},${lng}&z=19&label=${encodeURIComponent(label)}`, "_blank")
}

function formatMoney(value: number) {
  if (!value) return "Price on request"
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`
  return `₹${value.toLocaleString("en-IN")}`
}

function formatCompactType(value?: string) {
  if (!value) return "Property"
  return value.replace(/_/g, " ")
}

type Props = {
  property: Property
  index?: number
  onDeleted?: (id: number) => void
  onStatusChanged?: (id: number, status: string) => void
}

export default function PropertyCard({ property, index = 0, onDeleted, onStatusChanged }: Props) {
  const navigate = useNavigate()
  const [imgIndex, setImgIndex] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState("")
  const [savingImage, setSavingImage] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(property.status ?? "available")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { generate } = usePropertyPDF()

  useEffect(() => {
    if (!showStatusMenu) return
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showStatusMenu])

  useEffect(() => {
    document.body.style.overflow = showDetail ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [showDetail])

  const images = property.images ?? []
  const status = getStatus(currentStatus)
  const center = getBoundaryCenter(property.boundaryPoints ?? [])
  const mainImg = images[0]?.imageUrl
  const propertyParts = (property.propertyType ?? "").split(",").filter(Boolean)
  const mainType = propertyParts[0] ?? "property"
  const subTypes = propertyParts.slice(1, 4)
  const amenList = (property.amenities ?? "").split(",").filter(Boolean)
  const approvals = [
    property.dtcpApproved ? { label: "DTCP", tone: "green" } : null,
    property.reraApproved ? { label: "RERA", tone: "blue" } : null,
  ].filter(Boolean) as { label: string; tone: string }[]

  const showToastMsg = (message: string) => {
    setToastMsg(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteErr("")
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
    setShowStatusMenu(false)
    setUpdatingStatus(true)
    try {
      await fetch(`${BASE_URL}/properties/${property.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      setCurrentStatus(newStatus)
      onStatusChanged?.(property.id, newStatus)
      showToastMsg(`Marked as ${getStatus(newStatus).label}`)
    } catch {
      showToastMsg("Failed to update status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleShare = () => {
    const text = `🏡 *${property.title}*\n📍 ${property.locationName}\n📐 ${Math.round(Number(property.totalAreaInSqFt)).toLocaleString()} sq ft\n💰 ${formatMoney(property.totalPrice)}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const handleSaveImage = async () => {
    setSavingImage(true)
    try {
      await generate(property, "save")
      showToastMsg("Image saved")
    } catch {
      showToastMsg("Failed to save image")
    } finally {
      setSavingImage(false)
    }
  }

  return (
    <>
      <article className="pcard" style={{ animationDelay: `${index * 50}ms` }}>
        <div className="pcard-main" onClick={() => setShowDetail(true)} role="button" tabIndex={0} onKeyDown={event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setShowDetail(true)
          }
        }}>
          <div className="pcard-hero">
            <div className="pcard-media">
              {mainImg ? (
                <img src={`${IMG_URL}${mainImg}`} alt={property.title} className="pcard-thumb-img" />
              ) : (
                <div className="pcard-thumb-empty">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
                    <path d="M9 21v-6h6v6" />
                  </svg>
                </div>
              )}

              <div className="pcard-media-top">
                <span className="pcard-type-chip">
                  <span className="pcard-type-chip-icon">⌂</span>
                  {formatCompactType(mainType)}
                </span>
                {images.length > 1 && <span className="pcard-media-badge">{images.length} photos</span>}
              </div>
            </div>

            <div className="pcard-summary">
              <div className="pcard-summary-head">
                <div className="pcard-title-wrap">
                  <p className="pcard-kicker">{formatCompactType(mainType)} property</p>
                  <h3 className="pcard-title">{property.title}</h3>
                  <p className="pcard-location">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{property.locationName}</span>
                  </p>
                </div>

                <div className="pcard-status-wrap" ref={menuRef} onClick={event => event.stopPropagation()}>
                <button
                  className="pcard-status-pill"
                  style={{ "--stamp-color": status.stampColor } as CSSProperties}
                  onClick={() => setShowStatusMenu(value => !value)}
                  disabled={updatingStatus}
                  type="button"
                >
                  <span className="pcard-status-icon">
                    <StatusIcon status={currentStatus} />
                  </span>
                  <span>{updatingStatus ? "..." : status.label}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                  {showStatusMenu && (
                    <div className="pcard-status-menu">
                      {PROPERTY_STATUSES.map(item => (
                        <button
                          key={item.value}
                          className={`pcard-status-option ${currentStatus === item.value ? "active" : ""}`}
                          style={{ "--opt-color": item.textColor } as CSSProperties}
                          onClick={() => handleStatusChange(item.value)}
                          type="button"
                      >
                        <span className="pcard-status-icon">
                          <StatusIcon status={item.value} />
                        </span>
                        <span>{item.label}</span>
                        {currentStatus === item.value && <span className="pcard-status-check">✓</span>}
                      </button>
                    ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pcard-price-row">
                <strong className="pcard-price">{formatMoney(property.totalPrice)}</strong>
              </div>

              <div className="pcard-metrics">
                <div className="pcard-metric">
                  <span className="pcard-metric-icon">▣</span>
                  <div>
                    <span className="pcard-metric-label">Area</span>
                    <strong className="pcard-metric-value">{Math.round(Number(property.totalAreaInSqFt)).toLocaleString()} sq ft</strong>
                  </div>
                </div>
                <div className="pcard-metric">
                  <span className="pcard-metric-icon">₹</span>
                  <div>
                    <span className="pcard-metric-label">Per sq ft</span>
                    <strong className="pcard-metric-value">{property.pricePerSqFt > 0 ? `₹${property.pricePerSqFt.toLocaleString("en-IN")}` : "NA"}</strong>
                  </div>
                </div>
                <div className="pcard-metric">
                  <span className="pcard-metric-icon">#</span>
                  <div>
                    <span className="pcard-metric-label">Property ID</span>
                    <strong className="pcard-metric-value">#{property.id}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pcard-content">
            <div className="pcard-tags">
              {subTypes.map(item => (
                <span key={item} className="pcard-tag pcard-tag-type">
                  <span className="pcard-tag-icon">{SUBTYPE_ICONS[item] ?? "Tag"}</span>
                  <span>{formatCompactType(item)}</span>
                </span>
              ))}
              {approvals.map(item => (
                <span key={item.label} className={`pcard-tag pcard-tag-approval pcard-tag-${item.tone}`}>
                  <span className="pcard-tag-icon">{item.label === "DTCP" ? "✓" : "R"}</span>
                  <span>{item.label} Approved</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pcard-actions" onClick={event => event.stopPropagation()}>
          <button className="pcard-action pcard-action-market" onClick={() => navigate(`/share-property/${property.id}`)} type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span>Share Property</span>
          </button>
          <button className="pcard-action pcard-action-edit" onClick={() => navigate(`/edit-property/${property.id}`)} type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Edit</span>
          </button>
          <button className="pcard-action pcard-action-delete" onClick={() => setShowConfirm(true)} type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </article>

      {showDetail && (
        <div className="detail-overlay" onClick={() => setShowDetail(false)}>
          <div className="detail-sheet" onClick={event => event.stopPropagation()}>
            <div className="detail-header">
              <div>
                <h2 className="detail-title">{property.title}</h2>
                <p className="detail-loc">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {property.locationName}
                </p>
              </div>
              <button className="detail-close" onClick={() => setShowDetail(false)} type="button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {images.length > 0 && (
              <div className="detail-carousel">
                <img src={`${IMG_URL}${images[imgIndex].imageUrl}`} alt="" className="detail-carousel-img" />
                {images.length > 1 && (
                  <>
                    <button className="detail-arrow left" onClick={() => setImgIndex(value => (value - 1 + images.length) % images.length)} type="button">‹</button>
                    <button className="detail-arrow right" onClick={() => setImgIndex(value => (value + 1) % images.length)} type="button">›</button>
                    <div className="detail-dots">
                      {images.map((_, imageIndex) => <span key={imageIndex} className={`detail-dot ${imageIndex === imgIndex ? "active" : ""}`} />)}
                    </div>
                    <div className="detail-img-count">{imgIndex + 1} / {images.length}</div>
                  </>
                )}
              </div>
            )}

            <div className="detail-body">
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="detail-stat-lbl">Total Price</span>
                  <span className="detail-stat-val detail-price">{formatMoney(property.totalPrice)}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-lbl">Area</span>
                  <span className="detail-stat-val">{Math.round(Number(property.totalAreaInSqFt)).toLocaleString()} sq ft</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-lbl">Per sq ft</span>
                  <span className="detail-stat-val">{property.pricePerSqFt > 0 ? `₹${property.pricePerSqFt.toLocaleString("en-IN")}` : "NA"}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-lbl">Status</span>
                  <span className="detail-stat-val" style={{ color: status.stampColor }}>{status.label}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-lbl">DTCP</span>
                  <span className="detail-stat-val">{property.dtcpApproved ? "Approved" : "No"}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-lbl">RERA</span>
                  <span className="detail-stat-val">{property.reraApproved ? "Approved" : "No"}</span>
                </div>
              </div>

              {subTypes.length > 0 && (
                <div className="detail-section">
                  <p className="detail-section-lbl">Type</p>
                  <div className="detail-chips">
                    {subTypes.map(item => (
                      <span key={item} className="detail-chip detail-chip-green">
                        {formatCompactType(item)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {approvals.length > 0 && (
                <div className="detail-section">
                  <p className="detail-section-lbl">Approvals</p>
                  <div className="detail-chips">
                    {approvals.map(item => (
                      <span key={item.label} className={`detail-chip ${item.tone === "green" ? "detail-chip-green" : "detail-chip-blue"}`}>
                        {item.label} Approved
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {amenList.length > 0 && (
                <div className="detail-section">
                  <p className="detail-section-lbl">Amenities</p>
                  <div className="detail-chips">
                    {amenList.map(item => (
                      <span key={item} className="detail-chip detail-chip-amber">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {property.notes && property.notes.trim().length > 0 && (
                <div className="detail-section">
                  <p className="detail-section-lbl">Notes</p>
                  <div className="detail-notes">{property.notes}</div>
                </div>
              )}

              <div className="detail-actions">
                <button className="detail-act detail-act-pdf" onClick={handleSaveImage} disabled={savingImage} type="button">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="14" rx="2" />
                    <circle cx="8.5" cy="9" r="1.2" />
                    <path d="M21 15l-4.5-4.5-5.5 5.5" />
                    <path d="M12 18v3" />
                    <path d="M9.5 18.5 12 21l2.5-2.5" />
                  </svg>
                  {savingImage ? "Saving..." : "Save Image"}
                </button>
                {center && (
                  <button className="detail-act detail-act-map" onClick={() => openInMaps(center.lat, center.lng, property.title)} type="button">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    View on Map
                  </button>
                )}
              </div>

              <p className="detail-id">Property ID: #{property.id}</p>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="confirm-overlay" onClick={() => !deleting && setShowConfirm(false)}>
          <div className="confirm-modal" onClick={event => event.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3 className="confirm-title">Delete Property?</h3>
            <p className="confirm-msg"><strong>{property.title}</strong> will be permanently deleted.</p>
            {deleteErr && <p className="confirm-err">{deleteErr}</p>}
            <div className="confirm-btns">
              <button className="confirm-cancel" onClick={() => setShowConfirm(false)} disabled={deleting} type="button">Cancel</button>
              <button className="confirm-delete" onClick={handleDelete} disabled={deleting} type="button">
                {deleting ? <><span className="del-spinner" /> Deleting...</> : <>Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="pcard-toast">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toastMsg}
        </div>
      )}
    </>
  )
}
