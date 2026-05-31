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

// 위험도 점수 → 색상 (6개 지표 종합 평균)
export function getRouteColor(scores) {
  if (!scores) return '#3B82F6'

  const {
    security_cctv      = 0,
    infrastructure_led = 0,
    realtime_sdot_light= 0,
    slope              = 0,
    civil_complaint    = 0,
    floating_population= 0,
  } = scores

  // sdot_light가 1이면 센서 없음(기본값)이므로 제외
  const validScores = [
    security_cctv,
    infrastructure_led,
    slope,
    civil_complaint,
    floating_population,
  ].filter(v => v !== null && v !== undefined)

  // sdot_light가 1.0(기본값)이 아닐 때만 포함
  if (realtime_sdot_light < 1.0) validScores.push(realtime_sdot_light)

  const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length

  console.log('위험도 평균:', avg, '점수들:', scores) // 디버깅용

  if (avg <= 0.3) return COLORS.safe      // 초록 - 안전
  if (avg <= 0.5) return COLORS.caution   // 노랑 - 주의
  if (avg <= 0.7) return COLORS.warning   // 주황 - 경고
  return COLORS.danger                      // 빨강 - 위험
}

// 위험도 평균 → 뱃지 타입
export function getRouteBadgeType(scores) {
  if (!scores) return 'safe'
  const color = getRouteColor(scores)
  if (color === COLORS.safe)    return 'safe'
  if (color === COLORS.caution) return 'caution'
  if (color === COLORS.warning) return 'warning'
  return 'danger'
}