import { useState } from "react"

interface Lead {
  id: string
  clientName?: string
  title?: string
  price?: string
  propertyType?: string
}

interface FollowUpPromptProps {
  lead: Lead
  onSave: (lead: Lead, days: number | null, customDate?: Date) => void
  onDismiss: () => void
}

const QUICK_OPTIONS = [
  { label: "Tomorrow 9 AM", days: 1 },
  { label: "In 2 days",     days: 2 },
  { label: "This weekend",  days: 5 },
]

export function FollowUpPrompt({ lead, onSave, onDismiss }: FollowUpPromptProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customDate, setCustomDate] = useState("")
  const [customTime, setCustomTime] = useState("09:00")

  function handleCustomSave() {
    if (!customDate) return
    const dt = new Date(`${customDate}T${customTime}`)
    onSave(lead, null, dt)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 999,
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderRadius: "16px 16px 0 0",
          padding: "20px 20px 36px",
          zIndex: 1000,
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: 36,
            height: 4,
            background: "#e0e0e0",
            borderRadius: 2,
            margin: "0 auto 20px",
          }}
        />

        {/* Header */}
        <p style={{ fontWeight: 600, fontSize: 16, margin: "0 0 4px", color: "#111" }}>
          Set a follow-up reminder?
        </p>
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>
          {lead.clientName ? `For ${lead.clientName}` : "For this client"}
          {lead.title ? ` · ${lead.title}` : ""}
        </p>

        {/* Quick options */}
        {!showCustom && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => onSave(lead, opt.days)}
                  style={{
                    padding: "13px 16px",
                    borderRadius: 10,
                    border: "1.5px solid #e8e8e8",
                    background: "#fafafa",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#111",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}

              <button
                onClick={() => setShowCustom(true)}
                style={{
                  padding: "13px 16px",
                  borderRadius: 10,
                  border: "1.5px solid #e8e8e8",
                  background: "#fafafa",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#111",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Custom date &amp; time...
              </button>
            </div>

            <button
              onClick={onDismiss}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px",
                border: "none",
                background: "none",
                fontSize: 14,
                color: "#aaa",
                cursor: "pointer",
              }}
            >
              No reminder
            </button>
          </>
        )}

        {/* Custom date picker */}
        {showCustom && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                style={{
                  flex: 1,
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "1.5px solid #e8e8e8",
                  fontSize: 15,
                  color: "#111",
                }}
              />
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                style={{
                  width: 110,
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "1.5px solid #e8e8e8",
                  fontSize: 15,
                  color: "#111",
                }}
              />
            </div>

            <button
              onClick={handleCustomSave}
              disabled={!customDate}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 10,
                border: "none",
                background: customDate ? "#111" : "#ddd",
                color: customDate ? "#fff" : "#aaa",
                fontSize: 15,
                fontWeight: 600,
                cursor: customDate ? "pointer" : "not-allowed",
                marginBottom: 10,
              }}
            >
              Set reminder
            </button>

            <button
              onClick={() => setShowCustom(false)}
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                background: "none",
                fontSize: 14,
                color: "#aaa",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </>
        )}
      </div>
    </>
  )
}