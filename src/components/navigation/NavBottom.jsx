const STATUS = {
  safe:    { text: '안전 구간에 진입하였습니다.', color: '#22C55E', bg: '#F0FDF4' },
  caution: { text: '주의 구간에 진입하였습니다.', color: '#FACC15', bg: '#FFFDE7' },
  danger:  { text: '위험 구간에 진입하였습니다.', color: '#EF4444', bg: '#FFEBEB' },
}

export default function NavBottom({ remainMinutes = 7, status = 'safe', progress = 60 }) {
  const s = STATUS[status]

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl px-5 pt-4 pb-8 shadow-2xl">
      {/* 핸들 */}
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

      {/* 남은 시간 */}
      <p className="text-xs text-gray-400 mb-1">남은 시간</p>
      <p className="text-4xl font-bold text-gray-800 mb-3">{remainMinutes}분</p>

      {/* 진행 바 */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            backgroundColor: s.color,
          }}
        />
      </div>

      {/* 현재 구간 상태 */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ backgroundColor: s.bg }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
        <span className="text-sm" style={{ color: s.color }}>{s.text}</span>
      </div>
    </div>
  )
}