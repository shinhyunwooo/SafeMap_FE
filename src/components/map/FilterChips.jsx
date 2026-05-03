import { useState } from 'react'

const FILTERS = [
  { id: 'all',       label: '전체' },
  { id: 'cctv',      label: 'CCTV' },
  { id: 'emergency', label: '긴급 기관' },
  { id: 'police',    label: '경찰서' },
  { id: 'danger',    label: '위험 범역' },
]

export default function FilterChips({ onFilterChange }) {
  const [active, setActive] = useState(['all'])

  const toggle = (id) => {
    if (id === 'all') {
      setActive(['all'])
      onFilterChange?.(['all'])
      return
    }

    const withoutAll = active.filter((v) => v !== 'all')
    const next = withoutAll.includes(id)
      ? withoutAll.filter((v) => v !== id)
      : [...withoutAll, id]

    const final = next.length === 0 ? ['all'] : next
    setActive(final)
    onFilterChange?.(final)
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => toggle(f.id)}
          style={
            active.includes(f.id)
              ? { backgroundColor: '#3B82F6', color: 'white', borderColor: '#3B82F6' }
              : { backgroundColor: 'white', color: '#4B5563', borderColor: '#D1D5DB' }
          }
          className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200"
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}