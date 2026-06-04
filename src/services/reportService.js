import axios from 'axios';

// 백엔드 제보 API 클라이언트 (routeService와 동일한 베이스 사용)
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// 제보 유형 7종 (백엔드 REPORT_CATEGORIES와 반드시 일치)
export const REPORT_CATEGORIES = [
    '도로 파손',
    '어두운 골목',
    '가로등/조도 불량',
    '공사 중',
    'CCTV 사각지대',
    '경사도',
    '기타',
];

// 1. 제보 등록 (실시간 DB 반영)
export const createReport = async ({ lat, lng, categories, intensity, memo, etcText }) => {
    const payload = {
        lat, lng, categories, intensity,
        memo: memo || null,
        etc_text: etcText || null, // '기타' 선택 시 직접 입력 문구
    };
    const { data } = await apiClient.post('/api/reports', payload);
    return data.data; // {id, lat, lng, categories, intensity, memo, etc_text, created_at}
};

// 2. 제보 조회 (지도 마커용). 좌표 주면 반경 필터.
export const fetchReports = async ({ lat, lng, radius = 1500 } = {}) => {
    const params = lat != null && lng != null ? { lat, lng, radius } : {};
    const { data } = await apiClient.get('/api/reports', { params });
    return data.data ?? [];
};
