import { X, Megaphone, Clock } from 'lucide-react';
import { COLORS } from '../../styles/colors';

/**
 * 기존 사용자 제보 마커 클릭 시 상세 보기.
 * props: report {categories, intensity, memo, created_at}, onClose()
 */
export default function ReportDetailModal({ report, onClose }) {
  if (!report) return null;
  const date = report.created_at ? report.created_at.slice(0, 10).replace(/-/g, '.') : '';
  const intensity = report.intensity ?? 0;
  const cats = report.categories ?? [];
  // 헤드라인: '기타' 직접입력 문구 > 선택한 유형 요약 > 기본값
  const headline = (report.etc_text && report.etc_text.trim())
    ? report.etc_text.trim()
    : (cats.length ? cats.join(' · ') : '사용자 제보');
  // 강도에 따른 색 (0~3 노랑 / 4~5 주황 / 6~8 빨강)
  const barColor = intensity >= 6 ? COLORS.danger : intensity >= 4 ? COLORS.warning : COLORS.caution;

  return (
    <div className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: COLORS.warning }}>
              <Megaphone size={16} color="white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 leading-none mb-0.5">사용자 제보</p>
              <h2 className="text-base font-extrabold text-gray-900 truncate">{headline}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 유형 */}
          <div className="flex flex-wrap gap-2">
            {cats.map(c => (
              <span key={c} className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: COLORS.warn_light, color: '#EA580C' }}>
                {c}
              </span>
            ))}
          </div>

          {/* 체감 강도 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-700">체감 위험 강도</span>
              <span className="text-xs font-bold" style={{ color: barColor }}>{intensity} / 8</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(intensity / 8) * 100}%`, backgroundColor: barColor }} />
            </div>
          </div>

          {/* 메모 */}
          {report.memo && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
              <p className="text-sm text-gray-700 leading-relaxed">{report.memo}</p>
            </div>
          )}

          {/* 날짜 + 안내 */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={12} /> {date} 제보됨
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            ※ 사용자 제보는 참고 정보이며, 안전 경로 위험도 계산에는 반영되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
