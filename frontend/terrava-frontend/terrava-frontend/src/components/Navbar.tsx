import { useState } from "react"
import { useNavigate } from "react-router-dom"
import appLogo from "../assets/logo.png"
import "./Navbar.css"

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/properties")}>
          <span className="logo-icon">
            <img src={appLogo} alt="Terrava" className="logo-image" />
          </span>
          <span className="logo-copy">
            <span className="logo-text">Terrava</span>
            <span className="logo-sub">JeeSha Group</span>
          </span>
        </div>

        {/* Desktop links */}
        <div className="navbar-links">
          <a href="/properties" className="nav-link">Properties</a>
        </div>

        {/* Desktop CTA */}
        <button
          className="navbar-cta"
          onClick={() => navigate("/add-property")}
        >
          + Add Property
        </button>

        {/* Mobile hamburger */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
          <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
          <span className={`ham-line ${menuOpen ? "open" : ""}`}></span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <a href="/properties" className="mobile-link" onClick={() => setMenuOpen(false)}>
            Properties
          </a>
          <button
            className="navbar-cta mobile-cta"
            onClick={() => { navigate("/add-property"); setMenuOpen(false) }}
          >
            + Add Property
          </button>
        </div>
      )}
    </nav>
  )
}
