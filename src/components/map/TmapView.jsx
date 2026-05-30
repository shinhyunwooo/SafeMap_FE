import { useEffect, useRef } from 'react';
import { COLORS } from '../../styles/colors';

export default function TmapView({
  startCoord, endCoord, routeData, tmapRouteData,
  policeStations = [], cctvList = [], emergencyList = [], dangerZones = [],
  highlightGeneralRoute = false,
  onMapClick
}) {
  const mapRef           = useRef(null);
  const mapInstance      = useRef(null);
  const safePolylinesRef = useRef([]);
  const tmapPolylineRef  = useRef(null);
  const markersRef       = useRef([]);
  const onMapClickRef    = useRef(onMapClick);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  useEffect(() => {
    if (!window.Tmapv2 || mapInstance.current) return;
    mapInstance.current = new window.Tmapv2.Map(mapRef.current, {
      center: new window.Tmapv2.LatLng(37.5665, 126.9780),
      width: "100%", height: "100%", zoom: 14, httpsMode: true
    });
    mapInstance.current.addListener("click", (e) => {
      if (onMapClickRef.current && e.latLng)
        onMapClickRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
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

      // 위험 요소 마커
      const warningSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="13" fill="#FB923C" stroke="#ffffff" stroke-width="2"/>
        <text x="14" y="19" font-size="14" font-weight="bold" fill="white" text-anchor="middle">!</text>
      </svg>`;
      const warningIconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(warningSvg)}`;

      (routeData.route_analysis?.markers ?? []).forEach(m => {
        if (!m.lat || !m.lng) return;
        newMarkers.push(new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(m.lat, m.lng),
          icon: warningIconUrl,
          iconSize: new window.Tmapv2.Size(28, 28),
          offset: new window.Tmapv2.Point(14, 14),
          title: `${m.type}: ${m.detail}`, map
        }));
      });
    }

    if ((routeData?.geojson || tmapRouteData?.path || policeStations.length > 0) && validCount > 0) {
      map.fitBounds(bounds);
    }
    markersRef.current = newMarkers;

  }, [startCoord, endCoord, routeData, tmapRouteData, policeStations, cctvList, emergencyList, dangerZones, highlightGeneralRoute]);

  return <div ref={mapRef} className="w-full h-full z-0" />;
}