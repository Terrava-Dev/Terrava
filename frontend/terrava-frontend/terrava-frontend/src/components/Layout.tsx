import { NavLink, useNavigate } from "react-router-dom"
import { useLang } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import "./Layout.css"

type Props = { children: React.ReactNode }

export default function Layout({ children }: Props) {
  const { t, lang, setLang } = useLang()
  const { agent, logout }    = useAuth()
  const navigate             = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        {children}
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => "bn-item" + (isActive ? " active" : "")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>{t("nav_home")}</span>
        </NavLink>

        <NavLink to="/map" className={({ isActive }) => "bn-item" + (isActive ? " active" : "")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
            <line x1="9" y1="3" x2="9" y2="18"/>
            <line x1="15" y1="6" x2="15" y2="21"/>
          </svg>
          <span>{t("nav_map")}</span>
        </NavLink>

        <NavLink to="/add-property" className="bn-fab" aria-label={t("add_property")}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </NavLink>

        <NavLink to="/track" className={({ isActive }) => "bn-item" + (isActive ? " active" : "")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="12" x2="2" y2="12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
          <span>{t("nav_track")}</span>
        </NavLink>
<NavLink
  to="/marketing"
  className={({ isActive }) => "bn-item" + (isActive ? " active" : "")}
>
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
  <span>Market</span>
</NavLink>

        {/* Language toggle */}
        <button
          className="bn-item bn-lang"
          onClick={() => setLang(lang === "en" ? "ta" : "en")}
          title={t("language")}
        >
          <span className="lang-flag">{lang === "en" ? "EN" : "த"}</span>
          <span>{lang === "en" ? "தமிழ்" : "English"}</span>
        </button>
      </nav>

    </div>
  )
}