import { useState } from 'react';
import { X } from 'lucide-react';
import { COLORS } from '../../styles/colors';
import NaverPanorama from './NaverPanorama';

export default function RoadviewModal({ point, onClose }) {
  const [photoDate, setPhotoDate] = useState(null);
  if (!point) return null;

  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/40">
      <div className="rounded-2xl shadow-xl relative overflow-hidden bg-white mx-6"
        style={{ width: '420px', maxWidth: 'calc(100% - 32px)' }}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: COLORS.warning }}>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {point.type || '위험 구간'}
            </p>
            {point.detail && (
              <p className="text-xs text-white/90 truncate">{point.detail}</p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 ml-2">
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* 거리뷰 */}
        <NaverPanorama lat={point.lat} lng={point.lng}
          onPhotoDate={setPhotoDate}
          style={{ width: '100%', height: '300px' }} />

        {/* 안내 푸터 */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 leading-snug">
            ※ 거리뷰 과거 이미지로 제보 시점과 다를 수 있습니다
            {photoDate && (
              <>
                <span className="mx-1 text-gray-300">·</span>
                <span className="text-gray-500 font-medium">촬영 {photoDate}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
