import { useEffect, useRef } from 'react';

export default function TmapView({ startCoord, endCoord, routeData, tmapRouteData, policeStations = [], onMapClick }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const safePolylineRef = useRef(null);
    const tmapPolylineRef = useRef(null);
    const markersRef = useRef([]);

    const onMapClickRef = useRef(onMapClick);

    useEffect(() => {
        onMapClickRef.current = onMapClick;
    }, [onMapClick]);

    useEffect(() => {
        if (!window.Tmapv2 || mapInstance.current) return;

        mapInstance.current = new window.Tmapv2.Map(mapRef.current, {
            center: new window.Tmapv2.LatLng(37.5665, 126.9780),
            width: "100%",
            height: "100%",
            zoom: 14,
            httpsMode: true
        });

        mapInstance.current.addListener("click", (e) => {
            if (onMapClickRef.current && e.latLng) {
                onMapClickRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }
        });
    }, []);

    useEffect(() => {
        if (!mapInstance.current) return;
        const map = mapInstance.current;

        if (safePolylineRef.current) {
            safePolylineRef.current.setMap(null);
            safePolylineRef.current = null;
        }
        if (tmapPolylineRef.current) {
            tmapPolylineRef.current.setMap(null);
            tmapPolylineRef.current = null;
        }
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        const newMarkers = [];
        const bounds = new window.Tmapv2.LatLngBounds();
        let validPointsCount = 0;

        const extendBounds = (lat, lng) => {
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                bounds.extend(new window.Tmapv2.LatLng(lat, lng));
                validPointsCount++;
            }
        };

        const createSvgMarker = (color, text) => {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="60" viewBox="0 0 46 60"><path d="M23 0 C10.297 0 0 10.297 0 23 C0 39.5 23 60 23 60 C23 60 46 39.5 46 23 C46 10.297 35.703 0 23 0 Z" fill="${color}" stroke="#ffffff" stroke-width="2.5"/><text x="23" y="28" font-family="sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${text}</text></svg>`;
            return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        };

        if (startCoord) {
            newMarkers.push(new window.Tmapv2.Marker({
                position: new window.Tmapv2.LatLng(startCoord.lat, startCoord.lng),
                icon: createSvgMarker("#3b82f6", "출발"),
                iconSize: new window.Tmapv2.Size(46, 60),
                offset: new window.Tmapv2.Point(23, 60),
                map: map
            }));
            extendBounds(startCoord.lat, startCoord.lng);
        }

        if (endCoord) {
            newMarkers.push(new window.Tmapv2.Marker({
                position: new window.Tmapv2.LatLng(endCoord.lat, endCoord.lng),
                icon: createSvgMarker("#ef4444", "도착"),
                iconSize: new window.Tmapv2.Size(46, 60),
                offset: new window.Tmapv2.Point(23, 60),
                map: map
            }));
            extendBounds(endCoord.lat, endCoord.lng);
        }

        // 치안시설(경찰서/파출소) 마커 렌더링
        if (policeStations.length > 0) {
            const policeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 2 L4 8 L4 16 C4 23 9 29 16 31 C23 29 28 23 28 16 L28 8 Z" fill="#1e3a8a" stroke="#ffffff" stroke-width="2"/><text x="16" y="21" font-size="14" font-weight="bold" fill="white" text-anchor="middle">P</text></svg>`;
            const policeIconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(policeSvg)}`;

            policeStations.forEach(station => {
                newMarkers.push(new window.Tmapv2.Marker({
                    position: new window.Tmapv2.LatLng(station.lat, station.lng),
                    icon: policeIconUrl,
                    iconSize: new window.Tmapv2.Size(32, 32),
                    offset: new window.Tmapv2.Point(16, 16),
                    title: station.name, // 마우스 오버 시 파출소 이름 표시
                    map: map,
                    zIndex: 999 // 경찰 마커가 선명하게 보이도록 z-index 부여
                }));
                extendBounds(station.lat, station.lng);
            });
        }

        if (tmapRouteData?.path) {
            const tmapPath = [];
            tmapRouteData.path.forEach(coord => {
                tmapPath.push(new window.Tmapv2.LatLng(coord.lat, coord.lng));
                extendBounds(coord.lat, coord.lng);
            });
            if (tmapPath.length > 0) {
                tmapPolylineRef.current = new window.Tmapv2.Polyline({
                    path: tmapPath,
                    strokeColor: "#9ca3af",
                    strokeWeight: 5,
                    strokeStyle: "dash",
                    map: map
                });
            }
        }

        if (routeData?.geojson) {
            const safePath = [];
            const geometry = routeData.geojson.geometry;

            if (geometry.type === 'MultiLineString') {
                geometry.coordinates.forEach(line => {
                    line.forEach(coord => {
                        safePath.push(new window.Tmapv2.LatLng(coord[1], coord[0]));
                        extendBounds(coord[1], coord[0]);
                    });
                });
            } else {
                geometry.coordinates.forEach(coord => {
                    safePath.push(new window.Tmapv2.LatLng(coord[1], coord[0]));
                    extendBounds(coord[1], coord[0]);
                });
            }

            if (safePath.length > 0) {
                safePolylineRef.current = new window.Tmapv2.Polyline({
                    path: safePath,
                    strokeColor: "#3b82f6",
                    strokeWeight: 6,
                    map: map
                });
            }

            const warningSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/><text x="14" y="19" font-size="14" font-weight="bold" fill="white" text-anchor="middle">!</text></svg>`;
            const warningIconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(warningSvg)}`;

            if (routeData.route_analysis?.markers) {
                routeData.route_analysis.markers.forEach(markerInfo => {
                    newMarkers.push(new window.Tmapv2.Marker({
                        position: new window.Tmapv2.LatLng(markerInfo.lat, markerInfo.lng),
                        icon: warningIconUrl,
                        iconSize: new window.Tmapv2.Size(28, 28),
                        offset: new window.Tmapv2.Point(14, 14),
                        title: markerInfo.type || '위험 요소',
                        map: map
                    }));
                });
            }
        }

        if ((routeData?.geojson || tmapRouteData?.path || policeStations.length > 0) && validPointsCount > 0) {
            map.fitBounds(bounds);
        }

        markersRef.current = newMarkers;

    }, [startCoord, endCoord, routeData, tmapRouteData, policeStations]);

    return <div ref={mapRef} className="w-full h-full rounded-xl z-0" />;
}