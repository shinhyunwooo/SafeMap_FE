import SafetyBar from './SafetyBar'
import { BADGE_STYLES } from '../../styles/colors'

export default function RouteCard({
  title,
  isRecommended = false,
  badge = 'safe',
  minutes,
  km,
  safe = 55,
  caution = 24,
  warning = 9,
  danger = 12,
  isSelected = false,
  onClick,
}) {
  const badgeStyle = BADGE_STYLES[badge]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 border-2 transition-all
        ${isSelected ? 'border-[#3B82F6] bg-[#EFF6FF]' : 'border-transparent bg-gray-50'}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {isRecommended && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#3B82F6] text-white font-medium">
              추천
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-base font-bold text-gray-800">{minutes} 분</span>
          <p className="text-xs text-gray-400">{km} km</p>
        </div>
      </div>

      {/* 뱃지 - 피그마 스타일 그대로 */}
      <div
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-3"
        style={{
          backgroundColor: badgeStyle.bg,
          border: `1px solid ${badgeStyle.border}`,
          color: badgeStyle.text,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: badgeStyle.text }}
        />
        {badgeStyle.label}
      </div>

      <SafetyBar safe={safe} caution={caution} warning={warning} danger={danger} />
    </button>
  )
}