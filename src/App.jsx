import { useState, useRef, useEffect } from 'react';
import { fetchSafeRoute } from './services/routeService';
import { fetchTmapPedestrianRoute, fetchNearbyPolice, fetchNearbyCCTV, fetchNearbyEmergency, reverseGeocode } from './services/tmapService';
import { fetchReports } from './services/reportService';
import TmapView from './components/map/TmapView';
import RoadviewModal from './components/navigation/RoadviewModal';
import ReportModal from './components/map/ReportModal';
import ReportDetailModal from './components/map/ReportDetailModal';
import AdminReportsPage from './components/admin/AdminReportsPage';
import LocationSearch from './components/route/LocationSearch';
import ControlPanel from './components/route/ControlPanel';
import { COLORS, BADGE_STYLES, getRouteBadgeType } from './styles/colors';
import { RotateCcw, Shield, ChevronUp, ChevronDown, Navigation, Megaphone, Search, ArrowLeft } from 'lucide-react';

const PERSONA_LABEL = {
  general: { text: '일반',     color: COLORS.safe },
  women:   { text: '여성 안심', color: COLORS.primary },
  senior:  { text: '노약자',   color: COLORS.warning },
};

const FILTERS = [
  { id: 'cctv',      label: 'CCTV',    color: '#3B82F6' },
  { id: 'emergency', label: '응급기관', color: '#EF4444' },
  { id: 'police',    label: '경찰서',   color: '#1E3A8A' },
  //{ id: 'report',    label: '주민 제보', color: '#F97316' },
  //{ id: 'danger',    label: '위험 범역', color: '#FB923C' },
];

const SEGMENT_ORDER = [
  { key: 'safe',    color: COLORS.safe,    label: '안전' },
  { key: 'caution', color: COLORS.caution, label: '주의' },
  { key: 'warning', color: COLORS.warning, label: '경고' },
  { key: 'danger',  color: COLORS.danger,  label: '위험' },
];

function calcSegmentSequence(geojson) {
  if (geojson?.type !== 'FeatureCollection') return null;
  const valid = new Set(['safe', 'caution', 'warning', 'danger']);
  const segs = [];
  let total = 0;

  geojson.features.forEach(f => {
    const coords = f.geometry?.coordinates;
    const level = f.properties?.risk_level;
    if (!coords || coords.length < 2 || !valid.has(level)) return;

    let len = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const dlat = coords[i + 1][1] - coords[i][1];
      const dlng = (coords[i + 1][0] - coords[i][0]) * Math.cos(coords[i][1] * Math.PI / 180);
      len += Math.sqrt(dlat * dlat + dlng * dlng);
    }
    if (len === 0) return;
    total += len;

    // 연속된 같은 레벨은 합치기
    if (segs.length > 0 && segs[segs.length - 1].level === level) {
      segs[segs.length - 1].len += len;
    } else {
      segs.push({ level, len });
    }
  });

  if (total === 0 || segs.length === 0) return null;
  return segs.map(s => ({ level: s.level, pct: (s.len / total) * 100 }));
}

