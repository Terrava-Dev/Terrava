import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import { useLang } from "../context/LanguageContext"
import "./AuthPage.css"

export default function LoginPage() {
  const { login }  = useAuth()
  const { lang }   = useLang()
  const navigate   = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError(lang === "ta" ? "பயனர்பெயர் மற்றும் கடவுச்சொல் தேவை" : "Username and password are required.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await axios.post("${import.meta.env.VITE_API_URL}/auth/login", {
        username: username.trim().toLowerCase(),
        password,
      })
      login(res.data)
      navigate("/")
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError(lang === "ta" ? "தவறான பயனர்பெயர் அல்லது கடவுச்சொல்" : "Invalid username or password.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">T</div>
          <span className="auth-logo-text">Terrava</span>
        </div>

        <h1 className="auth-title">
          {lang === "ta" ? "உள்நுழைக" : "Agent Login"}
        </h1>
        <p className="auth-sub">
          {lang === "ta"
            ? "உங்கள் கணக்கில் உள்நுழைக"
            : "Sign in to your agent account"}
        </p>

        {error && (
          <div className="auth-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="auth-field">
          <label className="auth-label">
            {lang === "ta" ? "பயனர்பெயர்" : "Username"}
          </label>
          <div className="auth-input-wrap">
            <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <input
              className="auth-input"
              type="text"
              placeholder={lang === "ta" ? "உங்கள் பயனர்பெயர்" : "Enter your username"}
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="username"
              autoFocus
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">
            {lang === "ta" ? "கடவுச்சொல்" : "Password"}
          </label>
          <div className="auth-input-wrap">
            <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input
              className="auth-input"
              type={showPass ? "text" : "password"}
              placeholder={lang === "ta" ? "கடவுச்சொல் உள்ளிடுக" : "Enter your password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
            />
            <button className="show-pass-btn" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button
          className={`auth-btn ${loading ? "loading" : ""}`}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading
            ? <><span className="auth-spinner" />{lang === "ta" ? "உள்நுழைகிறது..." : "Signing in..."}</>
            : lang === "ta" ? "உள்நுழைக" : "Sign In"
          }
        </button>

        <p className="auth-switch">
          {lang === "ta" ? "கணக்கு இல்லையா?" : "Don't have an account?"}{" "}
          <Link to="/signup" className="auth-link">
            {lang === "ta" ? "பதிவு செய்க" : "Sign Up"}
          </Link>
        </p>

      </div>
    </div>
  )
}