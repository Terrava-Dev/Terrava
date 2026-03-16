import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getProperties } from "../services/propertyService"
import type { Property } from "../models/Property"
import PropertyCard from "../components/PropertyCard"
import { useLang } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import { PROPERTY_STATUSES } from "../models/propertyStatus"
import "./PropertyListPage.css"

export default function PropertyListPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const navigate = useNavigate()
  const { t }    = useLang()
  const { agent, logout } = useAuth()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t("good_morning") : hour < 17 ? t("good_afternoon") : t("good_evening")

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProperties(agent!.agentId)
        setProperties(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Count per status for filter badges
  const countByStatus = (status: string) =>
    properties.filter(p => (p.status ?? "available") === status).length

  const filtered = properties.filter(p => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.locationName.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      activeFilter === "all" || (p.status ?? "available") === activeFilter
    return matchSearch && matchFilter
  })

  const handleStatusChanged = (id: number, status: string) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  const FILTERS = [
    { value: "all",         label: "All",        color: "#888" },
    { value: "available",   label: "Available",  color: "#16a34a" },
    { value: "enquired",    label: "Enquired",   color: "#2563eb" },
    { value: "negotiating", label: "Negotiating",color: "#9333ea" },
    { value: "hold",        label: "On Hold",    color: "#d97706" },
    { value: "sold",        label: "Sold",       color: "#dc2626" },
    { value: "rented",      label: "Rented",     color: "#0284c7" },
  ]

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="header-top">
          <div>
            <p className="header-greeting">{greeting}</p>
            <h1 className="header-name">{agent?.fullName.split(" ")[0]} 👋</h1>
          </div>
          <div className="header-right">
            <div className="header-avatar">
              {agent?.fullName.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <button className="header-logout" onClick={() => { logout(); navigate("/login") }} title="Logout">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-dot" style={{ background: "#4ade80" }} />
            <div className="stat-num">{properties.length}</div>
            <div className="stat-lbl">{t("listings")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-dot" style={{ background: "#dc2626" }} />
            <div className="stat-num">{countByStatus("sold")}</div>
            <div className="stat-lbl">Sold</div>
          </div>
          <div className="stat-card">
            <div className="stat-dot" style={{ background: "#2563eb" }} />
            <div className="stat-num">{countByStatus("enquired")}</div>
            <div className="stat-lbl">Enquired</div>
          </div>
          <div className="stat-card">
            <div className="stat-dot" style={{ background: "#d97706" }} />
            <div className="stat-num">{countByStatus("hold")}</div>
            <div className="stat-lbl">On Hold</div>
          </div>
        </div>

        {/* Search */}
        <div className="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder={t("search_placeholder")}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Filter pills */}
        <div className="filter-scroll">
          {FILTERS.map(f => {
            const count = f.value === "all" ? properties.length : countByStatus(f.value)
            const isActive = activeFilter === f.value
            return (
              <button key={f.value}
                className={`filter-pill ${isActive ? "active" : ""}`}
                style={{ "--pill-color": f.color } as React.CSSProperties}
                onClick={() => setActiveFilter(f.value)}
              >
                <span className="filter-dot" style={{ background: f.color }} />
                {f.label}
                {count > 0 && <span className="filter-count">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="home-body">
        <div className="section-header">
          <h2 className="section-title">{t("my_properties")}</h2>
          <span className="section-count">{filtered.length} {t("listed")}</span>
        </div>

        {loading && (
          <div className="loading-state">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏡</div>
            <p className="empty-title">
              {activeFilter === "all" ? t("no_properties") : `No ${FILTERS.find(f=>f.value===activeFilter)?.label} properties`}
            </p>
            <p className="empty-sub">{t("no_properties_sub")}</p>
            {activeFilter === "all" && (
              <button className="empty-btn" onClick={() => navigate("/add-property")}>
                {t("add_property")}
              </button>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="property-list">
            {filtered.map((property, i) => (
              <PropertyCard
                key={property.id}
                property={property}
                index={i}
                onDeleted={id => setProperties(prev => prev.filter(p => p.id !== id))}
                onStatusChanged={handleStatusChanged}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}