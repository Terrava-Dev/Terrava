// src/pages/MarketingPropertyPage.tsx
// Route: /marketing/:propertyId
// Loads the specific property then passes it to MarketingPage

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import MarketingPage from "./MarketingPage"

const BASE_URL = import.meta.env.VITE_API_URL

export default function MarketingPropertyPage() {
  const { propertyId } = useParams()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!propertyId) return
    axios.get(`${BASE_URL}/properties/${propertyId}`)
      .then(r => setProperty(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [propertyId])

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh" }}>
      <div style={{ width: 28, height: 28, border: "2px solid #e0e0e0", borderTop: "2px solid #1a2e44", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  )

  return <MarketingPage preselectedProperty={property} />
}