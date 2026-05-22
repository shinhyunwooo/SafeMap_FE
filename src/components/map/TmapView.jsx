import { useEffect, useRef } from 'react';
import { getRouteColor } from '../../styles/colors';

export default function TmapView({
  startCoord, endCoord, routeData, tmapRouteData,
  policeStations = [], onMapClick
}) {
  const mapRef          = useRef(null);
  const mapInstance     = useRef(null);
  const safePolylinesRef = useRef([]);   // 복수 (외곽선 + 실선)
  const tmapPolylineRef = useRef(null);
  const markersRef      = useRef([]);
  const onMapClickRef   = useRef(onMapClick);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  // 지도 초기화
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

  // 경로/마커 렌더링
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    // 이전 렌더링 초기화
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

    // 출발지 마커
    if (startCoord) {
      newMarkers.push(new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(startCoord.lat, startCoord.lng),
        icon: createSvgMarker("#3B82F6", "출발"),
        iconSize: new window.Tmapv2.Size(46, 60),
        offset: new window.Tmapv2.Point(23, 60), map
      }));
      extendBounds(startCoord.lat, startCoord.lng);
    }

    // 도착지 마커
    if (endCoord) {
      newMarkers.push(new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(endCoord.lat, endCoord.lng),
        icon: createSvgMarker("#EF4444", "도착"),
        iconSize: new window.Tmapv2.Size(46, 60),
        offset: new window.Tmapv2.Point(23, 60), map
      }));
      extendBounds(endCoord.lat, endCoord.lng);
    }

    // 치안시설 마커
    if (policeStations.length > 0) {
      const policeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <path d="M16 2 L4 8 L4 16 C4 23 9 29 16 31 C23 29 28 23 28 16 L28 8 Z"
          fill="#1e3a8a" stroke="#ffffff" stroke-width="2"/>
        <text x="16" y="21" font-size="14" font-weight="bold" fill="white" text-anchor="middle">P</text>
      </svg>`;
      const policeIconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(policeSvg)}`;
      policeStations.forEach(station => {
        newMarkers.push(new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(station.lat, station.lng),
          icon: policeIconUrl,
          iconSize: new window.Tmapv2.Size(32, 32),
          offset: new window.Tmapv2.Point(16, 16),
          title: station.name, map, zIndex: 999
        }));
        extendBounds(station.lat, station.lng);
      });
    }

    // 일반 최단 경로 (회색 점선)
    if (tmapRouteData?.path) {
      const tmapPath = tmapRouteData.path.map(coord => {
        extendBounds(coord.lat, coord.lng);
        return new window.Tmapv2.LatLng(coord.lat, coord.lng);
      });
      if (tmapPath.length > 0) {
        tmapPolylineRef.current = new window.Tmapv2.Polyline({
          path: tmapPath,
          strokeColor: "#9CA3AF",
          strokeWeight: 5,
          strokeStyle: "dash",
          map
        });
      }
    }

    // 안전 경로 (위험도별 색상 + 드로잉 애니메이션)
    if (routeData?.geojson) {
      const geometry = routeData.geojson.geometry;
      const scores   = routeData.route_analysis?.scores;
      const routeColor = getRouteColor(scores);

      const safePath = [];
      if (geometry.type === 'MultiLineString') {
        geometry.coordinates.forEach(line =>
          line.forEach(coord => {
            safePath.push(new window.Tmapv2.LatLng(coord[1], coord[0]));
            extendBounds(coord[1], coord[0]);
          })
        );
      } else {
        geometry.coordinates.forEach(coord => {
          safePath.push(new window.Tmapv2.LatLng(coord[1], coord[0]));
          extendBounds(coord[1], coord[0]);
        });
      }

      if (safePath.length > 0) {
        // 흰색 외곽선
        const outline = new window.Tmapv2.Polyline({
          path: safePath,
          strokeColor: '#FFFFFF',
          strokeWeight: 11,
          strokeOpacity: 0.9,
          map
        });
        // 위험도 색상 실선
        const mainLine = new window.Tmapv2.Polyline({
          path: safePath,
          strokeColor: routeColor,
          strokeWeight: 7,
          strokeOpacity: 1,
          map
        });
        safePolylinesRef.current = [outline, mainLine];

        // 드로잉 애니메이션 (SVG path 찾아서 적용)
        setTimeout(() => {
          const svgPaths = document.querySelectorAll(
            '.tmap-map path[stroke="' + routeColor + '"]'
          );
          svgPaths.forEach(path => {
            const len = path.getTotalLength?.() || 2000;
            path.style.strokeDasharray  = len;
            path.style.strokeDashoffset = len;
            path.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
            requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
          });
        }, 100);
      }

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
          title: `${m.type}: ${m.detail}`,
          map
        }));
      });
    }

    if ((routeData?.geojson || tmapRouteData?.path || policeStations.length > 0) && validCount > 0) {
      map.fitBounds(bounds);
    }
    markersRef.current = newMarkers;

  }, [startCoord, endCoord, routeData, tmapRouteData, policeStations]);

  return <div ref={mapRef} className="w-full h-full z-0" />;
}