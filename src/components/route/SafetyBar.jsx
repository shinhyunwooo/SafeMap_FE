import { BAR_COLORS } from '../../styles/colors'

export default function SafetyBar({ safe = 55, caution = 24, warning = 9, danger = 12 }) {
  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-2 w-full">
        <div style={{ width: `${safe}%`,    backgroundColor: BAR_COLORS.safe }} />
        <div style={{ width: `${caution}%`, backgroundColor: BAR_COLORS.caution }} />
        <div style={{ width: `${warning}%`, backgroundColor: BAR_COLORS.warning }} />
        <div style={{ width: `${danger}%`,  backgroundColor: BAR_COLORS.danger }} />
      </div>
      <div className="flex gap-3 mt-1.5">
        {[
          { label: '안전',  pct: safe,    color: BAR_COLORS.safe },
          { label: '주의',  pct: caution, color: BAR_COLORS.caution },
          { label: '경고',  pct: warning, color: BAR_COLORS.warning },
          { label: '위험',  pct: danger,  color: BAR_COLORS.danger },
        ].map((item) => (
          <span key={item.label} className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label} {item.pct}%
          </span>
        ))}
      </div>
    </div>
  )
}