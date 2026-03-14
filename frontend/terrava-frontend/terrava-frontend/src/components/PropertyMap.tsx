import { MapContainer, TileLayer, useMapEvents, Polygon, Marker } from "react-leaflet"
import { useState, useEffect } from "react"
import { LatLng } from "leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import * as turf from "@turf/turf"


type PropertyMapProps = {
  setPoints: (points: LatLng[]) => void
  setArea: (area:number) => void
}

const DefaultIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

export default function PropertyMap({ setPoints, setArea }: PropertyMapProps) {

  const [points, setLocalPoints] = useState<LatLng[]>([])
  const [center, setCenter] = useState<[number, number]>([20, 78])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCenter([
          position.coords.latitude,
          position.coords.longitude
        ])
      })
    }
  }, [])

  function calculateArea(points: LatLng[]) {

  if (points.length < 3) return

  const coords = points.map(p => [p.lng, p.lat])

  coords.push([points[0].lng, points[0].lat])

  const polygon = turf.polygon([coords])

  const areaMeters = turf.area(polygon)

  const acres = areaMeters * 0.000247105

  setArea(acres)

}

  function MapClickHandler() {
    useMapEvents({
click(e) {

  const newPoints = [...points, e.latlng]

  setLocalPoints(newPoints)

  setPoints(newPoints)

  calculateArea(newPoints)

}
    })

    return null
  }

  function resetBoundary() {
    setLocalPoints([])
    setPoints([])
  }

  return (

    <div style={{ width: "100%" }}>

<MapContainer
  center={center}
  zoom={17}
  style={{ height: "450px", width: "100%" }}
>

  {/* Satellite */}
  <TileLayer
    attribution="Tiles © Esri"
    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  />

  {/* Labels */}
  <TileLayer
    attribution="Labels © Esri"
    url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
  />

  <MapClickHandler />

  {points.map((point, index) => (
    <Marker key={index} position={point} />
  ))}

  {points.length > 2 && (
    <Polygon positions={points} />
  )}

</MapContainer>

      <button onClick={resetBoundary}>
        Reset Boundary
      </button>

    </div>
  )
}