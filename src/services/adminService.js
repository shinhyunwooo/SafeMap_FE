import axios from 'axios';

// 관리자(제보 감독) API 클라이언트
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

const authHeader = (key) => ({ headers: { 'X-Admin-Key': key } });

// 전체 제보 목록 (숨김 포함). 키 검증 겸용 — 401이면 인증 실패.
export const adminFetchReports = async (key) => {
    const { data } = await apiClient.get('/api/admin/reports', authHeader(key));
    return data.data ?? [];
};

// 노출 상태 변경 (visible ↔ hidden). 소프트 삭제 = 'hidden'.
export const adminSetReportStatus = async (id, status, key) => {
    const { data } = await apiClient.patch(`/api/admin/reports/${id}`, { status }, authHeader(key));
    return data.data;
};

// 영구 삭제 (복구 불가).
export const adminDeleteReport = async (id, key) => {
    const { data } = await apiClient.delete(`/api/admin/reports/${id}`, authHeader(key));
    return data.data;
};
