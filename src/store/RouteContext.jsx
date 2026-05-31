import { createContext, useContext, useState } from 'react'

const RouteContext = createContext(null)

export function RouteProvider({ children }) {
  const [destination, setDestination] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [routeSegments, setRouteSegments] = useState([])
  const [isNavigating, setIsNavigating] = useState(false)

  const startNavigation = (route) => {
    setSelectedRoute(route)
    setIsNavigating(true)
  }

  const stopNavigation = () => {
    setIsNavigating(false)
    setSelectedRoute(null)
    setDestination(null)
    setRouteSegments([])
  }

  return (
    <RouteContext.Provider
      value={{
        destination,
        setDestination,
        selectedRoute,
        setSelectedRoute,
        routeSegments,
        setRouteSegments,
        isNavigating,
        startNavigation,
        stopNavigation,
      }}
    >
      {children}
    </RouteContext.Provider>
  )
}

// 커스텀 훅
export function useRoute() {
  const ctx = useContext(RouteContext)
  if (!ctx) throw new Error('RouteProvider 안에서 사용해야 합니다')
  return ctx
}