// src/pages/MarketingPage.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import "./MarketingPage.css"

const BASE_URL = import.meta.env.VITE_API_URL

type Property = {
  id: number
  title: string
  locationName: string
  totalAreaInSqFt: number
  pricePerSqFt: number
  totalPrice: number
}

type GeneratedContent = {
  content: string
  hashtags: string
  visualSpec: string
}

const THEMES = [
  { id: "standard", label: "Standard", icon: "🏠" },
  { id: "diwali", label: "Diwali", icon: "🪔" },
  { id: "pongal", label: "Pongal", icon: "🌾" },
  { id: "summer", label: "Summer", icon: "☀️" },
  { id: "monsoon", label: "Monsoon", icon: "🌧️" },
]

const TONES = ["Professional", "Friendly", "Urgent", "Luxury"]

// ✅ NEW: Language options
const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "ta", label: "Tamil" },
  { id: "kn", label: "Kannada" },
  { id: "te", label: "Telugu" },
]

export default function MarketingPage({ preselectedProperty }: { preselectedProperty?: Property }) {
  const navigate = useNavigate()
  const { agent } = useAuth()

  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProp, setSelectedProp] = useState<Property | null>(preselectedProperty ?? null)

  const [theme, setTheme] = useState("standard")
  const [tone, setTone] = useState("Professional")

  // ✅ NEW: language state
  const [language, setLanguage] = useState("en")

  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedContent | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!agent?.agentId) return
    axios.get(`${BASE_URL}/properties`, { params: { agentId: agent.agentId } })
      .then(r => {
        setProperties(r.data)
        if (!preselectedProperty && r.data.length > 0) setSelectedProp(r.data[0])
      })
  }, [agent])

  const handleGenerate = async () => {
    if (!selectedProp) return
    setGenerating(true)
    setError("")
    setResult(null)

    try {
      const res = await axios.post(`${BASE_URL}/marketing/generate`, {
        propertyId: selectedProp.id,
        theme,
        tone,
        language, // ✅ send language
        agentName: agent?.fullName ?? "Agent",
        agentPhone: agent?.phone ?? "",
      })

      setResult(res.data)
    } catch (e: any) {
      setError("Generation failed")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mkt-page">

      <h1>Marketing Studio</h1>

      {/* Property */}
      <div className="mkt-section">
        <label>Property</label>
        <select onChange={e => {
          const p = properties.find(x => x.id === Number(e.target.value))
          setSelectedProp(p ?? null)
        }}>
          {properties.map(p => (
            <option key={p.id} value={p.id}>
              {p.title} - ₹{p.totalPrice}
            </option>
          ))}
        </select>
      </div>

      {/* Theme */}
      <div className="mkt-section">
        <label>Theme</label>
 <div className="mkt-btn-group">
  {THEMES.map(t => (
    <button
      key={t.id}
      className={theme === t.id ? "active" : ""}
      onClick={() => setTheme(t.id)}
    >
      {t.icon} {t.label}
    </button>
  ))}
</div>
      </div>

      {/* Tone */}
      <div className="mkt-section">
        <label>Tone</label>
<div className="mkt-btn-group">
  {TONES.map(t => (
    <button
      key={t}
      className={tone === t ? "active" : ""}
      onClick={() => setTone(t)}
    >
      {t}
    </button>
  ))}
</div>
      </div>

      {/* ✅ NEW: Language Selector */}
      <div className="mkt-section">
        <label>Language</label>
<div className="mkt-btn-group">
  {LANGUAGES.map(l => (
    <button
      key={l.id}
      className={language === l.id ? "active" : ""}
      onClick={() => setLanguage(l.id)}
    >
      {l.label}
    </button>
  ))}
</div>
      </div>

      {/* Generate */}
      <button onClick={handleGenerate} disabled={generating}>
        {generating ? "Generating..." : "Generate"}
      </button>

      {/* Result */}
      {result && (
        <div className="mkt-result">
          <h3>Content</h3>
          <pre>{result.content}</pre>

          <h3>Hashtags</h3>
          <p>{result.hashtags}</p>

          <h3>Visual Tip</h3>
          <p>{result.visualSpec}</p>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  )
}