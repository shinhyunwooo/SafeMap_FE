import { createContext, useContext, useState, useEffect } from 'react'
import { MAP_CONFIG } from '../constants/mapConfig'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const [location, setLocation] = useState({
    lat: MAP_CONFIG.center[0],
    lng: MAP_CONFIG.center[1],
    loaded: false,
  })

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          loaded: true,
        })
      },
      () => {
        // 권한 거부 시 광운대 기본 좌표 유지
        setLocation((prev) => ({ ...prev, loaded: true }))
      },
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

// 커스텀 훅
export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('LocationProvider 안에서 사용해야 합니다')
  return ctx
}