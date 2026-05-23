import { useState, useRef } from 'react';
import { fetchSafeRoute } from './services/routeService';
import { fetchTmapPedestrianRoute, fetchNearbyPolice, fetchNearbyCCTV, fetchNearbyEmergency } from './services/tmapService';
import TmapView from './components/map/TmapView';
import LocationSearch from './components/route/LocationSearch';
import ControlPanel from './components/route/ControlPanel';
import { COLORS, BADGE_STYLES, getRouteBadgeType } from './styles/colors';
import { RotateCcw, Shield, ChevronUp, ChevronDown } from 'lucide-react';

const PERSONA_LABEL = {
  general: { text: '일반',     color: COLORS.safe },
  women:   { text: '여성 안심', color: COLORS.primary },
  senior:  { text: '노약자',   color: COLORS.warning },
};

const FILTERS = [
  { id: 'cctv',      label: 'CCTV',    color: '#3B82F6' },
  { id: 'emergency', label: '응급기관', color: '#EF4444' },
  { id: 'police',    label: '경찰서',   color: '#1E3A8A' },
  //{ id: 'danger',    label: '위험 범역', color: '#FB923C' },
];

function App() {
  const [isLoading,      setIsLoading]      = useState(false);
  const [routeData,      setRouteData]      = useState(null);
  const [tmapRouteData,  setTmapRouteData]  = useState(null);
  const [policeStations, setPoliceStations] = useState([]);
  const [cctvList,       setCctvList]       = useState([]);
  const [emergencyList,  setEmergencyList]  = useState([]);
  const [dangerZones,    setDangerZones]    = useState([]);
  const [activeFilters,  setActiveFilters]  = useState([]);
  const [persona,        setPersona]        = useState('general');
  const [requestHour,    setRequestHour]    = useState(new Date().getHours());
  const [points,         setPoints]         = useState({ start: null, end: null });
  const [bottomOpen,     setBottomOpen]     = useState(false);
  const [showResult,     setShowResult]     = useState(false);
  const clickLockRef = useRef(0);

  const handleMapClick = (latlng) => {
    const now = Date.now();
    if (now - clickLockRef.current < 400) return;
    clickLockRef.current = now;
    setPoints((prev) => {
      if (!prev.start) return { start: latlng, end: null };
      if (!prev.end)   return { ...prev, end: latlng };
      setRouteData(null); setTmapRouteData(null);
      setPoliceStations([]); setCctvList([]); setEmergencyList([]); setDangerZones([]);
      setActiveFilters([]);
      return { start: latlng, end: null };
    });
  };

  const handleSearch = async () => {
    if (!points.start || !points.end) { alert("출발지와 도착지를 모두 설정해주세요."); return; }
    setIsLoading(true);
    try {
      const [safeResult, tmapResult] = await Promise.all([
        fetchSafeRoute({
          startLat: points.start.lat, startLng: points.start.lng,
          endLat: points.end.lat,     endLng: points.end.lng,
          persona, requestHour
        }),
        fetchTmapPedestrianRoute({
          startLat: points.start.lat, startLng: points.start.lng,
          endLat: points.end.lat,     endLng: points.end.lng,
        })
      ]);
      setRouteData(safeResult);
      setTmapRouteData(tmapResult);
      setShowResult(true);
      setBottomOpen(true);
      // 필터 켜져있으면 위험범역 데이터 갱신
      if (activeFilters.includes('danger')) {
        const markers = safeResult?.route_analysis?.markers ?? [];
        setDangerZones(markers.filter(m => m.lat && m.lng));
      }
    } catch {
      alert("경로 탐색에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 기준 좌표 계산 (경로 중앙 or 출발지)
  const getSearchCoord = (safeResult = routeData) => {
    const baseLat = points.start?.lat ?? 37.5665;
    const baseLng = points.start?.lng ?? 126.9780;
    if (safeResult?.geojson?.geometry?.coordinates) {
      const geo  = safeResult.geojson.geometry;
      const flat = geo.type === 'MultiLineString' ? geo.coordinates.flat() : geo.coordinates;
      if (flat.length > 0) {
        const mid = flat[Math.floor(flat.length / 2)];
        return { lat: mid[1], lng: mid[0] };
      }
    }
    return { lat: baseLat, lng: baseLng };
  };

  const handleFilterToggle = async (filterId) => {
    const isActive = activeFilters.includes(filterId);
    if (isActive) {
      setActiveFilters(prev => prev.filter(f => f !== filterId));
      if (filterId === 'police')    setPoliceStations([]);
      if (filterId === 'cctv')      setCctvList([]);
      if (filterId === 'emergency') setEmergencyList([]);
      if (filterId === 'danger')    setDangerZones([]);
      return;
    }
    setActiveFilters(prev => [...prev, filterId]);
    const { lat, lng } = getSearchCoord();
    if (filterId === 'police') {
      const data = await fetchNearbyPolice(lat, lng);
      setPoliceStations(data);
    }
    if (filterId === 'cctv') {
      const data = await fetchNearbyCCTV(lat, lng);
      setCctvList(data);
    }
    if (filterId === 'emergency') {
      const data = await fetchNearbyEmergency(lat, lng);
      setEmergencyList(data);
    }
    if (filterId === 'danger') {
      const markers = routeData?.route_analysis?.markers ?? [];
      setDangerZones(markers.filter(m => m.lat && m.lng));
    }
  };

  const handleReset = () => {
    setPoints({ start: null, end: null });
    setRouteData(null); setTmapRouteData(null);
    setPoliceStations([]); setCctvList([]); setEmergencyList([]); setDangerZones([]);
    setActiveFilters([]); setShowResult(false); setBottomOpen(false);
  };

  const Badge = ({ type }) => {
    const s = BADGE_STYLES[type] ?? BADGE_STYLES.safe;
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.text }} />
        {s.label}
      </span>
    );
  };

  const FilterChips = () => (
    <div className="flex gap-2 flex-wrap">
      {FILTERS.map(f => {
        const isOn = activeFilters.includes(f.id);
        return (
          <button key={f.id} onClick={() => handleFilterToggle(f.id)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={isOn
              ? { backgroundColor: f.color, color: 'white', borderColor: f.color }
              : { backgroundColor: 'white', color: '#6B7280', borderColor: '#D1D5DB' }
            }>
            {f.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row"
      style={{ backgroundColor: COLORS.primary_light }}>

      {/* ══════════════════════════════
          데스크탑 왼쪽 패널
      ══════════════════════════════ */}
      <div className="hidden md:flex flex-col w-[400px] min-w-[360px] h-full bg-white shadow-xl z-10 overflow-y-auto">

        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.primary }}>
              <Shield size={16} color="white" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">SafeMap</h1>
          </div>
          <p className="text-xs text-gray-400">안전한 보행 경로 안내 서비스</p>
        </div>

        {/* 검색 */}
        <div className="px-6 py-4 space-y-3 border-b border-gray-100">
          <LocationSearch label="출발지" placeholder="예: 광화문역"
            onSelect={(p) => setPoints(prev => ({ ...prev, start: p }))} />
          <LocationSearch label="도착지" placeholder="예: 종각역"
            onSelect={(p) => setPoints(prev => ({ ...prev, end: p }))} />
        </div>

        {/* 필터 칩 */}
        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-2">지도 레이어</p>
          <FilterChips />
        </div>

        {/* 페르소나 + 시간 */}
        <div className="px-6 py-4 border-b border-gray-100">
          <ControlPanel persona={persona} setPersona={setPersona}
            requestHour={requestHour} setRequestHour={setRequestHour} />
        </div>

        {/* 버튼 */}
        <div className="px-6 py-4 flex flex-col gap-2">
          <button onClick={handleSearch}
            disabled={isLoading || !points.start || !points.end}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all"
            style={{ backgroundColor: (!points.start || !points.end) ? '#CBD5E1' : COLORS.primary }}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                탐색 중...
              </span>
            ) : '안전 경로 탐색'}
          </button>
          <button onClick={handleReset}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600">
            <RotateCcw size={14} className="inline mr-1" />초기화
          </button>
        </div>

        {/* 경로 결과 */}
        {showResult && routeData && tmapRouteData && (
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-gray-800">경로를 탐색하였습니다</span>
              <span className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: '#F7F7F7', color: '#5D5D5D' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.safe }} />
                탐색 완료
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {points.end?.name ?? '목적지'}까지 • {Math.round(routeData.total_distance_meters)}m
            </p>

            {/* 안심 경로 카드 */}
            <div className="rounded-2xl p-4 mb-3 border-2"
              style={{ backgroundColor: COLORS.primary_light, borderColor: COLORS.primary }}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">안심 경로</span>
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: COLORS.primary }}>추천</span>
                </div>
                <span className="text-base font-bold text-gray-800">
                  {Math.round(routeData.total_distance_meters)}m
                </span>
              </div>
              <div className="mb-3"><Badge type={getRouteBadgeType(routeData?.route_analysis?.scores)} /></div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {routeData.route_analysis?.summary}
              </p>
            </div>

            {/* 일반 최단 경로 카드 */}
            <div className="rounded-2xl p-4 mb-4 border border-gray-200 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-gray-800">일반 최단 경로</span>
                <span className="text-base font-bold text-gray-800">
                  {tmapRouteData.totalDistance}m
                </span>
              </div>
              <Badge type="danger" />
            </div>

            {/* TBT 상세 안내 */}
            {tmapRouteData?.tbtList?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">상세 경로 안내</p>
                <ul className="space-y-3 border-l-2 ml-2"
                  style={{ borderColor: COLORS.primary_light }}>
                  {tmapRouteData.tbtList.map((tbt, i) => (
                    <li key={i} className="pl-4 relative">
                      <span className="absolute -left-[7px] top-1 w-3 h-3 bg-white border-2 rounded-full"
                        style={{ borderColor: COLORS.primary }} />
                      <p className="text-xs text-gray-700">{tbt.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════
          지도 영역
      ══════════════════════════════ */}
      <div className="flex-1 relative h-full">
        <TmapView
          startCoord={points.start} endCoord={points.end}
          routeData={routeData} tmapRouteData={tmapRouteData}
          policeStations={policeStations}
          cctvList={cctvList}
          emergencyList={emergencyList}
          dangerZones={dangerZones}
          onMapClick={handleMapClick}
        />

        {/* 모바일 상단 바 */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-[1000] px-4 pt-4">
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-lg">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: COLORS.primary }}>
              <Shield size={12} color="white" />
            </div>
            <span className="text-sm font-bold" style={{ color: COLORS.primary }}>SafeMap</span>
            <div className="flex-1" />
            <button onClick={handleReset}>
              <RotateCcw size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 모바일 하단 패널 */}
        <div className={`md:hidden absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ${bottomOpen ? 'max-h-[82vh]' : 'max-h-[56px]'} overflow-hidden`}>
          <div className="flex flex-col items-center pt-3 pb-1 cursor-pointer"
            onClick={() => setBottomOpen(v => !v)}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mb-1" />
            {bottomOpen
              ? <ChevronDown size={16} className="text-gray-400" />
              : <ChevronUp size={16} className="text-gray-400" />}
          </div>

          <div className="px-4 pb-6 overflow-y-auto max-h-[calc(82vh-48px)]">

            {/* 검색 */}
            <div className="space-y-2 mb-3">
              <LocationSearch label="출발지" placeholder="예: 광화문역"
                onSelect={(p) => setPoints(prev => ({ ...prev, start: p }))} />
              <LocationSearch label="도착지" placeholder="예: 종각역"
                onSelect={(p) => setPoints(prev => ({ ...prev, end: p }))} />
            </div>

            {/* 필터 칩 */}
            <div className="mb-3">
              <p className="text-xs text-gray-400 font-medium mb-2">지도 레이어</p>
              <FilterChips />
            </div>

            {/* 페르소나 칩 */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {Object.entries(PERSONA_LABEL).map(([key, val]) => (
                <button key={key} onClick={() => setPersona(key)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={persona === key
                    ? { backgroundColor: val.color, color: 'white', borderColor: val.color }
                    : { backgroundColor: 'white', color: '#6B7280', borderColor: '#D1D5DB' }}>
                  {val.text}
                </button>
              ))}
            </div>

            {/* 시간 슬라이더 */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>출발 시간</span>
                <span className="font-bold" style={{ color: COLORS.primary }}>{requestHour}시</span>
              </div>
              <input type="range" min="0" max="23" value={requestHour}
                onChange={(e) => setRequestHour(parseInt(e.target.value))}
                className="w-full accent-blue-600" />
            </div>

            {/* 탐색 + 초기화 버튼 */}
            <div className="flex gap-2 mb-4">
              <button onClick={handleSearch}
                disabled={isLoading || !points.start || !points.end}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-bold"
                style={{ backgroundColor: (!points.start || !points.end) ? '#CBD5E1' : COLORS.primary }}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-1">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    탐색 중...
                  </span>
                ) : '경로 탐색'}
              </button>
              <button onClick={handleReset}
                className="px-4 py-3 rounded-2xl text-sm bg-gray-100 text-gray-500">
                <RotateCcw size={14} />
              </button>
            </div>

            {/* 모바일 결과 */}
            {showResult && routeData && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">경로를 탐색하였습니다</span>
                  <span className="text-xs flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.safe }} />
                    탐색 완료
                  </span>
                </div>
                <div className="rounded-2xl p-4 mb-2 border-2"
                  style={{ backgroundColor: COLORS.primary_light, borderColor: COLORS.primary }}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">안심 경로</span>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: COLORS.primary }}>추천</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      {Math.round(routeData.total_distance_meters)}m
                    </span>
                  </div>
                  <div className="mb-2"><Badge type={getRouteBadgeType(routeData?.route_analysis?.scores)} /></div>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {routeData.route_analysis?.summary}
                  </p>
                </div>
                {tmapRouteData && (
                  <div className="rounded-2xl p-4 mb-2 border border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-800">일반 최단 경로</span>
                      <span className="text-sm font-bold text-gray-800">
                        {tmapRouteData.totalDistance}m
                      </span>
                    </div>
                  </div>
                )}
                {/* ← 여기 추가: 모바일 상세 경로 안내 */}
                {tmapRouteData?.tbtList?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-700 mb-2">상세 경로 안내</p>
                    <ul className="space-y-3 border-l-2 ml-2"
                      style={{ borderColor: COLORS.primary_light }}>
                      {tmapRouteData.tbtList.map((tbt, i) => (
                        <li key={i} className="pl-4 relative">
                          <span className="absolute -left-[7px] top-1 w-3 h-3 bg-white border-2 rounded-full"
                            style={{ borderColor: COLORS.primary }} />
                          <p className="text-xs text-gray-700">{tbt.description}</p>
                      </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;