import { Polyline } from 'react-leaflet'
import { COLORS } from '../../styles/colors'

// 구간별 위험도에 따라 색상 다르게 표시
// segments = [{ positions: [[lat,lng],[lat,lng]], level: 'safe' | 'caution' | 'warning' | 'danger' }]

const LEVEL_COLORS = {
  safe:    COLORS.safe,
  caution: COLORS.caution,
  warning: COLORS.warn,
  danger:  COLORS.danger,
}

// 더미 경로 데이터 (광운대 주변)
export const DUMMY_ROUTE_SEGMENTS = [
  {
    level: 'safe',
    positions: [
      [37.6207, 127.0609],
      [37.6215, 127.0615],
      [37.6220, 127.0620],
    ],
  },
  {
    level: 'caution',
    positions: [
      [37.6220, 127.0620],
      [37.6228, 127.0625],
      [37.6235, 127.0630],
    ],
  },
  {
    level: 'warning',
    positions: [
      [37.6235, 127.0630],
      [37.6240, 127.0638],
    ],
  },
  {
    level: 'danger',
    positions: [
      [37.6240, 127.0638],
      [37.6245, 127.0645],
      [37.6250, 127.0650],
    ],
  },
]

export default function RouteLayer({ segments = DUMMY_ROUTE_SEGMENTS }) {
  return (
    <>
      {segments.map((seg, idx) => (
        <Polyline
          key={idx}
          positions={seg.positions}
          pathOptions={{
            color: LEVEL_COLORS[seg.level] ?? COLORS.safe,
            weight: 6,
            lineCap: 'round',
            lineJoin: 'round',
            opacity: 0.9,
          }}
        />
      ))}
    </>
  )
}