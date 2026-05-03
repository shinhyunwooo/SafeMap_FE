import { MapContainer, TileLayer, useMap, CircleMarker } from 'react-leaflet'
import { useEffect, useState } from 'react'
import { MAP_CONFIG } from '../../constants/mapConfig'

function LocationMarker() {
  const map = useMap()
  const [position, setPosition] = useState(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const latlng = [latitude, longitude]
        setPosition(latlng)
        map.setView(latlng, MAP_CONFIG.zoom)
      },
      () => {
        map.setView(MAP_CONFIG.center, MAP_CONFIG.zoom)
      }
    )
  }, [map])

  if (!position) return null

  return (
    <CircleMarker
      center={position}
      radius={8}
      pathOptions={{
        color: 'white',
        fillColor: '#3B82F6',
        fillOpacity: 1,
        weight: 2,
      }}
    />
  )
}

export default function SafeMap({ children }) {
  return (
    <MapContainer
      center={MAP_CONFIG.center}
      zoom={MAP_CONFIG.zoom}
      minZoom={MAP_CONFIG.minZoom}
      maxZoom={MAP_CONFIG.maxZoom}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker />
      {children}
    </MapContainer>
  )
}