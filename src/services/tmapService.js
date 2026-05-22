import axios from 'axios';

const TMAP_APP_KEY = import.meta.env.VITE_TMAP_APP_KEY || '발급받은_앱키를_입력하세요';

const tmapClient = axios.create({
    baseURL: 'https://apis.openapi.sk.com/tmap',
    headers: {
        appKey: TMAP_APP_KEY,
    },
});

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

            if (geometry.type === 'Point' && properties.description) {
                tbtList.push({
                    description: properties.description,
                    turnType: properties.turnType,
                    pointIndex: properties.pointIndex
                });
            }

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
/**
 * 특정 좌표 반경 1km 이내의 경찰서/파출소 데이터를 가져옵니다. (노이즈 필터링 적용)
 */
export const fetchNearbyPolice = async (lat, lng) => {
    try {
        const keywords = ['경찰서', '파출소', '치안센터'];
        const requests = keywords.map(keyword =>
            tmapClient.get('/pois', {
                params: {
                    version: 1,
                    searchKeyword: keyword,
                    searchtypCd: "R", // 🚨 수정됨: 대문자 T가 아닌 소문자 t (searchtypCd)
                    radius: 1,        // 반경 1km
                    centerLon: lng.toString(),
                    centerLat: lat.toString(),
                    resCoordType: "WGS84GEO",
                    reqCoordType: "WGS84GEO",
                    count: 15         // 여유 있게 검색
                }
            })
        );

        const responses = await Promise.all(requests);
        const policeData = [];

        // 🚨 수정됨: /g 플래그 제거 (건너뛰기 버그 방지)
        const noiseFilter = /화장실|식당|구내|어린이집|주차장|창고|휴게실|민원실|경비|수사대/;

        responses.forEach(res => {
            if (res.data?.searchPoiInfo?.pois?.poi) {
                res.data.searchPoiInfo.pois.poi.forEach(p => {
                    // 이름에 노이즈 키워드가 없으면(false) 배열에 추가
                    if (!noiseFilter.test(p.name)) {
                        policeData.push({
                            name: p.name,
                            lat: Number(p.noorLat),
                            lng: Number(p.noorLon),
                        });
                    }
                });
            }
        });

        // 중복 데이터 제거 (이름 기준)
        const uniquePolice = Array.from(new Set(policeData.map(a => a.name)))
            .map(name => policeData.find(a => a.name === name));

        return uniquePolice;
    } catch (error) {
        console.error('경찰서 반경 검색 실패:', error);
        return [];
    }
};