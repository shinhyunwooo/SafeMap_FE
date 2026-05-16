import axios from 'axios';

// 1. Axios 기본 인스턴스 세팅
const apiClient = axios.create({
    // Vite에서는 process.env 대신 import.meta.env를 사용합니다.
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. SafeMap 안전 경로 탐색 API 호출 함수
export const fetchSafeRoute = async ({ startLat, startLng, endLat, endLng, persona, requestHour }) => {
    try {
        // 백엔드가 요구하는 Request Body 규격에 맞춰서 데이터 조립
        const payload = {
            start_lat: startLat,
            start_lng: startLng,
            end_lat: endLat,
            end_lng: endLng,
            persona: persona,
            request_hour: requestHour
        };

        const response = await apiClient.post('/api/routes/safe-path', payload);

        // 성공 시 백엔드에서 준 데이터 반환 (status, geojson, route_analysis 등)
        return response.data;
    } catch (error) {
        console.error(' 경로 탐색 API 호출 실패:', error);
        throw error;
    }
};