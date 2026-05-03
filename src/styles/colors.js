export const COLORS = {
  // 메인
  primary: '#3B82F6',

  // 안전
  safe:         '#22C55E',
  safe_light:   '#F0FDF4',

  // 주의
  caution:      '#FACC15',
  caution_light:'#FFFDE7',

  // 경고
  warn:         '#FB923C',
  warn_light:   '#FFECDC',

  // 위험
  danger:       '#EF4444',
  danger_light: '#FFEBEB',
}

// 뱃지 스타일 (RouteCard, SafetyBadge 등에서 공통 사용)
export const BADGE_STYLES = {
  safe: {
    border: COLORS.safe,
    bg:     COLORS.safe_light,
    text:   COLORS.safe,
    label:  '안전',
  },
  caution: {
    border: COLORS.caution,
    bg:     COLORS.caution_light,
    text:   COLORS.caution,
    label:  '주의',
  },
  warning: {
    border: COLORS.warn,
    bg:     COLORS.warn_light,
    text:   COLORS.warn,
    label:  '경고',
  },
  danger: {
    border: COLORS.danger,
    bg:     COLORS.danger_light,
    text:   COLORS.danger,
    label:  '위험',
  },
}

// 안전도 바 색상
export const BAR_COLORS = {
  safe:    COLORS.safe,
  caution: COLORS.caution,
  warning: COLORS.warn,
  danger:  COLORS.danger,
}