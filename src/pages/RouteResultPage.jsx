import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import SafeMap from '../components/map/SafeMap'
import RouteLayer from '../components/map/RouteLayer'
import FilterChips from '../components/map/FilterChips'
import RouteCard from '../components/route/RouteCard'

const ROUTES = [
  {
    id: 1,
    title: '가장 안전한 경로',
    isRecommended: true,
    badge: 'safe',
    minutes: 15,
    km: 1.2,
    safe: 55, caution: 24, warning: 9, danger: 12,
  },
  {
    id: 2,
    title: '빠른 경로',
    isRecommended: false,
    badge: 'danger',
    minutes: 11,
    km: 0.9,
    safe: 30, caution: 20, warning: 20, danger: 30,
  },
  {
    id: 3,
    title: '다른 경로',
    isRecommended: false,
    badge: 'caution',
    minutes: 19,
    km: 1.6,
    safe: 40, caution: 35, warning: 15, danger: 10,
  },
]

export default function RouteResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const destination = location.state?.destination

  const [selectedRoute, setSelectedRoute] = useState(1)
  const [showAll, setShowAll] = useState(false)

  const visibleRoutes = showAll ? ROUTES : ROUTES.slice(0, 1)

  return (
    <div className="relative w-full h-full">

      {/* 지도 배경 */}
      <div className="absolute inset-0">
        <SafeMap>
          <RouteLayer />
        </SafeMap>
      </div>

      {/* 상단 UI */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4 flex flex-col gap-2">
        <div className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-lg">
          <Search size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700 font-medium">
            {destination?.name ?? '목적지'}
          </span>
          <div className="ml-auto w-8 h-8 bg-[#3B82F6] rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
        </div>
        <FilterChips />
      </div>

      {/* 하단 시트 */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl shadow-2xl px-4 pt-4 pb-6">

        {/* 핸들 */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-base font-bold text-gray-800">경로를 탐색하였습니다</span>
          <span
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: '#F7F7F7',
              border: '1.17px solid #F7F7F7',
              color: '#5D5D5D',
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
            경로 탐색 완료
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {destination?.name ?? '목적지'}까지 • {ROUTES[0].km} km
        </p>

        {/* 경로 카드 목록 */}
        <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto">
          {visibleRoutes.map((route) => (
            <RouteCard
              key={route.id}
              {...route}
              isSelected={selectedRoute === route.id}
              onClick={() => setSelectedRoute(route.id)}
            />
          ))}
        </div>

        {/* 다른 경로 보기 */}
        {!showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-sm text-gray-500 flex items-center justify-center gap-1 mt-3 mb-2"
          >
            다른 경로 보기
            <span className="text-gray-400">→</span>
          </button>
        )}

        {/* 안내 시작 버튼 */}
        <button
          onClick={() => navigate('/navigation', {
            state: { route: ROUTES.find((r) => r.id === selectedRoute), destination }
          })}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm mt-2"
          style={{ backgroundColor: '#3B82F6' }}
        >
          안전 경로로 안내 시작
        </button>

      </div>
    </div>
  )
}