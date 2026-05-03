import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SafeMap from '../components/map/SafeMap'
import RouteLayer from '../components/map/RouteLayer'
import NavHeader from '../components/navigation/NavHeader'
import NavBottom from '../components/navigation/NavBottom'
import DangerModal from '../components/navigation/DangerModal'

// 시뮬레이션용 단계 데이터
const NAV_STEPS = [
  { type: 'destination', label: '광운대학교', status: 'safe',    remainMinutes: 7, progress: 10 },
  { type: 'straight',    label: '직진',       status: 'safe',    remainMinutes: 7, progress: 30 },
  { type: 'right',       label: '우회전',     status: 'caution', remainMinutes: 4, progress: 55 },
  { type: 'straight',    label: '목적지 근접', status: 'danger',  remainMinutes: 1, progress: 85 },
]

export default function NavigationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const destination = location.state?.destination

  const [stepIndex, setStepIndex]       = useState(0)
  const [showDanger, setShowDanger]     = useState(false)
  const [prevStatus, setPrevStatus]     = useState('safe')

  const step = NAV_STEPS[stepIndex]

  // 위험 구간 진입 시 모달 표시
  useEffect(() => {
    if (step.status === 'danger' && prevStatus !== 'danger') {
      setShowDanger(true)
    }
    setPrevStatus(step.status)
  }, [stepIndex])

  // 다음 단계 (테스트용 - 실제로는 GPS 기반)
  const handleNext = () => {
    if (stepIndex < NAV_STEPS.length - 1) {
      setStepIndex((prev) => prev + 1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="relative w-full h-full">

      {/* 지도 배경 */}
      <div className="absolute inset-0">
        <SafeMap>
          <RouteLayer />
        </SafeMap>
      </div>

      {/* 상단 헤더 */}
      <NavHeader
        type={step.type}
        label={step.type === 'destination'
          ? (destination?.name ?? '광운대학교')
          : step.label
        }
        distance={step.type !== 'destination' ? '10m' : undefined}
      />

      {/* 하단 패널 */}
      <NavBottom
        remainMinutes={step.remainMinutes}
        status={step.status}
        progress={step.progress}
      />

      {/* 위험 구간 모달 */}
      {showDanger && (
        <DangerModal onClose={() => setShowDanger(false)} />
      )}

      {/* 테스트용 다음 단계 버튼 */}
      <button
        onClick={handleNext}
        className="absolute bottom-48 right-4 z-[1000]
          w-11 h-11 bg-white rounded-full shadow-lg
          flex items-center justify-center text-xl"
      >
        ▶
      </button>

    </div>
  )
}