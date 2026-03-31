import { useEffect, useState } from "react"
import "./PWAInstallButton.css"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type Props = {
  className?: string
  compact?: boolean
  label?: string
}

function isStandaloneDisplay() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
}

export default function PWAInstallButton({ className = "", compact = false, label = "Download App" }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandaloneDisplay())
  const [showIosHint, setShowIosHint] = useState(() => {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    const isSafari = /safari/i.test(window.navigator.userAgent) && !/crios|fxios|edgios/i.test(window.navigator.userAgent)
    return isIos && isSafari && !isStandaloneDisplay()
  })

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setShowIosHint(false)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null)
      }
      return
    }

    if (showIosHint) {
      window.alert('To install Terrava on iPhone, tap Share and choose "Add to Home Screen".')
    }
  }

  if (installed) {
    return null
  }

  const canInstall = Boolean(deferredPrompt) || showIosHint

  if (!canInstall) {
    return null
  }

  return (
    <button
      type="button"
      className={`pwa-install-btn${compact ? " compact" : ""}${className ? ` ${className}` : ""}`}
      onClick={handleInstall}
    >
      <span className="pwa-install-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <rect x="4" y="17" width="16" height="4" rx="2" />
        </svg>
      </span>
      <span>{label}</span>
    </button>
  )
}
