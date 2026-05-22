export const COLORS = {
  safe:         '#22C55E',
  safe_light:   '#F0FDF4',
  caution:      '#FACC15',
  caution_light:'#FFFDE7',
  warning:      '#FB923C',
  warn_light:   '#FFECDC',
  danger:       '#EF4444',
  danger_light: '#FFEBEB',
  primary:      '#3B82F6',
  primary_light:'#EFF6FF',
  white:        '#FFFFFF',
}

export const BADGE_STYLES = {
  safe:    { bg: '#F0FDF4', border: '#22C55E', text: '#16A34A', label: '안전' },
  caution: { bg: '#FFFDE7', border: '#FACC15', text: '#CA8A04', label: '주의' },
  warning: { bg: '#FFECDC', border: '#FB923C', text: '#EA580C', label: '경고' },
  danger:  { bg: '#FFEBEB', border: '#EF4444', text: '#DC2626', label: '위험' },
}

// 위험도 점수(0~1) → 색상 반환
export function getRouteColor(scores) {
  if (!scores) return '#3B82F6'
  const avg = (
    (scores.security_cctv      || 0) +
    (scores.infrastructure_led || 0) +
    (scores.realtime_sdot_light|| 0)
  ) / 3
  if (avg <= 0.3) return COLORS.safe
  if (avg <= 0.5) return COLORS.caution
  if (avg <= 0.7) return COLORS.warning
  return COLORS.danger
}