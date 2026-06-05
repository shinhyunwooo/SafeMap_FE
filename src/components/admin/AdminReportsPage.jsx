import { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, Eye, EyeOff, Trash2, LogOut, Clock, AlertCircle } from 'lucide-react';
import { COLORS } from '../../styles/colors';
import { adminFetchReports, adminSetReportStatus, adminDeleteReport } from '../../services/adminService';

const KEY_STORAGE = 'safemap_admin_key';

/**
 * 관리자 제보 감독 페이지 (?admin=1 진입)
 * - 키 인증 후 전체 제보(숨김 포함) 목록 표시
 * - 숨김/복구(소프트 삭제) + 영구 삭제
 */
export default function AdminReportsPage({ onExit }) {
  const [keyInput, setKeyInput] = useState('');
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem(KEY_STORAGE) || '');
  const [authed, setAuthed]     = useState(false);
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [busyId, setBusyId]     = useState(null);

  const load = useCallback(async (key) => {
    setLoading(true); setError('');
    try {
      const data = await adminFetchReports(key);
      setReports(data);
      setAuthed(true);
      setAdminKey(key);
      localStorage.setItem(KEY_STORAGE, key);
    } catch (e) {
      if (e?.response?.status === 401) setError('관리자 키가 올바르지 않습니다.');
      else setError('목록을 불러오지 못했습니다. 서버 상태를 확인하세요.');
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // 저장된 키가 있으면 자동 로그인 시도
  useEffect(() => { if (adminKey) load(adminKey); /* eslint-disable-next-line */ }, []);

  const handleLogin = (e) => { e.preventDefault(); if (keyInput.trim()) load(keyInput.trim()); };

  const handleToggle = async (r) => {
    const next = r.status === 'visible' ? 'hidden' : 'visible';
    setBusyId(r.id);
    try {
      await adminSetReportStatus(r.id, next, adminKey);
      setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: next } : x));
    } catch { alert('상태 변경 실패'); }
    finally { setBusyId(null); }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`제보 #${r.id}를 영구 삭제할까요? (복구 불가)`)) return;
    setBusyId(r.id);
    try {
      await adminDeleteReport(r.id, adminKey);
      setReports(prev => prev.filter(x => x.id !== r.id));
    } catch { alert('삭제 실패'); }
    finally { setBusyId(null); }
  };

  const handleLogout = () => {
    localStorage.removeItem(KEY_STORAGE);
    setAdminKey(''); setAuthed(false); setReports([]); setKeyInput('');
  };

  // ── 로그인 화면 ──
  if (!authed) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleLogin}
          className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.primary }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900">제보 감독 콘솔</h1>
              <p className="text-xs text-gray-400">관리자 키를 입력하세요</p>
            </div>
          </div>
          <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
            placeholder="관리자 키"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-blue-400" />
          {error && (
            <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle size={13} /> {error}</p>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{ backgroundColor: loading ? '#93C5FD' : COLORS.primary }}>
            {loading ? '확인 중...' : '입장'}
          </button>
          <button type="button" onClick={onExit}
            className="w-full text-xs text-gray-400 hover:text-gray-600">← 지도로 돌아가기</button>
        </form>
      </div>
    );
  }

  // ── 통계 ──
  const total = reports.length;
  const hidden = reports.filter(r => r.status === 'hidden').length;
  const visible = total - hidden;

  const fmtDate = (s) => s ? s.slice(0, 16).replace('T', ' ') : '';
  const headlineOf = (r) =>
    (r.etc_text && r.etc_text.trim()) ? r.etc_text.trim()
      : (r.categories?.length ? r.categories.join(' · ') : '사용자 제보');

  // ── 목록 화면 ──
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
            <Shield size={16} color="white" />
          </div>
          <h1 className="text-base font-extrabold text-gray-900">제보 감독 콘솔</h1>
          <span className="ml-2 text-xs text-gray-400">
            전체 {total} · <span className="text-green-600">노출 {visible}</span> · <span className="text-gray-500">숨김 {hidden}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(adminKey)} disabled={loading}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>
          <button onClick={onExit}
            className="text-xs font-medium text-gray-600 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">지도</button>
          <button onClick={handleLogout}
            className="flex items-center gap-1 text-xs font-medium text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50">
            <LogOut size={13} /> 로그아웃
          </button>
        </div>
      </header>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        {reports.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-20">제보가 없습니다.</p>
        ) : (
          <div className="max-w-3xl mx-auto space-y-2.5">
            {reports.map(r => {
              const isHidden = r.status === 'hidden';
              return (
                <div key={r.id}
                  className={`bg-white rounded-2xl border px-4 py-3 flex items-start gap-3 transition-opacity ${isHidden ? 'opacity-60 border-gray-200' : 'border-gray-100'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-gray-300">#{r.id}</span>
                      <h3 className="text-sm font-bold text-gray-900 truncate">{headlineOf(r)}</h3>
                      {isHidden && (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">숨김</span>
                      )}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: r.intensity >= 6 ? COLORS.danger : r.intensity >= 4 ? COLORS.warning : COLORS.caution }}>
                        강도 {r.intensity}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(r.categories ?? []).map(c => (
                        <span key={c} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">{c}</span>
                      ))}
                    </div>
                    {r.memo && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.memo}</p>}
                    <p className="flex items-center gap-1 text-[11px] text-gray-300 mt-1">
                      <Clock size={11} /> {fmtDate(r.created_at)} · {r.lat?.toFixed(4)}, {r.lng?.toFixed(4)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => handleToggle(r)} disabled={busyId === r.id}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                      style={isHidden
                        ? { backgroundColor: '#DCFCE7', color: '#16A34A' }
                        : { backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                      {isHidden ? <><Eye size={13} /> 복구</> : <><EyeOff size={13} /> 숨김</>}
                    </button>
                    <button onClick={() => handleDelete(r)} disabled={busyId === r.id}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50">
                      <Trash2 size={13} /> 삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
