import { NavLink } from "react-router-dom"
import { useLang } from "../context/LanguageContext"
import PWAInstallButton from "./PWAInstallButton"
import "./Layout.css"

type Props = { children: React.ReactNode }

export default function Layout({ children }: Props) {
  const { t, lang, setLang } = useLang()

  return (
    <div className="app-shell">
      <div className="app-install-banner">
        <PWAInstallButton compact label="Download" />
      </div>

      <main className="app-main">
        {children}
      </main>

      <nav className="bottom-nav">
        <NavLink to="/properties" end className={({ isActive }) => "bn-item" + (isActive ? " active" : "")}>
          <span className="bn-icon-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span className="bn-label">{t("nav_home")}</span>
        </NavLink>



        <NavLink to="/track" className={({ isActive }) => "bn-item" + (isActive ? " active" : "")}>
          <span className="bn-icon-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="12" x2="2" y2="12"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
          </span>
          <span className="bn-label">{t("nav_track")}</span>
        </NavLink>

                <NavLink to="/add-property" className="bn-fab" aria-label={t("add_property")}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </NavLink>

        <NavLink to="/share-property" className={({ isActive }) => "bn-item" + (isActive ? " active" : "")}>
          <span className="bn-icon-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </span>
          <span className="bn-label">Share Property</span>
        </NavLink>

        <button
          className="bn-item bn-lang"
          onClick={() => setLang(lang === "en" ? "ta" : "en")}
          title={t("language")}
          type="button"
        >
          <span className="bn-icon-wrap" aria-hidden="true">
            <span className="lang-flag">{lang === "en" ? "EN" : "த"}</span>
          </span>
          <span className="bn-label">{lang === "en" ? "தமிழ்" : "English"}</span>
        </button>
      </nav>

    </div>
  )
}
