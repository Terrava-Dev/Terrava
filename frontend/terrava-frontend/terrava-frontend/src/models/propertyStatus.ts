// ── Property status definitions ──────────────────────────────────────────────

export type StatusConfig = {
  value: string
  label: string
  color: string       // badge background
  textColor: string   // badge text
  stampColor: string  // diagonal stamp color
  icon: string
}

export const PROPERTY_STATUSES: StatusConfig[] = [
  {
    value:      "available",
    label:      "Available",
    color:      "#f0fdf4",
    textColor:  "#16a34a",
    stampColor: "#16a34a",
    icon:       "✓",
  },
  {
    value:      "sold",
    label:      "Sold",
    color:      "#fef2f2",
    textColor:  "#dc2626",
    stampColor: "#dc2626",
    icon:       "✕",
  },
  {
    value:      "enquired",
    label:      "Enquired",
    color:      "#eff6ff",
    textColor:  "#2563eb",
    stampColor: "#2563eb",
    icon:       "?",
  },
  {
    value:      "hold",
    label:      "On Hold",
    color:      "#fffbeb",
    textColor:  "#d97706",
    stampColor: "#d97706",
    icon:       "⏸",
  },
  {
    value:      "negotiating",
    label:      "Negotiating",
    color:      "#fdf4ff",
    textColor:  "#9333ea",
    stampColor: "#9333ea",
    icon:       "↔",
  },
  {
    value:      "rented",
    label:      "Rented",
    color:      "#f0f9ff",
    textColor:  "#0284c7",
    stampColor: "#0284c7",
    icon:       "R",
  },
]

export function getStatus(value?: string): StatusConfig {
  return PROPERTY_STATUSES.find(s => s.value === value)
    ?? PROPERTY_STATUSES[0]  // default: available
}