import { useState } from "react"
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
  images?: { id: number; imageUrl: string; propertyId: number }[]
  boundaryPoints?: { latitude: number; longitude: number; propertyId: number }[]
}

type Props = { property: Property; onClose: () => void }

const BASE_URL = `${import.meta.env.VITE_API_URL}`

export default function PropertyPDFModal({ property, onClose }: Props) {
  const { generate }     = usePropertyPDF()
  const [loading, setLoading]   = useState(false)
  const [step, setStep]         = useState<"main" | "whatsapp">("main")
  const [waMsg, setWaMsg]       = useState(
    `Hi! I'd like to inquire about this property:\n\n🏡 *${property.title}*\n📍 ${property.locationName}\n📐 ${Math.round(Number(property.totalAreaInSqFt)).toLocaleString()} sq ft\n💰 Rs. ${Math.round(property.totalPrice).toLocaleString()}\n\nPlease share more details.`
  )
  const [generated, setGenerated] = useState(false)
  const [imgBlob, setImgBlob]     = useState<Blob | null>(null)

  const mainImg = property.images?.[0]?.imageUrl
    ? `${BASE_URL}${property.images[0].imageUrl}`
    : null

  const handleGenerate = async (action: "save" | "whatsapp" | "instagram" | "facebook" | "copy") => {
    if (action === "whatsapp") { setStep("whatsapp"); return }
    setLoading(true)
    try { await generate(property, action as any) }
    finally { setLoading(false) }
  }

  const handleGenerateForWA = async () => {
    setLoading(true)
    try {
      // Generate image first, then open WA with custom message
      await generate(property, "save")  // saves to device
      setGenerated(true)
      setTimeout(() => {
        window.open("https://wa.me/?text=" + encodeURIComponent(waMsg + "\n\n_(Property card image saved to your device — attach it)_"), "_blank")
      }, 800)
    } finally { setLoading(false) }
  }

  const handleWASendDirect = async () => {
    setLoading(true)
    try {
      await generate(property, "whatsapp")
      setGenerated(true)
    } finally { setLoading(false) }
  }

  const defaultMsg = `🏡 *${property.title}*\n📍 ${property.locationName}\n📐 ${Math.round(Number(property.totalAreaInSqFt)).toLocaleString()} sq ft\n💰 Rs. ${Math.round(property.totalPrice).toLocaleString()}`

  return (
    <div className="pdfm-overlay" onClick={onClose}>
      <div className="pdfm-sheet" onClick={e => e.stopPropagation()}>

        {/* Handle bar */}
        <div className="pdfm-handle" />

        {step === "main" && <>
          {/* Preview thumbnail */}
          <div className="pdfm-preview">
            {mainImg
              ? <img src={mainImg} alt="" className="pdfm-preview-img" />
              : <div className="pdfm-preview-placeholder">🏡</div>
            }
            <div className="pdfm-preview-overlay">
              <p className="pdfm-preview-title">{property.title}</p>
              <p className="pdfm-preview-sub">📍 {property.locationName}</p>
            </div>
          </div>

          <div className="pdfm-body">
            <h3 className="pdfm-title">Share Property</h3>
            <p className="pdfm-sub">Choose how you want to share this listing</p>

            {/* Primary: Save image */}
            <button className="pdfm-save-btn" onClick={() => handleGenerate("save")} disabled={loading}>
              {loading
                ? <><span className="pdfm-spin" /> Generating image…</>
                : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Save Property Card</>
              }
            </button>

            {/* Share grid */}
            <div className="pdfm-share-grid">

              {/* WhatsApp */}
              <button className="pdfm-share-btn pdfm-wa" onClick={() => handleGenerate("whatsapp")} disabled={loading}>
                <div className="pdfm-share-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="pdfm-share-label">WhatsApp</span>
                <span className="pdfm-share-sub">With custom message</span>
              </button>

              {/* Instagram */}
              <button className="pdfm-share-btn pdfm-ig" onClick={() => handleGenerate("instagram")} disabled={loading}>
                <div className="pdfm-share-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <span className="pdfm-share-label">Instagram</span>
                <span className="pdfm-share-sub">Save & post</span>
              </button>

              {/* Copy link */}
              <button className="pdfm-share-btn pdfm-link" onClick={() => {
                navigator.clipboard?.writeText(
                  `https://maps.google.com/?q=${property.boundaryPoints?.[0]?.latitude ?? ""},${property.boundaryPoints?.[0]?.longitude ?? ""}`
                )
              }} disabled={loading}>
                <div className="pdfm-share-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                <span className="pdfm-share-label">Copy Link</span>
                <span className="pdfm-share-sub">Map location</span>
              </button>

              {/* SMS / iMessage */}
              <button className="pdfm-share-btn pdfm-sms" onClick={async () => {
                setLoading(true)
                try { await generate(property, "save") } finally { setLoading(false) }
                const msg = encodeURIComponent(defaultMsg)
                window.open(`sms:?body=${msg}`, "_blank")
              }} disabled={loading}>
                <div className="pdfm-share-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <span className="pdfm-share-label">SMS</span>
                <span className="pdfm-share-sub">Text message</span>
              </button>

            </div>
          </div>
        </>}

        {step === "whatsapp" && <>
          <div className="pdfm-body">
            <button className="pdfm-back" onClick={() => setStep("main")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <h3 className="pdfm-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25d366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Share
            </h3>
            <p className="pdfm-sub">Customise your message before sending</p>

            {/* Message editor */}
            <div className="pdfm-wa-editor">
              <div className="pdfm-wa-label">Your message</div>
              <textarea
                className="pdfm-wa-textarea"
                value={waMsg}
                onChange={e => setWaMsg(e.target.value)}
                rows={7}
              />
              <div className="pdfm-wa-tip">💡 Tip: Use *bold* for emphasis in WhatsApp</div>
            </div>

            {/* Quick templates */}
            <div className="pdfm-wa-templates">
              <div className="pdfm-wa-template-label">Quick templates</div>
              <div className="pdfm-wa-template-row">
                <button className="pdfm-tpl" onClick={() => setWaMsg(
                  `🏡 *${property.title}* is now available!\n\n📍 ${property.locationName}\n📐 ${Math.round(Number(property.totalAreaInSqFt)).toLocaleString()} sq ft\n💰 Rs. ${Math.round(property.totalPrice).toLocaleString()} total\n\nInterested? Let's talk! 🤝`
                )}>🏷️ Listing</button>
                <button className="pdfm-tpl" onClick={() => setWaMsg(
                  `Hi! Sharing a property that might interest you.\n\n*${property.title}*\n📍 ${property.locationName}\n💰 Rs. ${Math.round(property.totalPrice).toLocaleString()}\n\nLet me know if you'd like to visit! 🙏`
                )}>👋 Referral</button>
                <button className="pdfm-tpl" onClick={() => setWaMsg(
                  `⚡ *HOT LISTING* ⚡\n\n🏡 ${property.title}\n📍 ${property.locationName}\n📐 ${Math.round(Number(property.totalAreaInSqFt)).toLocaleString()} sq ft at just Rs. ${property.pricePerSqFt}/sqft\n\nAct fast before it's gone! 🔥`
                )}>🔥 Urgent</button>
              </div>
            </div>

            {/* Steps */}
            <div className="pdfm-wa-steps">
              <div className="pdfm-wa-step"><span className="pdfm-wa-step-num">1</span>Tap Send — image saves + WhatsApp opens</div>
              <div className="pdfm-wa-step"><span className="pdfm-wa-step-num">2</span>Choose your contact in WhatsApp</div>
              <div className="pdfm-wa-step"><span className="pdfm-wa-step-num">3</span>Attach the saved image to the chat</div>
            </div>

            <button className="pdfm-wa-send" onClick={handleGenerateForWA} disabled={loading}>
              {loading
                ? <><span className="pdfm-spin pdfm-spin-white" />Generating…</>
                : <><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Save Image & Open WhatsApp</>
              }
            </button>

            {generated && (
              <p className="pdfm-wa-done">✅ Image saved! Attach it in the WhatsApp chat.</p>
            )}
          </div>
        </>}

      </div>
    </div>
  )
}