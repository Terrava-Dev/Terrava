import { useEffect, useState } from "react"
import { getProperties } from "../services/propertyService"
import type { Property } from "../models/Property"
import PropertyCard from "../components/PropertyCard"
import "./PropertyListPage.css"

export default function PropertyListPage() {

  const [properties, setProperties] = useState<Property[]>([])

  useEffect(() => {
    const loadProperties = async () => {
      const data = await getProperties()
      setProperties(data)
    }

    loadProperties()
  }, [])

  return (
<div className="property-grid">
  {properties.map((property) => (
    <PropertyCard key={property.id} property={property} />
  ))}
</div>
  )
}