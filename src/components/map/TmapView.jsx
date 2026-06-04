import { useEffect, useRef } from 'react';
import { COLORS } from '../../styles/colors';

export default function TmapView({
  startCoord, endCoord, routeData, tmapRouteData,
  policeStations = [], cctvList = [], emergencyList = [], dangerZones = [],
  reports = [], reportDraftPoint = null, reportPickMode = false,
  highlightGeneralRoute = false,
  onMapClick,
  onDangerMarkerClick,
  onReportPick,
  onReportMarkerClick,
  userLocation,
  locateTrigger,
}) {
  const mapRef             = useRef(null);
  const mapInstance        = useRef(null);
  const safePolylinesRef   = useRef([]);
  const tmapPolylineRef    = useRef(null);
  const markersRef         = useRef([]);
  const reportMarkersRef   = useRef([]);
  const reportDraftRef     = useRef(null);
  const onMapClickRef      = useRef(onMapClick);
  const onDangerClickRef   = useRef(onDangerMarkerClick);
  const onReportPickRef    = useRef(onReportPick);
  const onReportClickRef   = useRef(onReportMarkerClick);
  const reportPickModeRef  = useRef(reportPickMode);
  const userMarkerRef      = useRef(null);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onDangerClickRef.current = onDangerMarkerClick; }, [onDangerMarkerClick]);
  useEffect(() => { onReportPickRef.current = onReportPick; }, [onReportPick]);
  useEffect(() => { onReportClickRef.current = onReportMarkerClick; }, [onReportMarkerClick]);
  useEffect(() => { reportPickModeRef.current = reportPickMode; }, [reportPickMode]);

  useEffect(() => {
    if (!window.Tmapv2 || mapInstance.current) return;
    mapInstance.current = new window.Tmapv2.Map(mapRef.current, {
      center: new window.Tmapv2.LatLng(37.5665, 126.9780),
      width: "100%", height: "100%", zoom: 14, httpsMode: true
    });
    mapInstance.current.addListener("click", (e) => {
      if (!e.latLng) return;
      const ll = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      // 제보 위치 선택 모드면 경로 지정 대신 제보 핀을 찍는다
      if (reportPickModeRef.current) {
        onReportPickRef.current?.(ll);
        return;
      }
      onMapClickRef.current?.(ll);
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    resizeObserver.observe(mapRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    // 초기화
    safePolylinesRef.current.forEach(p => p.setMap(null));
    safePolylinesRef.current = [];
    if (tmapPolylineRef.current) { tmapPolylineRef.current.setMap(null); tmapPolylineRef.current = null; }
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const newMarkers = [];
    const bounds = new window.Tmapv2.LatLngBounds();
    let validCount = 0;

    const extendBounds = (lat, lng) => {
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        bounds.extend(new window.Tmapv2.LatLng(lat, lng));
        validCount++;
      }
    };

    const createSvgMarker = (color, text) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="60" viewBox="0 0 46 60">
        <path d="M23 0 C10.297 0 0 10.297 0 23 C0 39.5 23 60 23 60 C23 60 46 39.5 46 23 C46 10.297 35.703 0 23 0 Z"
          fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
        <text x="23" y="28" font-family="sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${text}</text>
      </svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };

    const createCircleMarker = (color, emoji) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <text x="16" y="21" font-size="14" text-anchor="middle">${emoji}</text>
      </svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };

    // 출발지
    if (startCoord) {
      newMarkers.push(new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(startCoord.lat, startCoord.lng),
        icon: createSvgMarker("#3B82F6", "출발"),
        iconSize: new window.Tmapv2.Size(46, 60),
        offset: new window.Tmapv2.Point(23, 60), map
      }));
      extendBounds(startCoord.lat, startCoord.lng);
    }

    // 도착지
    if (endCoord) {
      newMarkers.push(new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(endCoord.lat, endCoord.lng),
        icon: createSvgMarker("#EF4444", "도착"),
        iconSize: new window.Tmapv2.Size(46, 60),
        offset: new window.Tmapv2.Point(23, 60), map
      }));
      extendBounds(endCoord.lat, endCoord.lng);
    }

    // 경찰서 마커
    if (policeStations.length > 0) {
      const policeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <path d="M16 2 L4 8 L4 16 C4 23 9 29 16 31 C23 29 28 23 28 16 L28 8 Z"
          fill="#1E3A8A" stroke="#ffffff" stroke-width="2"/>
        <text x="16" y="21" font-size="13" font-weight="bold" fill="white" text-anchor="middle">P</text>
      </svg>`;
      const policeIconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(policeSvg)}`;
      policeStations.forEach(s => {
        if (!s.lat || !s.lng) return;
        newMarkers.push(new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(s.lat, s.lng),
          icon: policeIconUrl,
          iconSize: new window.Tmapv2.Size(32, 32),
          offset: new window.Tmapv2.Point(16, 16),
          title: s.name, map, zIndex: 999
        }));
      });
    }

    // CCTV 마커
    if (cctvList.length > 0) {
      const cctvIconUrl = createCircleMarker("#3B82F6", "📷");
      cctvList.forEach(c => {
        if (!c.lat || !c.lng) return;
        newMarkers.push(new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(c.lat, c.lng),
          icon: cctvIconUrl,
          iconSize: new window.Tmapv2.Size(32, 32),
          offset: new window.Tmapv2.Point(16, 16),
          title: c.name, map, zIndex: 900
        }));
      });
    }

    // 응급기관 마커
    if (emergencyList.length > 0) {
      const emergencySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#EF4444" stroke="#ffffff" stroke-width="2"/>
        <text x="16" y="12" font-size="11" font-weight="bold" fill="white" text-anchor="middle">+</text>
        <rect x="14" y="8" width="4" height="16" fill="white" rx="1"/>
        <rect x="8" y="14" width="16" height="4" fill="white" rx="1"/>
      </svg>`;
      const emergencyIconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(emergencySvg)}`;
      emergencyList.forEach(e => {
        if (!e.lat || !e.lng) return;
        newMarkers.push(new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(e.lat, e.lng),
          icon: emergencyIconUrl,
          iconSize: new window.Tmapv2.Size(32, 32),
          offset: new window.Tmapv2.Point(16, 16),
          title: e.name, map, zIndex: 900
        }));
      });
    }

    // 위험 범역 히트맵
    if (dangerZones.length > 0) {
      dangerZones.forEach(d => {
        if (!d.lat || !d.lng) return;
        newMarkers.push(new window.Tmapv2.Circle({
          center: new window.Tmapv2.LatLng(d.lat, d.lng),
          radius: 60,
          fillColor: '#EF4444',
          fillOpacity: 0.25,
          strokeColor: '#EF4444',
          strokeOpacity: 0.5,
          strokeWeight: 1,
          map
        }));
      });
    }

    // 일반 최단 경로 (회색 점선 or 강조선)
    if (tmapRouteData?.path) {
      const tmapPath = tmapRouteData.path.map(coord => {
        extendBounds(coord.lat, coord.lng);
        return new window.Tmapv2.LatLng(coord.lat, coord.lng);
      });
      if (tmapPath.length > 0) {
        tmapPolylineRef.current = new window.Tmapv2.Polyline({
          path: tmapPath,
          strokeColor: highlightGeneralRoute ? "#2563EB" : "#9CA3AF",
          strokeWeight: highlightGeneralRoute ? 8 : 5,
          strokeStyle: highlightGeneralRoute ? "solid" : "dash",
          map
        });
      }
    }

    // 안전 경로 (구간별 4단계 색상: safe/caution/warning/danger)
    if (routeData?.geojson?.type === 'FeatureCollection') {
      routeData.geojson.features.forEach(feature => {
        const coords = feature.geometry?.coordinates;
        if (!coords || coords.length === 0) return;

        const edgePath = coords.map(coord => {
          extendBounds(coord[1], coord[0]);
          return new window.Tmapv2.LatLng(coord[1], coord[0]);
        });

        const color = COLORS[feature.properties?.risk_level] || COLORS.primary;
        const outline = new window.Tmapv2.Polyline({
          path: edgePath, strokeColor: '#FFFFFF',
          strokeWeight: 11, strokeOpacity: 0.9, map
        });
        const mainLine = new window.Tmapv2.Polyline({
          path: edgePath, strokeColor: color,
          strokeWeight: 7, strokeOpacity: 1, map
        });
        safePolylinesRef.current.push(outline, mainLine);
      });

      // 드로잉 애니메이션 (구간별 4색 각각 적용)
      setTimeout(() => {
        Object.values(COLORS).forEach(c => {
          document.querySelectorAll(`.tmap-map path[stroke="${c}"]`)
            .forEach(path => {
              const len = path.getTotalLength?.() || 2000;
              path.style.strokeDasharray  = len;
              path.style.strokeDashoffset = len;
              path.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
              requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
            });
        });
      }, 100);

      // 로드뷰 트리거 마커: 급경사 구간 + 도로파손 민원 지점만 (클릭 시 네이버 로드뷰 모달)
      const warningSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="13" fill="#FB923C" stroke="#ffffff" stroke-width="2"/>
        <text x="14" y="19" font-size="14" font-weight="bold" fill="white" text-anchor="middle">!</text>
      </svg>`;
      const warningIconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(warningSvg)}`;

      const roadviewPoints = [];

      // (a) 급경사 구간 (slope_risk >= 0.7 → 경사 7도 이상) → 구간 중점
      routeData.geojson.features.forEach(f => {
        if ((f.properties?.slope_risk ?? 0) < 0.7) return;
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length === 0) return;
        const mid = coords[Math.floor(coords.length / 2)];
        roadviewPoints.push({
          lat: mid[1], lng: mid[0],
          type: '급경사 구간', detail: '경사가 가파른 구간입니다.'
        });
      });

      // (b) 도로파손/시설물 민원 지점
      (routeData.route_analysis?.markers ?? []).forEach(m => {
        if (!m.lat || !m.lng) return;
        if (!/파손|시설물/.test(m.type || '')) return;
        roadviewPoints.push({ lat: m.lat, lng: m.lng, type: m.type, detail: m.detail });
      });

      roadviewPoints.forEach(p => {
        const dangerMarker = new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(p.lat, p.lng),
          icon: warningIconUrl,
          iconSize: new window.Tmapv2.Size(28, 28),
          offset: new window.Tmapv2.Point(14, 14),
          title: `${p.type}: ${p.detail}`, map
        });
        dangerMarker.addListener('click', () => {
          if (onDangerClickRef.current)
            onDangerClickRef.current({ lat: p.lat, lng: p.lng, type: p.type, detail: p.detail });
        });
        newMarkers.push(dangerMarker);
      });
    }

    if ((routeData?.geojson || tmapRouteData?.path || policeStations.length > 0) && validCount > 0) {
      map.fitBounds(bounds);
    }
    markersRef.current = newMarkers;

  }, [startCoord, endCoord, routeData, tmapRouteData, policeStations, cctvList, emergencyList, dangerZones, highlightGeneralRoute]);

  // 마커만 업데이트 (위치가 바뀔 때마다)
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;
    const map = mapInstance.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#3B82F6" fill-opacity="0.2"/>
      <circle cx="14" cy="14" r="8" fill="#3B82F6" fill-opacity="0.35"/>
      <circle cx="14" cy="14" r="5" fill="#3B82F6" stroke="white" stroke-width="2.5"/>
    </svg>`;
    const iconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    userMarkerRef.current = new window.Tmapv2.Marker({
      position: new window.Tmapv2.LatLng(userLocation.lat, userLocation.lng),
      icon: iconUrl,
      iconSize: new window.Tmapv2.Size(28, 28),
      offset: new window.Tmapv2.Point(14, 14),
      map,
      zIndex: 2000,
    });
  }, [userLocation]);

  // 지도 이동은 버튼을 눌렀을 때(locateTrigger)만
  useEffect(() => {
    if (!mapInstance.current || !userLocation || locateTrigger === 0) return;
    mapInstance.current.setCenter(new window.Tmapv2.LatLng(userLocation.lat, userLocation.lng));
  }, [locateTrigger, userLocation]);

  // 사용자 제보 마커 레이어 (별도 ref로 관리 → 메인 마커 갱신에 안 지워짐)
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    reportMarkersRef.current.forEach(m => m.setMap(null));
    reportMarkersRef.current = [];

    const reportSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="15" fill="#F97316" stroke="#ffffff" stroke-width="2.5"/>
      <path d="M11 14 L19 11 L19 21 L11 18 Z" fill="white"/>
      <rect x="19" y="13" width="3" height="6" rx="1" fill="white"/>
    </svg>`;
    const reportIconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(reportSvg)}`;

    reports.forEach(r => {
      if (!r.lat || !r.lng) return;
      const marker = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(r.lat, r.lng),
        icon: reportIconUrl,
        iconSize: new window.Tmapv2.Size(34, 34),
        offset: new window.Tmapv2.Point(17, 17),
        title: `[제보] ${(r.categories ?? []).join(', ')}`,
        map, zIndex: 1500,
      });
      marker.addListener('click', () => onReportClickRef.current?.(r));
      reportMarkersRef.current.push(marker);
    });
  }, [reports]);

  // 제보 작성 중 위치(드래프트 핀) 표시
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    if (reportDraftRef.current) { reportDraftRef.current.setMap(null); reportDraftRef.current = null; }
    if (!reportDraftPoint) return;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
      <path d="M22 0 C9.85 0 0 9.85 0 22 C0 37.5 22 56 22 56 C22 56 44 37.5 44 22 C44 9.85 34.15 0 22 0 Z"
        fill="#F97316" stroke="#ffffff" stroke-width="2.5"/>
      <circle cx="22" cy="21" r="7" fill="white"/>
    </svg>`;
    const iconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    reportDraftRef.current = new window.Tmapv2.Marker({
      position: new window.Tmapv2.LatLng(reportDraftPoint.lat, reportDraftPoint.lng),
      icon: iconUrl,
      iconSize: new window.Tmapv2.Size(44, 56),
      offset: new window.Tmapv2.Point(22, 56),
      map, zIndex: 2500,
    });
  }, [reportDraftPoint]);

  return <div ref={mapRef} className="w-full h-full z-0" />;
}
