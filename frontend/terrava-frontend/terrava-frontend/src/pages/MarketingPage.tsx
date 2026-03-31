import { useEffect, useState } from "react"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import { usePropertyPDF } from "../components/usePropertyPDF"
import "./MarketingPage.css"

const BASE_URL = import.meta.env.VITE_API_URL

type Property = {
  id: number
  title: string
  locationName: string
  totalAreaInSqFt: number
  pricePerSqFt: number
  totalPrice: number
  pricePerAcre?: number
  amenities?: string
  propertyType?: string
  notes?: string
  images?: { id: number; imageUrl: string; propertyId: number }[]
  boundaryPoints?: { latitude: number; longitude: number; propertyId: number }[]
}

type GeneratedContent = {
  content: string
  hashtags: string
}

// ─── NEW: Follow-up prompt types ───────────────────────────
type ReminderLead = {
  id: number
  title: string
  locationName: string
  totalPrice: number
}

const QUICK_OPTIONS = [
  { label: "Tomorrow 9 AM", days: 1 },
  { label: "In 2 days",     days: 2 },
  { label: "This weekend",  days: 5 },
]

// ─── NEW: FollowUpPrompt component ─────────────────────────
function FollowUpPrompt({
  lead,
  onSave,
  onDismiss,
}: {
  lead: ReminderLead
  onSave: (lead: ReminderLead, days: number | null, customDate?: Date) => void
  onDismiss: () => void
}) {
  const [showCustom, setShowCustom] = useState(false)
  const [customDate, setCustomDate] = useState("")
  const [customTime, setCustomTime] = useState("09:00")

  function handleCustomSave() {
    if (!customDate) return
    onSave(lead, null, new Date(`${customDate}T${customTime}`))
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 999,
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderRadius: "16px 16px 0 0",
          padding: "20px 20px 36px",
          zIndex: 1000,
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: 36,
            height: 4,
            background: "#e0e0e0",
            borderRadius: 2,
            margin: "0 auto 20px",
          }}
        />

        <p style={{ fontWeight: 600, fontSize: 16, margin: "0 0 4px", color: "#111" }}>
          Set a follow-up reminder?
        </p>
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>
          {lead.title} · {lead.locationName}
        </p>

        {!showCustom ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => onSave(lead, opt.days)}
                  style={{
                    padding: "13px 16px",
                    borderRadius: 10,
                    border: "1.5px solid #e8e8e8",
                    background: "#fafafa",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#111",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustom(true)}
                style={{
                  padding: "13px 16px",
                  borderRadius: 10,
                  border: "1.5px solid #e8e8e8",
                  background: "#fafafa",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#111",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Custom date &amp; time...
              </button>
            </div>
            <button
              onClick={onDismiss}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px",
                border: "none",
                background: "none",
                fontSize: 14,
                color: "#aaa",
                cursor: "pointer",
              }}
            >
              No reminder
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                style={{
                  flex: 1,
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "1.5px solid #e8e8e8",
                  fontSize: 15,
                  color: "#111",
                }}
              />
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                style={{
                  width: 110,
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "1.5px solid #e8e8e8",
                  fontSize: 15,
                  color: "#111",
                }}
              />
            </div>
            <button
              onClick={handleCustomSave}
              disabled={!customDate}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 10,
                border: "none",
                background: customDate ? "#111" : "#ddd",
                color: customDate ? "#fff" : "#aaa",
                fontSize: 15,
                fontWeight: 600,
                cursor: customDate ? "pointer" : "not-allowed",
                marginBottom: 10,
              }}
            >
              Set reminder
            </button>
            <button
              onClick={() => setShowCustom(false)}
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                background: "none",
                fontSize: 14,
                color: "#aaa",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </>
        )}
      </div>
    </>
  )
}
// ───────────────────────────────────────────────────────────

const THEMES = [
  { id: "standard", label: "Standard", icon: "home" },
  { id: "diwali",   label: "Diwali",   icon: "lamp" },
  { id: "pongal",   label: "Pongal",   icon: "harvest" },
  { id: "summer",   label: "Summer",   icon: "sun" },
  { id: "monsoon",  label: "Monsoon",  icon: "rain" },
  { id: "newyear",  label: "New Year", icon: "spark" },
]

const TONES = [
  { id: "Professional", icon: "brief" },
  { id: "Friendly",     icon: "smile" },
  { id: "Urgent",       icon: "bolt" },
  { id: "Luxury",       icon: "shine" },
]

