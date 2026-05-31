import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, X, Clock, MapPin, ChevronRight } from 'lucide-react'
import { useRoute } from '../store/RouteContext'

const CATEGORY_CHIPS = ['식당', '카페', '편의점', '공원', '병원']

const DUMMY_RESULTS = [
  { id: 1, name: '광운대학교', address: '서울 노원구 월계동' },
  { id: 2, name: '광운대학교 후문', address: '서울 노원구 월계동' },
  { id: 3, name: '광운대역', address: '서울 노원구 월계동 11-3' },
  { id: 4, name: '노원구청', address: '서울 노원구 노원로 283' },
]

const HOTPLACES = [
  { id: 101, name: '대학병원', address: '병원의 주소주소' },
  { id: 102, name: '광운대학교', address: '서울 노원구 월계동' },
  { id: 103, name: '대형 마트', address: '마트의 주소주소' },
]

export default function SearchPage() {
  const navigate = useNavigate()
  const { setDestination } = useRoute()

  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem('recentSearches') || '[]')
  )

  const results = query.trim()
    ? DUMMY_RESULTS.filter(
        (r) => r.name.includes(query) || r.address.includes(query)
      )
    : []

  const saveRecent = (item) => {
    const updated = [
      item,
      ...recentSearches.filter((r) => r.id !== item.id),
    ].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleSelect = (item) => {
    saveRecent(item)
    setDestination(item)
    navigate('/route-result', { state: { destination: item } })
  }

  const deleteRecent = (e, id) => {
    e.stopPropagation()
    const updated = recentSearches.filter((r) => r.id !== id)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  return (
    <div className="flex flex-col h-full bg-white">

      {/* 상단 검색바 */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft size={22} className="text-gray-600" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destination..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
            autoFocus
          />
          {query.length > 0 && (
            <button onClick={() => setQuery('')}>
              <X size={15} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 칩 */}
      {query.trim() === '' && (
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip}
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4">

        {/* 검색어 없을 때 */}
        {query.trim() === '' && (
          <>
            {/* 최근 검색 */}
            <p className="text-sm text-gray-400 font-medium mt-2 mb-2">최근 검색</p>
            {recentSearches.length === 0 ? (
              <p className="text-sm text-gray-300 text-center mt-6">
                최근 검색 내역이 없습니다
              </p>
            ) : (
              recentSearches.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 py-3 border-b border-gray-50"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-gray-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.address}</p>
                  </div>
                  <MapPin size={16} className="text-gray-300 shrink-0" />
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              ))
            )}

            {/* 주변 핫플레이스 */}
            <p className="text-sm text-gray-400 font-medium mt-5 mb-2">주변 핫플레이스</p>
            {HOTPLACES.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 py-3 border-b border-gray-50"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-gray-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.address}</p>
                </div>
                <MapPin size={16} className="text-gray-300 shrink-0" />
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </>
        )}

        {/* 검색 결과 있을 때 */}
        {query.trim() !== '' && results.length > 0 && (
          <>
            <p className="text-sm text-gray-400 font-medium mt-2 mb-2">
              {results.length}개의 결과
            </p>
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 py-3 border-b border-gray-50"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <Search size={14} className="text-gray-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.address}</p>
                </div>
                <MapPin size={16} className="text-gray-300 shrink-0" />
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </>
        )}

        {/* 검색 결과 없을 때 */}
        {query.trim() !== '' && results.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-24 gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Search size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">검색 결과가 없습니다.</p>
            <p className="text-xs text-gray-400">장소명을 다시 검색해보세요.</p>
          </div>
        )}

      </div>
    </div>
  )
}