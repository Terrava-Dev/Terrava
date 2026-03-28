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
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
                "Good evening"

  const greetingIcon =
    hour < 12 ? "🌤️" : hour < 17 ? "☀️" : "🌙"

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

  // Total portfolio value
  const totalValue = properties.reduce((sum, p) => sum + (p.totalPrice ?? 0), 0)
  const formatValue = (n: number) =>
    n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr`
    : n >= 100000  ? `₹${(n / 100000).toFixed(1)}L`
    : `₹${n.toLocaleString("en-IN")}`

  const FILTERS = [
    { value: "all",         label: "All",         color: "#6366f1", icon: "⊞" },
    { value: "available",   label: "Available",   color: "#22c55e", icon: "✓" },
    { value: "enquired",    label: "Enquired",    color: "#3b82f6", icon: "💬" },
    { value: "negotiating", label: "Negotiating", color: "#a855f7", icon: "🤝" },
    { value: "hold",        label: "On Hold",     color: "#f59e0b", icon: "⏸" },
    { value: "sold",        label: "Sold",        color: "#ef4444", icon: "🏷" },
    { value: "rented",      label: "Rented",      color: "#0ea5e9", icon: "🔑" },
  ]

  const initials = agent?.fullName.split(" ")
    .map((n: string) => n[0]).join("").slice(0,2).toUpperCase()

  return (
    <div className="home-page">

      {/* ── HEADER ── */}
      <div className="home-header">

        {/* Top row */}
        <div className="header-top">
          <div className="header-left">
            <div className="greeting-row">
              <span className="greeting-icon">{greetingIcon}</span>
              <span className="header-greeting">{greeting}</span>
            </div>
            <h1 className="header-name">
              {agent?.fullName.split(" ")[0]}
              <span className="header-wave"> 👋</span>
            </h1>
          </div>
          <div className="header-right">
            <button
              className="header-icon-btn notif-btn"
              onClick={() => navigate("/add-property")}
              title="Add Property"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <div className="header-avatar">{initials}</div>
            <button className="header-logout" onClick={() => { logout(); navigate("/login") }} title="Logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Portfolio value banner */}
        <div className="portfolio-banner">
          <div className="portfolio-left">
            <div className="portfolio-label">Total Portfolio Value</div>
            <div className="portfolio-value">{formatValue(totalValue)}</div>
          </div>
          <div className="portfolio-right">
            <div className="portfolio-stat">
              <span className="pstat-num">{properties.length}</span>
              <span className="pstat-lbl">Listings</span>
            </div>
            <div className="portfolio-divider"/>
            <div className="portfolio-stat">
              <span className="pstat-num" style={{color:"#22c55e"}}>{countByStatus("sold")}</span>
              <span className="pstat-lbl">Sold</span>
            </div>
            <div className="portfolio-divider"/>
            <div className="portfolio-stat">
              <span className="pstat-num" style={{color:"#f59e0b"}}>{countByStatus("hold")}</span>
              <span className="pstat-lbl">Hold</span>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="quick-stats">
          <div className="quick-stat" style={{"--accent":"#22c55e"} as React.CSSProperties}>
            <div className="qs-icon">🏡</div>
            <div className="qs-num">{countByStatus("available")}</div>
            <div className="qs-lbl">Available</div>
          </div>
          <div className="quick-stat" style={{"--accent":"#3b82f6"} as React.CSSProperties}>
            <div className="qs-icon">💬</div>
            <div className="qs-num">{countByStatus("enquired")}</div>
            <div className="qs-lbl">Enquired</div>
          </div>
          <div className="quick-stat" style={{"--accent":"#a855f7"} as React.CSSProperties}>
            <div className="qs-icon">🤝</div>
            <div className="qs-num">{countByStatus("negotiating")}</div>
            <div className="qs-lbl">Negotiating</div>
          </div>
          <div className="quick-stat" style={{"--accent":"#0ea5e9"} as React.CSSProperties}>
            <div className="qs-icon">🔑</div>
            <div className="qs-num">{countByStatus("rented")}</div>
            <div className="qs-lbl">Rented</div>
          </div>
        </div>

        {/* Search */}
        <div className="search-bar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Filter pills */}
        <div className="filter-scroll">
          {FILTERS.map(f => {
            const count = f.value === "all" ? properties.length : countByStatus(f.value)
            const isActive = activeFilter === f.value
            return (
              <button
                key={f.value}
                className={`filter-pill ${isActive ? "active" : ""}`}
                style={{ "--pill-color": f.color } as React.CSSProperties}
                onClick={() => setActiveFilter(f.value)}
              >
                <span className="filter-pill-icon">{f.icon}</span>
                {f.label}
                {count > 0 && <span className="filter-count">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="home-body">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-icon">🏘️</span>
            My Properties
          </h2>
          <span className="section-count">{filtered.length} listed</span>
        </div>

        {loading && (
          <div className="loading-state">
            {[1,2,3,4].map(i => <div key={i} className="skeleton-card"/>)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-illustration">
              <div className="empty-circle"/>
              <div className="empty-icon">🏡</div>
            </div>
            <p className="empty-title">
              {activeFilter === "all"
                ? "No properties yet"
                : `No ${FILTERS.find(f => f.value === activeFilter)?.label} properties`}
            </p>
            <p className="empty-sub">
              {activeFilter === "all"
                ? "Add your first property to get started"
                : "Try a different filter"}
            </p>
            {activeFilter === "all" && (
              <button className="empty-btn" onClick={() => navigate("/add-property")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add First Property
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