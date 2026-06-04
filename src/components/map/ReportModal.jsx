import { useState } from 'react';
import { X, MapPin, Crosshair, Megaphone } from 'lucide-react';
import { COLORS } from '../../styles/colors';
import { REPORT_CATEGORIES, createReport } from '../../services/reportService';

/**
 * 위험 요소 제보 모달 (피그마 "우리 동네 위험 제보" 화면 기반)
 * - 유형 7종 복수 선택, 체감 위험 강도(0~8), 한마디(선택)
 * - 위치: 현재 위치 / 지도에서 직접 선택
 * props:
 *   draftPoint {lat,lng}|null  - 선택된 제보 위치(부모가 지도탭/GPS로 갱신)
 *   onPickOnMap()              - 지도에서 위치 선택 모드 진입
 *   onUseCurrentLocation()     - 현재 위치(GPS)로 설정
 *   onSubmitted(report)        - 등록 성공 콜백(마커 추가용)
 *   onClose()
 */
export default function ReportModal({ draftPoint, onPickOnMap, onUseCurrentLocation, onSubmitted, onClose }) {
  const [categories, setCategories] = useState([]);
  const [intensity, setIntensity]   = useState(4);
  const [memo, setMemo]             = useState('');
  const [etcText, setEtcText]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEtc = categories.includes('기타');

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  const toggleCategory = (c) =>
    setCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const handleSubmit = async () => {
    if (!draftPoint) { alert('제보 위치를 먼저 지정해주세요.'); return; }
    if (categories.length === 0) { alert('위험 유형을 1개 이상 선택해주세요.'); return; }
    if (isEtc && !etcText.trim()) { alert("'기타' 유형의 내용을 입력해주세요."); return; }
    setSubmitting(true);
    try {
      const saved = await createReport({
        lat: draftPoint.lat, lng: draftPoint.lng,
        categories, intensity, memo,
        etcText: isEtc ? etcText.trim() : '',
      });
      onSubmitted?.(saved);
      onClose?.();
    } catch (e) {
      console.error('제보 등록 실패:', e);
      alert('제보 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.danger }}>
              <Megaphone size={16} color="white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">위험 요소 제보하기</h2>
              <p className="text-[11px] text-gray-400">우리 동네 위험을 함께 알려주세요</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* 제보 날짜 */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-1.5">제보 날짜</p>
            <div className="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-sm text-gray-500 border border-gray-200">
              {today}
            </div>
          </div>

          {/* 위치 */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-1.5">위치</p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 mb-2">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-600 truncate">
                {draftPoint
                  ? `${draftPoint.lat.toFixed(5)}, ${draftPoint.lng.toFixed(5)}`
                  : '위치를 지정해주세요'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={onUseCurrentLocation}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <Crosshair size={14} /> 현재 위치
              </button>
              <button onClick={onPickOnMap}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors"
                style={{ borderColor: COLORS.primary, color: COLORS.primary }}>
                <MapPin size={14} /> 지도에서 선택
              </button>
            </div>
          </div>

          {/* 유형 선택 (7종 복수) */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">유형 선택 <span className="text-gray-400 font-normal">(복수 선택)</span></p>
            <div className="flex flex-wrap gap-2">
              {REPORT_CATEGORIES.map(c => {
                const on = categories.includes(c);
                return (
                  <button key={c} onClick={() => toggleCategory(c)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={on
                      ? { backgroundColor: COLORS.primary, color: 'white', borderColor: COLORS.primary }
                      : { backgroundColor: 'white', color: '#6B7280', borderColor: '#D1D5DB' }}>
                    {c}
                  </button>
                );
              })}
            </div>

            {/* '기타' 직접 입력 — 제보 제목으로 사용됨 */}
            {isEtc && (
              <input
                type="text"
                value={etcText}
                onChange={(e) => setEtcText(e.target.value)}
                maxLength={30}
                placeholder="어떤 위험인지 직접 적어주세요 (제목으로 표시돼요)"
                className="mt-2 w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-blue-400"
              />
            )}
          </div>

          {/* 체감 위험 강도 0~8 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-gray-700">체감 위험 강도</p>
              <span className="text-xs font-bold" style={{ color: COLORS.danger }}>{intensity}</span>
            </div>
            <input type="range" min="0" max="8" value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full accent-red-500" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>0</span><span>4</span><span>8</span>
            </div>
          </div>

          {/* 한마디 */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-1.5">한마디 <span className="text-gray-400 font-normal">(선택)</span></p>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3}
              maxLength={200}
              placeholder='예: "가로등이 고장나서 골목이 너무 어두워요", "보도블록이 깨져 유모차가 지나가기 힘들어요" 등 불편한 점을 자유롭게 적어주세요.'
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none focus:border-blue-400" />
          </div>
        </div>

        {/* 제출 */}
        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100">
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all"
            style={{ backgroundColor: submitting ? '#93C5FD' : COLORS.primary }}>
            {submitting ? '제출 중...' : '제출하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
