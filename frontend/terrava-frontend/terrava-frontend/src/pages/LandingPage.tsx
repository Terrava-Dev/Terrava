// src/pages/LandingPage.tsx
// Route: / (before login)
// Add this to your router: <Route path="/" element={<LandingPage />} />

import { useNavigate } from "react-router-dom"
import appLogo from "../assets/logo.png"
import "./LandingPage.css"

const FEATURES = [
  { icon: "🏘️", color: "#FFF8E6", title: "Property Management",   desc: "Add, edit and track all listings with photos, map boundaries, amenities and live status." },
  { icon: "✦",  color: "#F0FDF4", title: "Share Property Posts",    desc: "Generate WhatsApp, Instagram & Facebook posts in English, Tamil, Kannada or Telugu in seconds." },
  { icon: "📜", color: "#EFF6FF", title: "DTCP & RERA Badges",    desc: "Mark properties as DTCP Approved or RERA Registered and display badges on every listing." },
  { icon: "🗺️", color: "#FDF4FF", title: "Land Boundary Map",     desc: "Draw boundaries on a live map, capture a snapshot and attach it directly to listing photos." },
  { icon: "📊", color: "#FFF1F2", title: "Pipeline Tracking",     desc: "Move listings through Available → Enquired → Negotiating → Sold with one-tap status updates." },
  { icon: "💰", color: "#F0FDF4", title: "Price Calculator",      desc: "Instantly convert sq ft to cent, acre and total price. See all conversions live as you type." },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="lp-page">

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />

        <div className="lp-hero-left">
          <div className="lp-logo-mark">
            <img src={appLogo} alt="Terrava" className="lp-logo-image" />
          </div>
          <p className="lp-brand">Terrava</p>
          <p className="lp-company">A JeeSha Group company</p>

          <h1 className="lp-h1">
            Manage Properties<br/>
            <span className="lp-highlight">Smarter</span>,{" "}
            Sell <span className="lp-green">Faster</span>
          </h1>

          <p className="lp-sub">
            The all-in-one property management app for Indian real estate agents.
            Track listings, generate AI share-ready posts, and close deals — all in one place.
          </p>

          <div className="lp-cta">
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Get Started
            </button>
            <a href="#features" className="lp-btn-secondary">See Features ↓</a>
          </div>

          <div className="lp-trust-row">
            <div className="lp-trust-item"><div className="lp-trust-dot" />DTCP Ready</div>
            <div className="lp-trust-item"><div className="lp-trust-dot" />RERA Support</div>
            <div className="lp-trust-item"><div className="lp-trust-dot" />Share Property</div>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="lp-phone">
          <div className="lp-phone-frame">
            <div className="lp-screen">
              <div className="lp-screen-header">
                <div className="lp-screen-greeting">Good morning,</div>
                <div className="lp-screen-name">Thomas <span>👋</span></div>
              </div>
              <div className="lp-screen-stats">
                {[["12","Listed"],["3","Sold"],["5","Enquired"],["2","Hold"]].map(([n,l]) => (
                  <div key={l} className="lp-sstat">
                    <div className="lp-sstat-num">{n}</div>
                    <div className="lp-sstat-lbl">{l}</div>
                  </div>
                ))}
              </div>
              <div className="lp-screen-cards">
                <div className="lp-scard">
                  <div className="lp-scard-img" style={{background:"linear-gradient(135deg,#fde68a,#fbbf24)"}}>🌿</div>
                  <div className="lp-scard-info">
                    <div className="lp-scard-title">Thomas Garden</div>
                    <div className="lp-scard-loc">📍 Arumuganeri</div>
                    <div className="lp-scard-badges">
                      <span className="lp-sbadge lp-dtcp">DTCP</span>
                      <span className="lp-sbadge lp-avail">Available</span>
                    </div>
                  </div>
                </div>
                <div className="lp-scard">
                  <div className="lp-scard-img" style={{background:"linear-gradient(135deg,#bbf7d0,#4ade80)"}}>🏗️</div>
                  <div className="lp-scard-info">
                    <div className="lp-scard-title">Marutham Apts</div>
                    <div className="lp-scard-loc">📍 Chennai</div>
                    <div className="lp-scard-badges">
                      <span className="lp-sbadge lp-rera">RERA</span>
                      <span className="lp-sbadge lp-nego">Negotiating</span>
                    </div>
                  </div>
                </div>
                <div className="lp-scard">
                  <div className="lp-scard-img" style={{background:"linear-gradient(135deg,#bfdbfe,#60a5fa)"}}>🏠</div>
                  <div className="lp-scard-info">
                    <div className="lp-scard-title">Green Valley</div>
                    <div className="lp-scard-loc">📍 Coimbatore</div>
                    <div className="lp-scard-badges">
                      <span className="lp-sbadge lp-enq">Enquired</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features">
        <p className="lp-eyebrow">✦ Everything you need</p>
        <h2 className="lp-section-title">Built for Indian Real Estate</h2>
        <div className="lp-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon" style={{background: f.color}}>{f.icon}</div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEGAL ── */}
      <section className="lp-legal">
        <p className="lp-eyebrow">✦ Legal Compliance</p>
        <h2 className="lp-section-title">DTCP & RERA Ready</h2>
        <div className="lp-legal-badges">
          <div className="lp-legal-badge">
            <div className="lp-legal-icon" style={{background:"#EFF6FF"}}>🏛️</div>
            <div>
              <div className="lp-legal-name">DTCP Approved</div>
              <div className="lp-legal-sub">Directorate of Town &amp; Country Planning</div>
            </div>
          </div>
          <div className="lp-legal-badge">
            <div className="lp-legal-icon" style={{background:"#F0FDF4"}}>🏗️</div>
            <div>
              <div className="lp-legal-name">RERA Registered</div>
              <div className="lp-legal-sub">Real Estate Regulatory Authority</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="lp-footer-cta">
        <h2>Start managing smarter today</h2>
        <p>Join agents across Tamil Nadu using Terrava by JeeSha Group</p>
        <div className="lp-footer-btns">
          <button className="lp-btn-gold" onClick={() => navigate("/login")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Get Started Free
          </button>
          <a href="#features" className="lp-btn-ghost">See Features</a>
        </div>
      </section>

      <footer className="lp-footer">
        © 2026 Terrava. A JeeSha Group company built for Indian real estate agents.
      </footer>
    </div>
  )
}
