import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import SafeMap from '../components/map/SafeMap'
import FilterChips from '../components/map/FilterChips'

export default function MainPage() {
  const navigate = useNavigate()

  const handleFilterChange = (activeFilters) => {
    console.log('활성 필터:', activeFilters)
  }

  return (
    <div className="relative w-full h-full">

      {/* 지도 (전체 배경) */}
      <div className="absolute inset-0">
        <SafeMap />
      </div>

      {/* 상단 UI 레이어 */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4 flex flex-col gap-2">

        {/* 검색바 */}
        <button
          onClick={() => navigate('/search')}
          className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-lg"
        >
          <Search size={18} className="text-gray-400" />
          <span className="text-gray-400 text-sm">어디로 갈까요?</span>
        </button>

        {/* 필터 칩 */}
        <FilterChips onFilterChange={handleFilterChange} />
      </div>

      {/* 현재 위치 버튼 */}
      <button
        className="absolute bottom-8 right-4 z-[1000]
          w-11 h-11 bg-white rounded-full shadow-lg
          flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
          fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
        </svg>
      </button>

    </div>
  )
}