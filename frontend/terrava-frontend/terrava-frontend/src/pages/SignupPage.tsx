import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import { useLang } from "../context/LanguageContext"
import appLogo from "../assets/logo.png"
import "./AuthPage.css"

export default function SignupPage() {
  const { login } = useAuth()
  const { lang }  = useLang()
  const navigate  = useNavigate()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone]       = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  const handleSignup = async () => {
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setError(lang === "ta" ? "அனைத்து புலங்களையும் நிரப்புங்கள்" : "Please fill all required fields.")
      return
    }
    if (password !== confirm) {
      setError(lang === "ta" ? "கடவுச்சொற்கள் பொருந்தவில்லை" : "Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError(lang === "ta" ? "கடவுச்சொல் குறைந்தது 6 எழுத்துகள் வேண்டும்" : "Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        username: username.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        phone:    phone.trim(),
      })
      login(res.data)
      navigate("/properties")
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError(lang === "ta" ? "பதிவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "Registration failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <div className="auth-logo-icon">
            <img src={appLogo} alt="Terrava" className="auth-logo-image" />
          </div>
          <div className="auth-logo-copy">
            <span className="auth-logo-text">Terrava</span>
            <span className="auth-company">A JeeSha Group company</span>
          </div>
        </div>

        {/* <h1 className="auth-title">
          {lang === "ta" ? "கணக்கு உருவாக்கு" : "Create Account"}
        </h1> */}
        <p className="auth-sub">
          {lang === "ta" ? "புதிய முகவர் கணக்கு" : "Register as a new agent"}
        </p>

        {error && (
          <div className="auth-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="auth-field">
          <label className="auth-label">
            {lang === "ta" ? "முழு பெயர் *" : "Full Name *"}
          </label>
          <div className="auth-input-wrap">
            <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <input
              className="auth-input"
              type="text"
              placeholder={lang === "ta" ? "உங்கள் பெயர்" : "Your full name"}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">
            {lang === "ta" ? "தொலைபேசி" : "Phone"}{" "}
            <span className="auth-optional">({lang === "ta" ? "விருப்பமானது" : "optional"})</span>
          </label>
          <div className="auth-input-wrap">
            <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <input
              className="auth-input"
              type="tel"
              placeholder={lang === "ta" ? "தொலைபேசி எண்" : "Phone number"}
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">
            {lang === "ta" ? "பயனர்பெயர் *" : "Username *"}
          </label>
          <div className="auth-input-wrap">
            <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            <input
              className="auth-input"
              type="text"
              placeholder={lang === "ta" ? "உங்கள் பயனர்பெயர்" : "Choose a username"}
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">
            {lang === "ta" ? "கடவுச்சொல் *" : "Password *"}
          </label>
          <div className="auth-input-wrap">
            <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input
              className="auth-input"
              type={showPass ? "text" : "password"}
              placeholder={lang === "ta" ? "கடவுச்சொல் உள்ளிடுக" : "Min 6 characters"}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="show-pass-btn" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">
            {lang === "ta" ? "கடவுச்சொல் உறுதிப்படுத்து *" : "Confirm Password *"}
          </label>
          <div className="auth-input-wrap">
            <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input
              className="auth-input"
              type={showPass ? "text" : "password"}
              placeholder={lang === "ta" ? "மீண்டும் உள்ளிடுக" : "Re-enter password"}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSignup()}
            />
            {confirm.length > 0 && (
              <span className="pass-match-icon">
                {confirm === password ? "✅" : "❌"}
              </span>
            )}
          </div>
        </div>

        <button
          className={`auth-btn ${loading ? "loading" : ""}`}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading
            ? <><span className="auth-spinner" />{lang === "ta" ? "பதிவு செய்கிறது..." : "Creating account..."}</>
            : lang === "ta" ? "பதிவு செய்க" : "Create Account"
          }
        </button>

        <p className="auth-switch">
          {lang === "ta" ? "ஏற்கனவே கணக்கு உள்ளதா?" : "Already have an account?"}{" "}
          <Link to="/login" className="auth-link">
            {lang === "ta" ? "உள்நுழைக" : "Sign In"}
          </Link>
        </p>

      </div>
    </div>
  )
}
