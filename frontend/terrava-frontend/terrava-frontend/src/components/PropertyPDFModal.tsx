import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePropertyPDF } from "./usePropertyPDF"
import "./PropertyPDFModal.css"

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
  notes?: string
  dtcpApproved?: boolean
  reraApproved?: boolean
  images?: { id: number; imageUrl: string; propertyId: number }[]
  boundaryPoints?: { latitude: number; longitude: number; propertyId: number }[]
}

type Props = { property: Property; onClose: () => void }

const BASE_URL = `${import.meta.env.VITE_API_URL}`

export default function PropertyPDFModal({ property, onClose }: Props) {
  const navigate = useNavigate()
  const { generate } = usePropertyPDF()
  const [loading, setLoading] = useState(false)
  const [copyDone, setCopyDone] = useState(false)

  const mainImg = property.images?.[0]?.imageUrl
    ? `${BASE_URL}${property.images[0].imageUrl}`
    : null

  const handleSaveImage = async () => {
    setLoading(true)
    try {
      await generate(property, "save")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyMapLink = async () => {
    const firstPoint = property.boundaryPoints?.[0]
    if (!firstPoint) return
    const mapUrl = `https://maps.google.com/?q=${firstPoint.latitude},${firstPoint.longitude}`
    await navigator.clipboard?.writeText(mapUrl)
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 1800)
  }

  const openShareProperty = () => {
    onClose()
    navigate(`/share-property/${property.id}`)
  }

  return (
    <div className="pdfm-overlay" onClick={onClose}>
      <div className="pdfm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="pdfm-handle" />

        <div className="pdfm-preview">
          {mainImg ? (
            <img src={mainImg} alt="" className="pdfm-preview-img" />
          ) : (
            <div className="pdfm-preview-placeholder">Property</div>
          )}
          <div className="pdfm-preview-overlay">
            <p className="pdfm-preview-title">{property.title}</p>
            <p className="pdfm-preview-sub">{property.locationName}</p>
          </div>
        </div>

        <div className="pdfm-body">
          <h3 className="pdfm-title">Property Actions</h3>
          <p className="pdfm-sub">Quick actions for this listing. Social sharing continues in Share Property.</p>

          <button className="pdfm-save-btn" onClick={handleSaveImage} disabled={loading}>
            {loading ? (
              <>
                <span className="pdfm-spin" /> Generating image...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Save Image
              </>
            )}
          </button>

          <div className="pdfm-share-grid">
            <button className="pdfm-share-btn pdfm-wa" onClick={openShareProperty} disabled={loading}>
              <div className="pdfm-share-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <span className="pdfm-share-label">Share Property</span>
              <span className="pdfm-share-sub">WhatsApp, Instagram and more</span>
            </button>

            <button className="pdfm-share-btn pdfm-link" onClick={handleCopyMapLink} disabled={loading || !property.boundaryPoints?.length}>
              <div className="pdfm-share-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <span className="pdfm-share-label">{copyDone ? "Copied" : "Copy Map Link"}</span>
              <span className="pdfm-share-sub">Location only</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
