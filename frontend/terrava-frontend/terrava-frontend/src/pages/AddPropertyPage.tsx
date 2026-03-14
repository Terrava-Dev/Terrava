import { useState } from "react"
import axios from "axios"
import PropertyMap from "../components/PropertyMap"
import { LatLng } from "leaflet"
// import AddProperty from "../Pages/AddProperty.css"
export default function AddPropertyPage() {

  const [title, setTitle] = useState("")
  const [locationName, setLocationName] = useState("")
  const [area, setArea] = useState(0)
  const [pricePerAcre, setPricePerAcre] = useState(0)
  const [points, setPoints] = useState<LatLng[]>([])
const submitProperty = async () => {

  const response = await axios.post(
    "https://localhost:7155/api/properties",
    {
      title,
      locationName,
      totalAreaInAcres: area,
      pricePerAcre
    }
  )

  const propertyId = response.data.id

  await axios.post(
    "https://localhost:7155/api/property-boundaries",
    points.map((p, index) => ({
      propertyId: propertyId,
      latitude: p.lat,
      longitude: p.lng,
      orderIndex: index
    }))
  )
}

return (
  <div>

    <h2>Add Property</h2>

    <input
      placeholder="Title"
      onChange={(e) => setTitle(e.target.value)}
    />

    <input
      placeholder="Location"
      onChange={(e) => setLocationName(e.target.value)}
    />

 <input
className="input"
value={area.toFixed(2)}
readOnly
/>

    <input
      type="number"
      placeholder="Price Per Acre"
      onChange={(e) => setPricePerAcre(Number(e.target.value))}
    />

    <h3>Mark Property Boundary</h3>

   <div className="map-container">
<PropertyMap
  setPoints={setPoints}
  setArea={setArea}
/>
</div>

    <button onClick={submitProperty}>
      Save Property
    </button>

  </div>
)
}