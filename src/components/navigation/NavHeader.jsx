import { MapPin, CornerUpRight, ArrowUp } from 'lucide-react'

const DIRECTION_ICONS = {
  destination: <MapPin size={22} className="text-white" />,
  straight:    <ArrowUp size={22} className="text-white" />,
  right:       <CornerUpRight size={22} className="text-white" />,
}

export default function NavHeader({ type = 'destination', label, distance }) {
  return (
    <div
      className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-5 py-4"
      style={{ backgroundColor: '#3B82F6' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
          {DIRECTION_ICONS[type] ?? DIRECTION_ICONS.straight}
        </div>
        <div>
          {type === 'destination' ? (
            <p className="text-xs text-white/70">목적지</p>
          ) : (
            <p className="text-xs text-white/70">00 미터</p>
          )}
          <p className="text-base font-bold text-white">{label}</p>
        </div>
      </div>
      {distance && (
        <div
          className="px-3 py-1.5 rounded-full text-white text-sm font-semibold"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          {distance}
        </div>
      )}
    </div>
  )
}