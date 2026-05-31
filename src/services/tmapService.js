import axios from 'axios';

const TMAP_APP_KEY = import.meta.env.VITE_TMAP_APP_KEY || '발급받은_앱키를_입력하세요';

const tmapClient = axios.create({
    baseURL: 'https://apis.openapi.sk.com/tmap',
    headers: { appKey: TMAP_APP_KEY },
});

// 반경 내 POI 검색 공통 함수
const fetchNearbyPOI = async (lat, lng, keywords, noiseFilter = null, radius = 1, count = 15) => {
    try {
        const requests = keywords.map(keyword =>
            tmapClient.get('/pois', {
                params: {
                    version: 1, searchKeyword: keyword,
                    searchtypCd: "R", radius,
                    centerLon: lng.toString(), centerLat: lat.toString(),
                    resCoordType: "WGS84GEO", reqCoordType: "WGS84GEO", count
                }
            })
        );
        const responses = await Promise.all(requests);
        const data = [];
        responses.forEach(res => {
            res.data?.searchPoiInfo?.pois?.poi?.forEach(p => {
                if (!noiseFilter || !noiseFilter.test(p.name)) {
                    data.push({ name: p.name, lat: Number(p.noorLat), lng: Number(p.noorLon) });
                }
            });
        });
        // 이름 기준 중복 제거
        return Array.from(new Map(data.map(a => [a.name, a])).values());
    } catch (error) {
        console.error('POI 검색 실패:', error);
        return [];
    }
};

// 장소 검색
export const searchPlaces = async (keyword) => {
    try {
        const response = await tmapClient.get('/pois', {
            params: {
                version: 1, searchKeyword: keyword,
                resCoordType: "WGS84GEO", reqCoordType: "WGS84GEO", count: 5
            }
        });
        if (!response.data?.searchPoiInfo) return [];
        return response.data.searchPoiInfo.pois.poi.map(p => ({
            name: p.name,
            lat: Number(p.noorLat), lng: Number(p.noorLon),
            address: p.newAddressList?.newAddress?.[0]?.fullAddressRoad
                || `${p.upperAddrName} ${p.middleAddrName} ${p.lowerAddrName}`
        }));
    } catch (error) {
        console.error('장소 검색 실패:', error);
        return [];
    }
};

// 보행자 경로 탐색
export const fetchTmapPedestrianRoute = async ({ startLat, startLng, endLat, endLng }) => {
    try {
        const response = await tmapClient.post('/routes/pedestrian?version=1', {
            startX: startLng.toString(), startY: startLat.toString(),
            endX: endLng.toString(),     endY: endLat.toString(),
            startName: "출발지", endName: "도착지",
            reqCoordType: "WGS84GEO", resCoordType: "WGS84GEO",
        });
        const features = response.data.features;
        const pathCoordinates = [], tbtList = [];
        let totalDistance = 0, totalTime = 0;
        features.forEach(({ geometry, properties }) => {
            if (properties.totalDistance) totalDistance = properties.totalDistance;
            if (properties.totalTime)     totalTime     = properties.totalTime;
            if (geometry.type === 'Point' && properties.description)
                tbtList.push({ description: properties.description, turnType: properties.turnType });
            if (geometry.type === 'Point')
                pathCoordinates.push({ lat: geometry.coordinates[1], lng: geometry.coordinates[0] });
            else if (geometry.type === 'LineString')
                geometry.coordinates.forEach(c => pathCoordinates.push({ lat: c[1], lng: c[0] }));
        });
        return { path: pathCoordinates, totalDistance, totalTime, tbtList };
    } catch (error) {
        console.error('보행자 경로 탐색 실패:', error);
        throw error;
    }
};

// 경찰서/파출소
export const fetchNearbyPolice = async (lat, lng) => {
    const noiseFilter = /화장실|식당|구내|어린이집|주차장|창고|휴게실|민원실|경비|수사대/;
    return fetchNearbyPOI(lat, lng, ['경찰서', '파출소', '치안센터'], noiseFilter);
};

export const fetchNearbyCCTV = async (lat, lng) => {
    try {
        const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/map/cctv`,
            { params: { lat, lng, radius: 1000 } }
        );
        if (response.data?.status === 'success') {
            return response.data.data.map(cctv => ({
                id: cctv.id,
                lat: cctv.lat,
                lng: cctv.lng,
                name: 'CCTV'
            }));
        }
        return [];
    } catch (error) {
        console.error('CCTV 데이터 오류:', error);
        return [];
    }
};

// 응급기관 (병원/약국/소방서)
export const fetchNearbyEmergency = async (lat, lng) => {
    const noiseFilter = /동물|반려|애견|치과|한의|피부|성형|안과/;
    return fetchNearbyPOI(lat, lng, ['응급실', '소방서', '119안전센터', '병원'], noiseFilter, 1, 20);
};