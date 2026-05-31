import { X } from 'lucide-react'
import dangerIcon from '../../assets/icons/danger-icon.svg'

export default function DangerModal({ onClose }) {
  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/20">
      <div
        className="rounded-2xl mx-8 shadow-xl relative overflow-hidden"
        style={{ backgroundColor: '#FEF2F2', width: '270px' }}
      >
        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10">
          <X size={18} style={{ color: '#4A5565' }} />
        </button>

        {/* 상단 - 아이콘 + 제목 */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6">
          <img src={dangerIcon} alt="위험" className="w-16 h-16 mb-4" />
          <p className="text-lg font-bold" style={{ color: '#EF4444' }}>
            위험 구간
          </p>
        </div>

        {/* 구분선 */}
        <div className="w-full h-px bg-gray-200" />

        {/* 하단 - 설명 */}
        <div className="px-6 py-4">
          <p className="text-sm text-center" style={{ color: '#4A5565' }}>
            조명이 어두운 지역입니다. 주의하세요.
          </p>
        </div>
      </div>
    </div>
  )
}