const LANGUAGES = [
  { id: "en", label: "English",  flag: "EN" },
  { id: "ta", label: "Tamil",    flag: "TA" },
  { id: "kn", label: "Kannada",  flag: "KN" },
  { id: "te", label: "Telugu",   flag: "TE" },
]

const PLATFORMS = [
  { id: "whatsapp",  label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook",  label: "Facebook" },
  { id: "sms",       label: "SMS" },
]

const LOADING_MESSAGES = [
  "Crafting your perfect pitch...",
  "Preparing your share-ready post...",
  "Analysing property highlights...",
  "Almost ready...",
]

type IconName =
  | "property" | "platforms" | "theme" | "tone" | "language" | "notes"
  | "copy" | "share" | "spark" | "image" | "caption" | "home" | "lamp"
  | "harvest" | "sun" | "rain" | "brief" | "smile" | "bolt" | "shine"

function UiIcon({ name, className = "" }: { name: IconName; className?: string }) {
  switch (name) {
    case "property":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M12 3 4 9v11h16V9l-8-6Zm0 2.47 6 4.5V18h-4v-5H10v5H6V9.97l6-4.5Z" /></svg>
    case "platforms":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M4 5h7v6H4V5Zm9 0h7v4h-7V5ZM4 13h7v6H4v-6Zm9-2h7v8h-7v-8Z" /></svg>
    case "theme":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M12 3a9 9 0 1 0 0 18c1.7 0 3-1.3 3-3 0-.63-.2-1.2-.53-1.66-.35-.49-.21-1.17.38-1.41.34-.14.73-.15 1.15-.03A3.5 3.5 0 1 0 12 3Zm-4 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm8-1.5A1.5 1.5 0 1 1 19 8.5a1.5 1.5 0 0 1-3 0ZM7.5 15A1.5 1.5 0 1 1 9 13.5 1.5 1.5 0 0 1 7.5 15Z" /></svg>
    case "tone":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M4 4h10a4 4 0 0 1 0 8H9l-4 4V4Zm11 9h2a3 3 0 1 1 0 6h-6v-2h6a1 1 0 1 0 0-2h-2v-2Z" /></svg>
    case "language":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.92 9h-3.05a15.9 15.9 0 0 0-1.18-5.01A8.03 8.03 0 0 1 18.92 11ZM12 4.05c.79 1.03 1.9 3.33 2.32 6.95H9.68C10.1 7.38 11.21 5.08 12 4.05ZM4.99 13h3.05c.17 1.81.57 3.53 1.18 5.01A8.03 8.03 0 0 1 4.99 13Zm3.05-2H4.99a8.03 8.03 0 0 1 4.23-5.01A15.9 15.9 0 0 0 8.04 11ZM12 19.95c-.79-1.03-1.9-3.33-2.32-6.95h4.64c-.42 3.62-1.53 5.92-2.32 6.95ZM14.78 18.01A15.9 15.9 0 0 0 15.96 13h2.96a8.03 8.03 0 0 1-4.14 5.01Z" /></svg>
    case "notes":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M5 3h10l4 4v14H5V3Zm9 1.5V8h3.5L14 4.5ZM8 12h8v1.8H8V12Zm0-4h4v1.8H8V8Zm0 8h8v1.8H8V16Z" /></svg>
    case "copy":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M8 7V4h10v12h-3v3H5V7h3Zm2 0h5v7h1V6h-6v1Zm-3 2v8h6V9H7Z" /></svg>
    case "share":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M15 5 22 12l-7 7-1.41-1.41L18.17 13H8a4 4 0 0 0-4 4v2H2v-2a6 6 0 0 1 6-6h10.17l-4.58-4.59L15 5Z" /></svg>
    case "spark":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="m12 2 1.7 4.8L18.5 8l-4.8 1.2L12 14l-1.7-4.8L5.5 8l4.8-1.2L12 2Zm6.5 11 1 2.8 2.8 1-2.8 1-1 2.7-1-2.7-2.7-1 2.7-1 1-2.8ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" /></svg>
    case "image":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14l-4-4H6a2 2 0 0 1-2-2V5Zm4 2.5A1.5 1.5 0 1 0 8 10.5 1.5 1.5 0 0 0 8 7.5Zm10 7.09-3.5-3.5-4.5 4.5H18v-1Z" /></svg>
    case "caption":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 4v2h8V8H8Zm0 4v2h5v-2H8Z" /></svg>
    case "home":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M12 4 5 9.25V20h5v-5h4v5h5V9.25L12 4Z" /></svg>
    case "lamp":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M12 3 7 8h3l-2 4h3l-1.5 4.5L17 9h-3l2-3h-4Z" /></svg>
    case "harvest":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M11 3c-2.4 1.4-4 4.1-4 7.3 0 2.7 1.1 5.2 3 7L12 21l2-3.7c1.9-1.8 3-4.3 3-7 0-3.2-1.6-5.9-4-7.3v8H11V3Zm-5.5 6c1 1 1.5 2.1 1.5 3.5S6.5 15 5.5 16c-1-1-1.5-2.1-1.5-3.5S4.5 10 5.5 9Zm13 0c1 1 1.5 2.1 1.5 3.5S19.5 15 18.5 16c-1-1-1.5-2.1-1.5-3.5S17.5 10 18.5 9Z" /></svg>
    case "sun":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M11 1h2v4h-2V1Zm0 18h2v4h-2v-4ZM1 11h4v2H1v-2Zm18 0h4v2h-4v-2ZM4.93 6.34l1.41-1.41 2.83 2.83-1.41 1.41L4.93 6.34Zm9.9 9.9 1.41-1.41 2.83 2.83-1.41 1.41-2.83-2.83ZM17.66 4.93l1.41 1.41-2.83 2.83-1.41-1.41 2.83-2.83ZM7.76 14.83l1.41 1.41-2.83 2.83-1.41-1.41 2.83-2.83ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" /></svg>
    case "rain":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M7 18c0-.86.36-1.63.94-2.18A4.5 4.5 0 0 1 12 8a4.9 4.9 0 0 1 4.74 3.67A3.6 3.6 0 1 1 17.5 19H7v-1Zm2 2.5L7.5 23H6l1.5-2.5H9Zm4 0L11.5 23H10l1.5-2.5H13Zm4 0L15.5 23H14l1.5-2.5H17Z" /></svg>
    case "brief":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M9 4h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2h3V6a2 2 0 0 1 2-2Zm0 3h6V6H9v1Zm11 5h-6v2h-4v-2H4v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5Z" /></svg>
    case "smile":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-3 7.5A1.5 1.5 0 1 1 9 12a1.5 1.5 0 0 1 0-2.5Zm6 0A1.5 1.5 0 1 1 15 12a1.5 1.5 0 0 1 0-2.5ZM7.8 14h8.4a4.2 4.2 0 0 1-8.4 0Z" /></svg>
    case "bolt":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>
    case "shine":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="m12 2 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Zm7 12 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14ZM5 15l.9 2.1L8 18l-2.1.9L5 21l-.9-2.1L2 18l2.1-.9L5 15Z" /></svg>
    default:
      return null
  }
}

function PlatformIcon({ id, className = "" }: { id: string; className?: string }) {
  switch (id) {
    case "whatsapp":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M12 2a10 10 0 0 0-8.72 14.9L2 22l5.27-1.24A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.29-.17-3.13.74.76-3.05-.19-.31A8 8 0 1 1 12 20Zm4.28-5.82c-.23-.11-1.36-.67-1.57-.75-.21-.08-.36-.11-.51.11s-.59.75-.72.9c-.13.15-.26.17-.49.06a6.44 6.44 0 0 1-1.9-1.17 7.14 7.14 0 0 1-1.31-1.63c-.14-.23-.02-.35.09-.46.1-.1.23-.26.34-.38.11-.13.14-.22.22-.37.08-.15.04-.28-.02-.39-.06-.11-.51-1.23-.7-1.68-.18-.44-.37-.38-.51-.39h-.43c-.15 0-.39.06-.6.28-.2.22-.78.77-.78 1.88s.8 2.18.92 2.33c.11.15 1.56 2.38 3.77 3.34.53.23.94.37 1.26.47.53.17 1 .15 1.37.09.42-.06 1.36-.56 1.56-1.11.19-.55.19-1.02.13-1.11-.05-.09-.2-.14-.43-.25Z" /></svg>
    case "instagram":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7Zm5 2.3A5.5 5.5 0 1 1 6.5 12 5.5 5.5 0 0 1 12 6.5Zm0 2.2A3.3 3.3 0 1 0 15.3 12 3.3 3.3 0 0 0 12 8.7Zm5.75-3.95a1.3 1.3 0 1 1-1.3 1.3 1.3 1.3 0 0 1 1.3-1.3Z" /></svg>
    case "facebook":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.87.24-1.46 1.49-1.46H16.7V4.96A24.3 24.3 0 0 0 14.2 4.8c-2.47 0-4.2 1.5-4.2 4.28V11H7.2v3H10v8h3.5Z" /></svg>
    case "sms":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm1.5 4.5h13v-2h-13v2Zm0 4h9v-2h-9v2Z" /></svg>
    default:
      return null
  }
}

export default function MarketingPage({ preselectedProperty }: { preselectedProperty?: Property }) {
  const { agent } = useAuth()
  const { generate: generateCardImage } = usePropertyPDF()

  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProp, setSelectedProp] = useState<Property | null>(preselectedProperty ?? null)
  const [theme, setTheme] = useState("standard")
  const [tone, setTone] = useState("Professional")
  const [language, setLanguage] = useState("en")
  const [platform, setPlatform] = useState("whatsapp")
  const [captionMode, setCaptionMode] = useState<"ai" | "custom">("ai")
  const [customNote, setCustomNote] = useState("")
  const [agentPhone, setAgentPhone] = useState(agent?.phone ?? "")
  const [caption, setCaption] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [generating, setGenerating] = useState(false)
  const [savingImage, setSavingImage] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [copied, setCopied] = useState(false)

  // ─── NEW: Reminder state ───────────────────────────────────
  const [showReminderPrompt, setShowReminderPrompt] = useState(false)
  const [reminderLead, setReminderLead] = useState<ReminderLead | null>(null)
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!generating) return
    const id = setInterval(() => setLoadingMsg((m) => (m + 1) % LOADING_MESSAGES.length), 1800)
    return () => clearInterval(id)
  }, [generating])

  useEffect(() => {
    if (!agent?.agentId) return
    axios
      .get(`${BASE_URL}/properties`, { params: { agentId: agent.agentId } })
      .then((r) => {
        setProperties(r.data)
        if (!preselectedProperty && r.data.length > 0) setSelectedProp(r.data[0])
      })
  }, [agent, preselectedProperty])

  const formatPrice = (n: number) =>
    n >= 10000000 ? `Rs.${(n / 10000000).toFixed(2)}Cr`
    : n >= 100000  ? `Rs.${(n / 100000).toFixed(1)}L`
    : `Rs.${n.toLocaleString("en-IN")}`

  const buildBasicCaption = (property: Property) => {
    const lines = [
      property.title,
      `Location: ${property.locationName}`,
      `Area: ${property.totalAreaInSqFt.toLocaleString("en-IN")} sq ft`,
      `Price: ${formatPrice(property.totalPrice)}`,
    ]
    if (property.pricePerSqFt > 0) {
      lines.push(`Per sq ft: Rs.${property.pricePerSqFt.toLocaleString("en-IN")}`)
    }
    if (property.notes?.trim()) {
      lines.push(`Notes: ${property.notes.trim()}`)
    }
    return lines.join("\n")
  }

  const clearNotice = () => setTimeout(() => setNotice(""), 2500)

  const handleGenerateCaption = async () => {
    if (!selectedProp) return
    setGenerating(true)
    setError("")
    setNotice("")
    try {
      const res = await axios.post<GeneratedContent>(`${BASE_URL}/marketing/generate`, {
        propertyId: selectedProp.id,
        theme,
        tone,
        language,
        platforms: [platform],
        customNote,
        agentName: agent?.fullName ?? "Agent",
        agentPhone: agentPhone || agent?.phone || "",
      })
      setCaption(res.data.content ?? "")
      setHashtags(res.data.hashtags ?? "")
      setNotice("AI caption generated. You can edit it below.")
      clearNotice()
    } catch {
      setError("Caption generation failed. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const combinedText = [caption.trim(), hashtags.trim()].filter(Boolean).join("\n\n")

  const handleCopyCaption = async () => {
    if (!combinedText) return
    await navigator.clipboard.writeText(combinedText)
    setCopied(true)
    setNotice("Caption copied.")
    setTimeout(() => setCopied(false), 1800)
    clearNotice()
  }

  // ─── UPDATED: handleShare with reminder trigger ────────────
  const handleShare = async () => {
    if (!selectedProp || !combinedText) return
    setError("")
    setNotice("")

    if (platform === "whatsapp") {
      setSavingImage(true)
      try {
        await generateCardImage(
          {
            ...selectedProp,
            pricePerAcre: selectedProp.pricePerAcre ?? selectedProp.pricePerSqFt * 43560,
            amenities: selectedProp.amenities ?? "",
            propertyType: selectedProp.propertyType ?? "property",
            notes: selectedProp.notes ?? "",
            images: selectedProp.images ?? [],
            boundaryPoints: selectedProp.boundaryPoints ?? [],
          },
          "save",
        )
        window.open(
          `https://wa.me/?text=${encodeURIComponent(combinedText + "\n\n(Image saved to your device. Attach it in WhatsApp.)")}`,
          "_blank"
        )
        setNotice("Image saved and WhatsApp opened.")
        clearNotice()

        // ── Show follow-up reminder prompt ──
        setReminderLead({
          id: selectedProp.id,
          title: selectedProp.title,
          locationName: selectedProp.locationName,
          totalPrice: selectedProp.totalPrice,
        })
        setShowReminderPrompt(true)
        // ───────────────────────────────────

      } catch {
        setError("Unable to generate image for WhatsApp.")
      } finally {
        setSavingImage(false)
      }
      return
    }

    if (platform === "sms") {
      window.open(`sms:?body=${encodeURIComponent(combinedText)}`, "_blank")
      return
    }

    await navigator.clipboard.writeText(combinedText)

    if (platform === "instagram") {
      setSavingImage(true)
      try {
        await generateCardImage(
          {
            ...selectedProp,
            pricePerAcre: selectedProp.pricePerAcre ?? selectedProp.pricePerSqFt * 43560,
            amenities: selectedProp.amenities ?? "",
            propertyType: selectedProp.propertyType ?? "property",
            notes: selectedProp.notes ?? "",
            images: selectedProp.images ?? [],
            boundaryPoints: selectedProp.boundaryPoints ?? [],
          },
          "save",
        )
        setNotice("Caption copied and image saved. Open Instagram and post from your gallery.")
        clearNotice()
      } catch {
        setError("Unable to generate image for Instagram.")
      } finally {
        setSavingImage(false)
      }
      return
    }

    if (platform === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(combinedText)}`,
        "_blank"
      )
      setNotice("Caption copied. You can paste it into Facebook after the window opens.")
      clearNotice()
    }
  }
  // ──────────────────────────────────────────────────────────

  // ─── NEW: Save reminder handler ───────────────────────────
  const handleSaveReminder = async (
    lead: ReminderLead,
    days: number | null,
    customDate?: Date
  ) => {
    try {
      let followUpAt: Date
      if (customDate) {
        followUpAt = customDate
      } else {
        followUpAt = new Date()
        followUpAt.setDate(followUpAt.getDate() + (days ?? 1))
        followUpAt.setHours(9, 0, 0, 0)
      }

      await fetch(`${BASE_URL}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent?.agentId,
          propertyId: lead.id,
          propertyTitle: lead.title,
          followUpAt: followUpAt.toISOString(),
          note: `Sent property details via WhatsApp`,
        }),
      })

      setNotice(`Reminder set for ${followUpAt.toLocaleDateString("en-IN")}`)
      clearNotice()
    } catch {
      setError("Could not save reminder. Try again.")
    } finally {
      setShowReminderPrompt(false)
    }
  }
  // ──────────────────────────────────────────────────────────

  const handleGenerateImage = async () => {
    if (!selectedProp) return
    setSavingImage(true)
    setError("")
    setNotice("")
    try {
      await generateCardImage(
        {
          ...selectedProp,
          pricePerAcre: selectedProp.pricePerAcre ?? selectedProp.pricePerSqFt * 43560,
          amenities: selectedProp.amenities ?? "",
          propertyType: selectedProp.propertyType ?? "property",
          notes: selectedProp.notes ?? "",
          images: selectedProp.images ?? [],
          boundaryPoints: selectedProp.boundaryPoints ?? [],
        },
        "save",
      )
      setNotice("Image generated and saved to your device.")
      clearNotice()
    } catch {
      setError("Image generation failed. Please try again.")
    } finally {
      setSavingImage(false)
    }
  }

  return (
    <div className="mkt-page">
      <div className="mkt-hero">
        <div className="mkt-hero-badge">
          <UiIcon name="spark" className="mkt-inline-icon" />
          AI-Powered
        </div>
        <h1>Share <span>Property</span></h1>
        <p className="mkt-hero-sub">Pick a platform, choose caption type, then share or save an image.</p>
      </div>

      <div className="mkt-content">
        <div className="mkt-card">
          <div className="mkt-card-label">
            <span className="mkt-card-label-icon"><UiIcon name="property" className="mkt-mini-icon" /></span>
            Property
          </div>
          <select
            className="mkt-property-select"
            value={selectedProp?.id ?? ""}
            onChange={(e) => {
              const p = properties.find((x) => x.id === Number(e.target.value))
              setSelectedProp(p ?? null)
            }}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} - {formatPrice(p.totalPrice)}
              </option>
            ))}
          </select>

          {selectedProp && (
            <div className="mkt-prop-preview">
              <div className="mkt-prop-preview-icon"><UiIcon name="property" className="mkt-preview-icon" /></div>
              <div className="mkt-prop-preview-info">
                <div className="mkt-prop-preview-name">{selectedProp.title}</div>
                <div className="mkt-prop-preview-price">
                  {selectedProp.locationName} | {selectedProp.totalAreaInSqFt.toLocaleString()} sqft | {formatPrice(selectedProp.totalPrice)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mkt-card">
          <div className="mkt-card-label">
            <span className="mkt-card-label-icon"><UiIcon name="caption" className="mkt-mini-icon" /></span>
            Caption Type
          </div>
          <div className="mkt-mode-row">
            <button type="button" className={`mkt-mode-btn ${captionMode === "ai" ? "active" : ""}`} onClick={() => setCaptionMode("ai")}>
              <UiIcon name="spark" className="mkt-chip-svg" />
              AI Generated
            </button>
            <button
              type="button"
              className={`mkt-mode-btn ${captionMode === "custom" ? "active" : ""}`}
              onClick={() => {
                setCaptionMode("custom")
                if (selectedProp) setCaption(buildBasicCaption(selectedProp))
                setHashtags("")
              }}
            >
              <UiIcon name="notes" className="mkt-chip-svg" />
              Custom
            </button>
          </div>
          <p className="mkt-help">
            {captionMode === "ai"
              ? "Use AI to draft a caption, then edit it before sharing."
              : "Write your own caption and hashtags manually."}
          </p>
        </div>

        {captionMode === "custom" ? (
          <div className="mkt-card">
            <div className="mkt-card-label">
              <span className="mkt-card-label-icon"><UiIcon name="notes" className="mkt-mini-icon" /></span>
              Custom Caption
            </div>
            <textarea
              className="mkt-result-editor mkt-result-editor-standalone"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your custom caption here..."
            />
          </div>
        ) : null}

        {generating && (
          <div className="mkt-loading">
            <div className="mkt-loading-dots"><span /><span /><span /></div>
            <p>{LOADING_MESSAGES[loadingMsg]}</p>
          </div>
        )}

        {error && <div className="mkt-error"><span>!</span>{error}</div>}
        {notice && <div className="mkt-notice"><span>i</span>{notice}</div>}

        {captionMode === "ai" && (
          <div className="mkt-result">
            <div className="mkt-result-header">
              <span className="mkt-result-title">
                <UiIcon name="caption" className="mkt-inline-icon" />
                Caption Editor
              </span>
              <div className="mkt-result-actions">
                <button type="button" className={`mkt-icon-btn ${copied ? "copied" : ""}`} onClick={handleCopyCaption} title="Copy caption">
                  <UiIcon name="copy" className="mkt-action-icon" />
                </button>
              </div>
            </div>

            <div className="mkt-result-body">
              <div className="mkt-result-settings">
                <div className="mkt-settings-group">
                  <div className="mkt-sub-label">
                    <UiIcon name="theme" className="mkt-mini-icon" />
                    Theme
                  </div>
                  <div className="mkt-btn-group">
                    {THEMES.map((t) => (
                      <button key={t.id} type="button" className={`mkt-chip ${theme === t.id ? "active" : ""}`} onClick={() => setTheme(t.id)}>
                        <UiIcon name={t.icon as IconName} className="mkt-chip-svg" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mkt-settings-group">
                  <div className="mkt-sub-label">
                    <UiIcon name="tone" className="mkt-mini-icon" />
                    Tone
                  </div>
                  <div className="mkt-btn-group">
                    {TONES.map((t) => (
                      <button key={t.id} type="button" className={`mkt-chip ${tone === t.id ? "active" : ""}`} onClick={() => setTone(t.id)}>
                        <UiIcon name={t.icon as IconName} className="mkt-chip-svg" />
                        {t.id}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mkt-settings-group">
                  <div className="mkt-sub-label">
                    <UiIcon name="language" className="mkt-mini-icon" />
                    Language
                  </div>
                  <div className="mkt-btn-group">
                    {LANGUAGES.map((l) => (
                      <button key={l.id} type="button" className={`mkt-chip ${language === l.id ? "active" : ""}`} onClick={() => setLanguage(l.id)}>
                        <span className="mkt-chip-flag">{l.flag}</span>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mkt-settings-group">
                  <div className="mkt-sub-label">
                    <UiIcon name="notes" className="mkt-mini-icon" />
                    Special Instructions <span className="mkt-sub-label-optional">(optional)</span>
                  </div>
                  <textarea
                    className="mkt-textarea"
                    placeholder="e.g. Human style caption, DTCP approved, near highway..."
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    maxLength={200}
                  />
                  <div className="mkt-char-count">{customNote.length}/200</div>
                </div>

                <button type="button" className="mkt-generate-btn mkt-generate-btn-inline" onClick={handleGenerateCaption} disabled={generating || !selectedProp}>
                  <UiIcon name="spark" className="mkt-inline-icon" />
                  {generating ? "Generating AI Caption..." : "Generate AI Caption"}
                </button>
              </div>

              <div className="mkt-result-divider" />

              <div>
                <div className="mkt-result-section-label">Caption</div>
                <textarea
                  className="mkt-result-editor"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={captionMode === "ai" ? "Generate an AI caption, then edit it here." : "Write your custom caption here."}
                />
              </div>

              <div className="mkt-result-divider" />

              <div>
                <div className="mkt-result-section-label">Hashtags</div>
                <textarea
                  className="mkt-result-editor mkt-result-editor-tags"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#hashtags"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mkt-card">
          <div className="mkt-card-label">
            <span className="mkt-card-label-icon"><UiIcon name="platforms" className="mkt-mini-icon" /></span>
            Share Property Via
          </div>
          <div className="mkt-platform-grid mkt-platform-grid-single">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`mkt-platform-btn ${platform === p.id ? "active" : ""}`}
                onClick={() => setPlatform(p.id)}
              >
                <span className="platform-icon-wrap">
                  <PlatformIcon id={p.id} className="platform-icon" />
                </span>
                <span className="platform-label">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mkt-card">
          <div className="mkt-card-label">
            <span className="mkt-card-label-icon"><UiIcon name="image" className="mkt-mini-icon" /></span>
            Share Property
          </div>
          <p className="mkt-help">
            {platform === "whatsapp"  && "This will save the image first, then open WhatsApp with your caption."}
            {platform === "instagram" && "This will copy the caption and save the image for posting on Instagram."}
            {platform === "facebook"  && "This will open Facebook sharing and keep your caption ready to paste."}
            {platform === "sms"       && "This will open your SMS app with the caption text."}
          </p>
          <div className="mkt-action-row">
            <button type="button" className="mkt-share-btn primary" onClick={handleShare} disabled={!selectedProp || !combinedText || savingImage}>
              <PlatformIcon id={platform} className="mkt-share-icon" />
              {platform === "whatsapp"  && (savingImage ? "Preparing WhatsApp..."  : "Share via WhatsApp")}
              {platform === "instagram" && (savingImage ? "Preparing Instagram..." : "Share via Instagram")}
              {platform === "facebook"  && "Share via Facebook"}
              {platform === "sms"       && "Share via SMS"}
            </button>
            <button type="button" className="mkt-share-btn" onClick={handleGenerateImage} disabled={savingImage || !selectedProp}>
              <UiIcon name="image" className="mkt-share-icon" />
              {savingImage ? "Generating Image..." : "Generate Image"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── NEW: Follow-up reminder prompt ─────────────────── */}
      {showReminderPrompt && reminderLead && (
        <FollowUpPrompt
          lead={reminderLead}
          onSave={handleSaveReminder}
          onDismiss={() => setShowReminderPrompt(false)}
        />
      )}
      {/* ───────────────────────────────────────────────────── */}
    </div>
  )
}