const walkingMins = (meters) => Math.ceil(meters / 67);
const fmtDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)}m`;

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

const SegmentBar = ({ geojson }) => {
  const seq = calcSegmentSequence(geojson);
  if (!seq) return null;

  const colorMap = { safe: COLORS.safe, caution: COLORS.caution, warning: COLORS.warning, danger: COLORS.danger };

  // 범례용 레벨별 합산 (경로 순서대로 등장한 레벨만)
  const totals = {};
  seq.forEach(s => { totals[s.level] = (totals[s.level] || 0) + s.pct; });
  const legend = SEGMENT_ORDER.filter(o => totals[o.key] != null);

  return (
    <div className="mt-2">
      <div className="flex h-2 rounded-full overflow-hidden">
        {seq.map((s, i) => (
          <div key={i} style={{ width: `${s.pct}%`, backgroundColor: colorMap[s.level] }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 mt-1.5">
        {legend.map(o => (
          <span key={o.key} className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: o.color }} />
            {o.label} {Math.round(totals[o.key])}%
          </span>
        ))}
      </div>
    </div>
  );
};

function App() {
  // 패널 리사이즈 상태
const [panelWidth, setPanelWidth] = useState(400);
const [isResizing, setIsResizing] = useState(false);
const resizeStartX = useRef(0);
const resizeStartWidth = useRef(0);

const handleResizeStart = (e) => {
  setIsResizing(true);
  resizeStartX.current = e.clientX;
  resizeStartWidth.current = panelWidth;
};

useEffect(() => {
  const handleResizeMove = (e) => {
    if (!isResizing) return;
    const diff = e.clientX - resizeStartX.current;
    const newWidth = Math.min(600, Math.max(300, resizeStartWidth.current + diff));
    setPanelWidth(newWidth);
  };
  const handleResizeEnd = () => setIsResizing(false);

  if (isResizing) {
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  }
  return () => {
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  };
}, [isResizing]);

useEffect(() => {
  window.dispatchEvent(new Event('resize'));
}, [panelWidth]);

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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userLocation,   setUserLocation]   = useState(null);
  const [locateTrigger,  setLocateTrigger]  = useState(0);
  const [isLocating,     setIsLocating]     = useState(false);
  const [showResult,     setShowResult]     = useState(false);
  const [showSafeTBT,    setShowSafeTBT]    = useState(false);
  const [showTmapTBT,    setShowTmapTBT]    = useState(false);
  const [highlightGeneralRoute, setHighlightGeneralRoute] = useState(false);
  const [roadviewPoint,  setRoadviewPoint]  = useState(null);
  // 제보 기능 상태
  const [reports,         setReports]         = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDraft,     setReportDraft]     = useState(null);   // {lat,lng}
  const [reportPickMode,  setReportPickMode]  = useState(false);
  const [selectedReport,  setSelectedReport]  = useState(null);
  const clickLockRef = useRef(0);
  const mobileSearchHistoryRef = useRef(false);
  const locateRequestRef = useRef(0);

  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    if (!mobileSearchHistoryRef.current) {
      window.history.pushState({ mobileSearchOpen: true }, '');
      mobileSearchHistoryRef.current = true;
    }
  };

  const closeMobileSearch = ({ syncHistory = true } = {}) => {
    setMobileSearchOpen(false);
    if (syncHistory && mobileSearchHistoryRef.current && window.history.state?.mobileSearchOpen) {
      mobileSearchHistoryRef.current = false;
      window.history.back();
      return;
    }
    mobileSearchHistoryRef.current = false;
  };

  useEffect(() => {
    const handlePopState = () => {
      if (mobileSearchHistoryRef.current) {
        mobileSearchHistoryRef.current = false;
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const resolveMapPoint = async (latlng) => {
    const name = await reverseGeocode(latlng.lat, latlng.lng);
    return { ...latlng, name };
  };

  const handleMapClick = async (latlng) => {
    if (mobileSearchOpen) {
      closeMobileSearch();
      return;
    }
    const now = Date.now();
    if (now - clickLockRef.current < 400) return;
    clickLockRef.current = now;
    const point = await resolveMapPoint(latlng);

    if (!points.start) {
      setPoints({ start: point, end: null });
      return;
    }

    if (!points.end) {
      setPoints(prev => ({ ...prev, end: point }));
      if (window.matchMedia('(max-width: 767px)').matches) {
        openMobileSearch();
      }
      return;
    }

    setRouteData(null); setTmapRouteData(null);
    setPoliceStations([]); setCctvList([]); setEmergencyList([]); setDangerZones([]);
    setActiveFilters([]);
    setPoints({ start: point, end: null });
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
      setShowSafeTBT(true);
      setShowTmapTBT(false);
      setHighlightGeneralRoute(false);
      setBottomOpen(true);
      closeMobileSearch();
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

  const toggleSafeRoute = () => {
    const next = !showSafeTBT;
    setShowSafeTBT(next);
    setShowTmapTBT(false);
    setHighlightGeneralRoute(false);
  };

  const toggleGeneralRoute = () => {
    const next = !showTmapTBT;
    setShowTmapTBT(next);
    setShowSafeTBT(false);
    setHighlightGeneralRoute(next);
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
      if (filterId === 'report')    setReports([]);
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
    if (filterId === 'report') {
      const data = await fetchReports({ lat, lng, radius: 1500 });
      setReports(data);
    }
  };

  // ── 제보 기능 핸들러 ──────────────────────────
  // 제보 버튼: 현재 위치를 기본 핀으로 잡고 모달 오픈
  const openReportModal = () => {
    setSelectedReport(null);
    setReportPickMode(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setReportDraft({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setReportDraft(prev => prev ?? getSearchCoord()),  // 거부 시 경로중심/기본
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setReportDraft(prev => prev ?? getSearchCoord());
    }
    setShowReportModal(true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { alert('위치 기능을 사용할 수 없습니다.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setReportDraft({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('위치 접근 권한이 필요합니다.'),
      { enableHighAccuracy: true }
    );
  };

  // "지도에서 선택" → 모달 잠시 숨기고 픽 모드 진입
  const handlePickOnMap = () => {
    setReportPickMode(true);
    setShowReportModal(false);
  };

  // 픽 모드에서 지도 탭 → 위치 확정 후 모달 복귀
  const handleReportPick = (latlng) => {
    setReportDraft(latlng);
    setReportPickMode(false);
    setShowReportModal(true);
  };

  // 등록 성공 → 즉시 마커 반영(+'주민 제보' 필터 자동 ON)
  const handleReportSubmitted = (saved) => {
    setReports(prev => [saved, ...prev]);
    setActiveFilters(prev => prev.includes('report') ? prev : [...prev, 'report']);
    setReportDraft(null);
  };

  const applyUserLocation = (pos) => {
    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setLocateTrigger(t => t + 1);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("위치 기능을 사용할 수 없습니다.");
      return;
    }

    const requestId = locateRequestRef.current + 1;
    locateRequestRef.current = requestId;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (locateRequestRef.current !== requestId) return;
        applyUserLocation(pos);
        setIsLocating(false);

        navigator.geolocation.getCurrentPosition(
          (freshPos) => {
            if (locateRequestRef.current === requestId) applyUserLocation(freshPos);
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
        );
      },
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (locateRequestRef.current !== requestId) return;
            applyUserLocation(pos);
            setIsLocating(false);
          },
          () => {
            if (locateRequestRef.current !== requestId) return;
            setIsLocating(false);
            alert("위치 접근 권한이 필요합니다.");
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
        );
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 3000 }
    );
  };

  const handleReset = () => {
    setPoints({ start: null, end: null });
    setRouteData(null); setTmapRouteData(null);
    setPoliceStations([]); setCctvList([]); setEmergencyList([]); setDangerZones([]);
    setReports([]); setReportPickMode(false); setShowReportModal(false); setReportDraft(null);
    setActiveFilters([]);
    setShowResult(false); setShowSafeTBT(false); setShowTmapTBT(false);
    setHighlightGeneralRoute(false); setBottomOpen(false); closeMobileSearch();
  };

  const renderFilterChips = () => (
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

  // 관리자 감독 콘솔: URL에 ?admin=1 이면 지도 대신 관리자 페이지 렌더
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1') {
    return <AdminReportsPage onExit={() => { window.location.href = window.location.pathname; }} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row"
      style={{ backgroundColor: COLORS.primary_light }}>

      {/* ══════════════════════════════
          데스크탑 왼쪽 패널
      ══════════════════════════════ */}
      <div
        className="hidden md:flex flex-col h-full min-h-0 bg-white shadow-xl z-10 overflow-y-auto relative flex-shrink-0"
        style={{ width: panelWidth, minWidth: 300, maxWidth: 600, userSelect: isResizing ? 'none' : 'auto' }}
      >

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
            key={`desktop-start-${points.start?.lat ?? 'none'}-${points.start?.lng ?? 'none'}-${points.start?.name ?? ''}`}
            value={points.start?.name ?? ''}
            onSelect={(p) => setPoints(prev => ({ ...prev, start: p }))} />
          <LocationSearch label="도착지" placeholder="예: 종각역"
            key={`desktop-end-${points.end?.lat ?? 'none'}-${points.end?.lng ?? 'none'}-${points.end?.name ?? ''}`}
            value={points.end?.name ?? ''}
            onSelect={(p) => setPoints(prev => ({ ...prev, end: p }))} />
        </div>

        {/* 필터 칩 */}
        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-2">지도 레이어</p>
          {renderFilterChips()}
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
          <div className="px-6 py-4">
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
            <div className="rounded-2xl p-4 mb-3 border-2 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: COLORS.primary_light, borderColor: COLORS.primary }}
              onClick={toggleSafeRoute}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">안심 경로</span>
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: COLORS.primary }}>추천</span>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-gray-800">{walkingMins(routeData.total_distance_meters)} 분</div>
                  <div className="text-xs text-gray-400">{fmtDist(routeData.total_distance_meters)}</div>
                </div>
              </div>
              <div className="mb-2"><Badge type={getRouteBadgeType(routeData?.route_analysis?.scores)} /></div>
              <SegmentBar geojson={routeData.geojson} />
              <p className="text-xs text-gray-600 leading-relaxed mt-2">
                {routeData.route_analysis?.summary}
              </p>
            </div>

            {/* TBT 상세 안내 - 안심 경로용 */}
            {showSafeTBT && routeData?.geojson && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-700 mb-2">상세 경로 안내</p>
                <div className="space-y-3 border-l-2 ml-2"
                  style={{ borderColor: COLORS.primary_light }}>
                  {(routeData.route_analysis?.markers ?? []).map((marker, i) => (
                    <div key={i} className="pl-4 relative">
                      <span className="absolute -left-[7px] top-1 w-3 h-3 bg-white border-2 rounded-full"
                        style={{ borderColor: COLORS.primary }} />
                      <p className="text-xs text-gray-700">{marker.type}: {marker.detail}</p>
                    </div>
                  ))}
                  {tmapRouteData?.tbtList?.length > 0 && tmapRouteData.tbtList.map((tbt, i) => (
                    <div key={`tbt-${i}`} className="pl-4 relative">
                      <span className="absolute -left-[7px] top-1 w-3 h-3 bg-white border-2 rounded-full"
                        style={{ borderColor: COLORS.primary }} />
                      <p className="text-xs text-gray-700">{tbt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 일반 최단 경로 카드 */}
            <div className="rounded-2xl p-4 mb-4 border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={toggleGeneralRoute}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-gray-800">일반 최단 경로</span>
                <div className="text-right">
                  <div className="text-base font-bold text-gray-800">{walkingMins(tmapRouteData.totalDistance)} 분</div>
                  <div className="text-xs text-gray-400">{fmtDist(tmapRouteData.totalDistance)}</div>
                </div>
              </div>
              <Badge type="danger" />
            </div>

            {/* TBT 상세 안내 - 일반 최단 경로용 */}
            {showTmapTBT && tmapRouteData?.tbtList?.length > 0 && (
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
          </div>
        )}
        {/* 리사이즈 핸들 */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors"
          style={{ backgroundColor: isResizing ? '#3B82F6' : 'transparent' }}
        />
      </div>

      {/* ══════════════════════════════
          지도 영역
      ══════════════════════════════ */}
      <div className="flex-1 relative h-full min-w-0">
        {/* 리사이즈 중 지도 클릭/드래그 방지 오버레이 */}
        {isResizing && (
          <div className="absolute inset-0 z-[9999] cursor-col-resize" />
        )}
        <TmapView
          startCoord={points.start} endCoord={points.end}
          routeData={routeData} tmapRouteData={tmapRouteData}
          policeStations={policeStations}
          cctvList={cctvList}
          emergencyList={emergencyList}
          dangerZones={dangerZones}
          reports={activeFilters.includes('report') ? reports : []}
          reportDraftPoint={reportPickMode ? reportDraft : (showReportModal ? reportDraft : null)}
          reportPickMode={reportPickMode}
          highlightGeneralRoute={highlightGeneralRoute}
          onMapClick={handleMapClick}
          onDangerMarkerClick={setRoadviewPoint}
          onReportPick={handleReportPick}
          onReportMarkerClick={setSelectedReport}
          userLocation={userLocation}
          locateTrigger={locateTrigger}
        />

        {/* 위험마커 클릭 시 네이버 로드뷰 모달 */}
        {roadviewPoint && (
          <RoadviewModal point={roadviewPoint} onClose={() => setRoadviewPoint(null)} />
        )}

        {/* 제보 작성 모달 */}
        {showReportModal && (
          <ReportModal
            draftPoint={reportDraft}
            onPickOnMap={handlePickOnMap}
            onUseCurrentLocation={handleUseCurrentLocation}
            onSubmitted={handleReportSubmitted}
            onClose={() => { setShowReportModal(false); setReportDraft(null); }}
          />
        )}

        {/* 제보 상세 모달 */}
        {selectedReport && (
          <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
        )}

        {/* 제보 위치 선택 모드 배너 */}
        {reportPickMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-3 bg-white rounded-full shadow-lg px-4 py-2.5 border border-orange-200">
            <span className="text-sm font-medium text-gray-700">📍 제보할 위치를 지도에서 탭하세요</span>
            <button onClick={() => { setReportPickMode(false); setShowReportModal(true); }}
              className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-500">
              취소
            </button>
          </div>
        )}

        {/* 제보하기 FAB (데스크탑: 현재위치 버튼 왼쪽) */}
        <button onClick={openReportModal}
          className="hidden md:flex absolute bottom-6 right-20 z-[1000] items-center gap-1.5 h-11 px-4 rounded-full shadow-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#F97316' }}>
          <Megaphone size={16} /> 제보하기
        </button>

        {/* 제보하기 FAB (모바일: 현재위치 버튼 위) */}
        <button onClick={openReportModal}
          className={`md:hidden absolute right-4 z-[1000] w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${showResult ? 'bottom-[132px]' : 'bottom-24'}`}
          style={{ backgroundColor: '#F97316' }}>
          <Megaphone size={20} color="white" />
        </button>

        {/* 데스크탑 현재 위치 버튼 */}
        <button onClick={handleLocateMe}
          disabled={isLocating}
          className="hidden md:flex absolute bottom-6 right-6 z-[1000] w-11 h-11 rounded-full bg-white shadow-lg items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200">
          <Navigation size={18} className={`text-gray-600 ${isLocating ? 'animate-spin' : ''}`} />
        </button>

        {/* 모바일 상단 바 */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-[1000] px-4 pt-4 space-y-2">
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-lg">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: COLORS.primary }}>
              <Shield size={12} color="white" />
            </div>
            <button
              type="button"
              onClick={openMobileSearch}
              className="min-w-0 flex-1 text-left"
            >
              {showResult && points.start && points.end ? (
                <div className="flex items-center gap-1.5 min-w-0 text-sm font-bold text-gray-800">
                  <span className="truncate">{points.start.name ?? '출발지'}</span>
                  <span className="shrink-0 text-gray-400">-&gt;</span>
                  <span className="truncate">{points.end.name ?? '도착지'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <Search size={16} className="shrink-0" />
                  <span>어디로 갈까요?</span>
                </div>
              )}
            </button>
            {showResult && (
              <button onClick={handleReset}
                className="shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                <RotateCcw size={16} />
              </button>
            )}
          </div>
          {mobileSearchOpen && (
            <div className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => closeMobileSearch()}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-sm font-bold text-gray-800">경로 입력</span>
              </div>
              <div className="space-y-2">
                <LocationSearch label="출발지" placeholder="예: 광화문역"
                  key={`mobile-start-${points.start?.lat ?? 'none'}-${points.start?.lng ?? 'none'}-${points.start?.name ?? ''}`}
                  value={points.start?.name ?? ''}
                  onSelect={(p) => setPoints(prev => ({ ...prev, start: p }))} />
                <LocationSearch label="도착지" placeholder="예: 종각역"
                  key={`mobile-end-${points.end?.lat ?? 'none'}-${points.end?.lng ?? 'none'}-${points.end?.name ?? ''}`}
                  value={points.end?.name ?? ''}
                  onSelect={(p) => setPoints(prev => ({ ...prev, end: p }))} />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 font-medium mb-2">사용자 유형</p>
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

                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>출발 시간</span>
                  <span className="font-bold" style={{ color: COLORS.primary }}>{requestHour}시</span>
                </div>
                <input type="range" min="0" max="23" value={requestHour}
                  onChange={(e) => setRequestHour(parseInt(e.target.value))}
                  className="w-full accent-blue-600" />
              </div>

              <div className="flex gap-2 pt-1">
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
            </div>
          )}
          {/* 플로팅 필터 칩 */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => {
              const isOn = activeFilters.includes(f.id);
              return (
                <button key={f.id} onClick={() => handleFilterToggle(f.id)}
                  className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all shadow-sm"
                  style={isOn
                    ? { backgroundColor: f.color, color: 'white', borderColor: f.color }
                    : { backgroundColor: 'white', color: '#6B7280', borderColor: '#D1D5DB' }
                  }>
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 모바일 현재 위치 버튼 (우하단, 하단 패널 위) */}
        <button onClick={handleLocateMe}
          disabled={isLocating}
          className={`md:hidden absolute right-4 z-[1000] w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-gray-200 ${showResult ? 'bottom-[72px]' : 'bottom-8'}`}
          style={{ backgroundColor: COLORS.primary }}>
          <Navigation size={20} color="white" className={isLocating ? 'animate-spin' : ''} />
        </button>

        {/* 모바일 하단 패널 */}
        {showResult && routeData && (
        <div className={`md:hidden absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ${bottomOpen ? 'max-h-[82vh]' : 'max-h-[56px]'} overflow-hidden`}>
          <div className="flex flex-col items-center pt-3 pb-1 cursor-pointer"
            onClick={() => setBottomOpen(v => !v)}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mb-1" />
            {bottomOpen
              ? <ChevronDown size={16} className="text-gray-400" />
              : <ChevronUp size={16} className="text-gray-400" />}
          </div>

          <div className="px-4 pb-6 overflow-y-auto max-h-[calc(82vh-48px)]">

            {/* 모바일 결과 */}
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-800">경로를 탐색하였습니다</span>
                  <span className="text-xs flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.safe }} />
                    탐색 완료
                  </span>
                </div>
                <div className="rounded-2xl p-4 mb-2 border-2 cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: COLORS.primary_light, borderColor: COLORS.primary }}
                  onClick={toggleSafeRoute}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">안심 경로</span>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: COLORS.primary }}>추천</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">{walkingMins(routeData.total_distance_meters)} 분</div>
                      <div className="text-xs text-gray-400">{fmtDist(routeData.total_distance_meters)}</div>
                    </div>
                  </div>
                  <div className="mb-2"><Badge type={getRouteBadgeType(routeData?.route_analysis?.scores)} /></div>
                  <SegmentBar geojson={routeData.geojson} />
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mt-2">
                    {routeData.route_analysis?.summary}
                  </p>
                </div>
                {/* 모바일 상세 경로 안내 - 안심 경로용 */}
                {showSafeTBT && routeData?.geojson && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-700 mb-2">상세 경로 안내</p>
                    <div className="space-y-3 border-l-2 ml-2"
                      style={{ borderColor: COLORS.primary_light }}>
                      {(routeData.route_analysis?.markers ?? []).map((marker, i) => (
                        <div key={i} className="pl-4 relative">
                          <span className="absolute -left-[7px] top-1 w-3 h-3 bg-white border-2 rounded-full"
                            style={{ borderColor: COLORS.primary }} />
                          <p className="text-xs text-gray-700">{marker.type}: {marker.detail}</p>
                        </div>
                      ))}
                      {tmapRouteData?.tbtList?.length > 0 && tmapRouteData.tbtList.map((tbt, i) => (
                        <div key={`tbt-${i}`} className="pl-4 relative">
                          <span className="absolute -left-[7px] top-1 w-3 h-3 bg-white border-2 rounded-full"
                            style={{ borderColor: COLORS.primary }} />
                          <p className="text-xs text-gray-700">{tbt.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {tmapRouteData && (
                  <div className="rounded-2xl p-4 mb-2 border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={toggleGeneralRoute}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-gray-800">일반 최단 경로</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-800">{walkingMins(tmapRouteData.totalDistance)} 분</div>
                        <div className="text-xs text-gray-400">{fmtDist(tmapRouteData.totalDistance)}</div>
                      </div>
                    </div>
                    <Badge type="danger" />
                  </div>
                )}
                {/* 모바일 상세 경로 안내 - 일반 최단 경로용 */}
                {showTmapTBT && tmapRouteData?.tbtList?.length > 0 && (
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
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default App;
