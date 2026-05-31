import { Marker, Circle } from 'react-leaflet'
import L from 'leaflet'

import cctvIcon from '../../assets/icons/icon-cctv.svg'
import emergencyIcon from '../../assets/icons/icon-emergency.svg'
import policeIcon from '../../assets/icons/icon-police.svg'

// SVG 아이콘 마커 생성
const createSvgIcon = (iconUrl) =>
  L.divIcon({
    html: `
      <div style="
        width: 37px; height: 37px;
        background: white;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        border: 1px solid #E5E7EB;
      ">
        <img src="${iconUrl}" width="22" height="22" />
      </div>
    `,
    className: '',
    iconSize: [37, 37],
    iconAnchor: [18, 18],
  })

const ICONS = {
  cctv:      createSvgIcon(cctvIcon),
  emergency: createSvgIcon(emergencyIcon),
  police:    createSvgIcon(policeIcon),
}

// 더미 마커 데이터
const DUMMY_MARKERS = {
  cctv: [
    { id: 1, pos: [37.6210, 127.0612], label: 'CCTV 1' },
    { id: 2, pos: [37.6225, 127.0625], label: 'CCTV 2' },
    { id: 3, pos: [37.6200, 127.0600], label: 'CCTV 3' },
  ],
  emergency: [
    { id: 1, pos: [37.6218, 127.0618], label: '광운대 의원' },
    { id: 2, pos: [37.6195, 127.0595], label: '월계 의원' },
  ],
  police: [
    { id: 1, pos: [37.6230, 127.0635], label: '월계 지구대' },
    { id: 2, pos: [37.6190, 127.0590], label: '노원 파출소' },
  ],
}

// 히트맵 더미 데이터 (위험도 높을수록 radius 크게)
const DANGER_HEATMAP = [
  { id: 1, pos: [37.6240, 127.0640], radius: 80,  color: 'rgba(239,68,68,0.65)' },
  { id: 2, pos: [37.6235, 127.0632], radius: 60,  color: 'rgba(251,146,60,0.55)' },
  { id: 3, pos: [37.6228, 127.0622], radius: 100, color: 'rgba(250,204,21,0.45)' },
  { id: 4, pos: [37.6205, 127.0608], radius: 50,  color: 'rgba(239,68,68,0.50)' },
]

export default function FilterMarkers({ activeFilters = ['all'] }) {
  const filtersToShow = activeFilters.includes('all')
    ? ['cctv', 'emergency', 'police', 'danger']
    : activeFilters

  return (
    <>
      {/* 일반 마커 (CCTV, 응급, 경찰) */}
      {filtersToShow
        .filter((f) => f !== 'danger')
        .map((filterId) =>
          (DUMMY_MARKERS[filterId] ?? []).map((m) => (
            <Marker
              key={`${filterId}-${m.id}`}
              position={m.pos}
              icon={ICONS[filterId]}
            />
          ))
        )}

      {/* 위험 범역 히트맵 */}
      {filtersToShow.includes('danger') &&
        DANGER_HEATMAP.map((h) => (
          <Circle
            key={`danger-${h.id}`}
            center={h.pos}
            radius={h.radius}
            pathOptions={{
              color: 'transparent',
              fillColor: h.color,
              fillOpacity: 1,
            }}
          />
        ))}
    </>
  )
}