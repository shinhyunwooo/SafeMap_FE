import axios from 'axios';

// Tmap API 기본 설정
const TMAP_APP_KEY = import.meta.env.VITE_TMAP_APP_KEY || '발급받은_앱키를_입력하세요';

const tmapClient = axios.create({
    baseURL: 'https://apis.openapi.sk.com/tmap',
    headers: {
        appKey: TMAP_APP_KEY,
    },
});

/**
 * 장소 검색 API 호출
 * 사용자 입력 키워드를 기반으로 장소 목록을 반환합니다.
 */
export const searchPlaces = async (keyword) => {
    try {
        const response = await tmapClient.get('/pois', {
            params: {
                version: 1,
                searchKeyword: keyword,
                resCoordType: "WGS84GEO",
                reqCoordType: "WGS84GEO",
                count: 5
            }
        });

        // 검색 결과가 없을 경우 빈 배열 반환
        if (!response.data || !response.data.searchPoiInfo) return [];

        return response.data.searchPoiInfo.pois.poi.map(p => ({
            name: p.name,
            lat: Number(p.noorLat),
            lng: Number(p.noorLon),
            address: p.newAddressList?.newAddress?.[0]?.fullAddressRoad || `${p.upperAddrName} ${p.middleAddrName} ${p.lowerAddrName}`
        }));
    } catch (error) {
        console.error('장소 검색 API 호출 실패:', error);
        return [];
    }
};

/**
 * 보행자 경로 탐색 API 호출 및 Turn-by-Turn(TBT) 데이터 추출
 * 일반 최단 경로의 좌표 배열과 상세 텍스트 안내 목록을 반환합니다.
 */
export const fetchTmapPedestrianRoute = async ({ startLat, startLng, endLat, endLng }) => {
    try {
        const response = await tmapClient.post('/routes/pedestrian?version=1', {
            startX: startLng.toString(),
            startY: startLat.toString(),
            endX: endLng.toString(),
            endY: endLat.toString(),
            startName: "출발지",
            endName: "도착지",
            reqCoordType: "WGS84GEO",
            resCoordType: "WGS84GEO",
        });

        const features = response.data.features;
        const pathCoordinates = [];
        const tbtList = [];
        let totalDistance = 0;
        let totalTime = 0;

        features.forEach((feature) => {
            const geometry = feature.geometry;
            const properties = feature.properties;

            if (properties.totalDistance) totalDistance = properties.totalDistance;
            if (properties.totalTime) totalTime = properties.totalTime;

            // Point 타입이면서 description(텍스트 안내)이 존재하는 데이터 추출
            if (geometry.type === 'Point' && properties.description) {
                tbtList.push({
                    description: properties.description,
                    turnType: properties.turnType,
                    pointIndex: properties.pointIndex
                });
            }

            // 렌더링용 경로 좌표 수집
            if (geometry.type === 'Point') {
                pathCoordinates.push({ lat: geometry.coordinates[1], lng: geometry.coordinates[0] });
            } else if (geometry.type === 'LineString') {
                geometry.coordinates.forEach(coord => {
                    pathCoordinates.push({ lat: coord[1], lng: coord[0] });
                });
            }
        });

        return {
            path: pathCoordinates,
            totalDistance,
            totalTime,
            tbtList
        };
    } catch (error) {
        console.error('보행자 경로 탐색 API 호출 실패:', error);
        throw error;
    }
};