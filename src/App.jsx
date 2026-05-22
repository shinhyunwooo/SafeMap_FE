import { useState, useRef } from 'react';
import { fetchSafeRoute } from './services/routeService';
import { fetchTmapPedestrianRoute, fetchNearbyPolice } from './services/tmapService';
import ControlPanel from './components/route/ControlPanel';
import LocationSearch from './components/route/LocationSearch';
import TmapView from './components/map/TmapView';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [tmapRouteData, setTmapRouteData] = useState(null);
  const [policeStations, setPoliceStations] = useState([]);

  const [persona, setPersona] = useState('general');
  const [requestHour, setRequestHour] = useState(new Date().getHours());

  const [points, setPoints] = useState({ start: null, end: null });
  const clickLockRef = useRef(0);

  const handleMapClick = (latlng) => {
    const now = Date.now();
    if (now - clickLockRef.current < 400) return;
    clickLockRef.current = now;

    setPoints((prev) => {
      if (!prev.start) return { start: latlng, end: null };
      if (!prev.end) return { ...prev, end: latlng };

      setRouteData(null);
      setTmapRouteData(null);
      setPoliceStations([]);
      return { start: latlng, end: null };
    });
  };

  const handleTestApi = async () => {
    if (!points.start || !points.end) {
      alert("출발지와 도착지를 모두 설정해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const [safeResult, tmapResult] = await Promise.all([
        fetchSafeRoute({
          startLat: points.start.lat, startLng: points.start.lng,
          endLat: points.end.lat, endLng: points.end.lng,
          persona,
          requestHour
        }),
        fetchTmapPedestrianRoute({
          startLat: points.start.lat, startLng: points.start.lng,
          endLat: points.end.lat, endLng: points.end.lng
        })
      ]);
      setRouteData(safeResult);
      setTmapRouteData(tmapResult);
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      alert("경로 탐색에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 치안시설 호출 핸들러 (경로 정중앙 기점 로직 적용)
  const handleShowPolice = async () => {
    if (!points.start) {
      alert("출발지를 먼저 설정해주세요.");
      return;
    }

    // 기본값은 출발지 좌표로 설정
    let searchLat = points.start.lat;
    let searchLng = points.start.lng;

    // 안전 경로 탐색 결과 데이터가 존재하는 경우 정중앙 좌표 추출
    if (routeData?.geojson?.geometry?.coordinates) {
      const geometry = routeData.geojson.geometry;
      let flatCoords = [];

      // MultiLineString과 LineString 데이터 구조 통합 처리
      if (geometry.type === 'MultiLineString') {
        geometry.coordinates.forEach(line => {
          if (Array.isArray(line)) flatCoords.push(...line);
        });
      } else {
        flatCoords = geometry.coordinates;
      }

      // 수집된 전체 경로 좌표 중 정중앙 인덱스의 좌표 획득
      if (flatCoords.length > 0) {
        const midIndex = Math.floor(flatCoords.length / 2);
        const midCoord = flatCoords[midIndex]; // GeoJSON은 [lng, lat] 구조
        searchLng = midCoord[0];
        searchLat = midCoord[1];
      }
    }

    const stations = await fetchNearbyPolice(searchLat, searchLng);
    if (stations.length === 0) {
      alert("해당 기점 반경 1km 이내에 치안시설이 없습니다.");
    } else {
      setPoliceStations(stations);
    }
  };

  const handleReset = () => {
    setPoints({ start: null, end: null });
    setRouteData(null);
    setTmapRouteData(null);
    setPoliceStations([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-extrabold text-gray-900">SafeMap</h1>
            <div className="flex gap-2">
              <button onClick={handleReset} className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors">초기화</button>

              <button onClick={handleShowPolice} className="px-4 py-3 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200 transition-colors shadow-sm">
                👮 주변 치안시설 보기
              </button>

              <button onClick={handleTestApi} disabled={isLoading || !points.start || !points.end} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-md">
                {isLoading ? '탐색 중...' : '경로 탐색 시작'}
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <LocationSearch label="출발지" placeholder="예: 광화문역" onSelect={(place) => setPoints(prev => ({ ...prev, start: place }))} />
            <LocationSearch label="도착지" placeholder="예: 종각역" onSelect={(place) => setPoints(prev => ({ ...prev, end: place }))} />
          </div>
        </div>

        <ControlPanel persona={persona} setPersona={setPersona} requestHour={requestHour} setRequestHour={setRequestHour} />

        <div className="bg-white p-2 rounded-xl shadow-sm h-[500px] border border-gray-200 z-0 relative">
          <TmapView
            startCoord={points.start}
            endCoord={points.end}
            routeData={routeData}
            tmapRouteData={tmapRouteData}
            policeStations={policeStations}
            onMapClick={handleMapClick}
          />
        </div>

        {routeData && tmapRouteData && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-blue-800 text-lg">AI 안전 경로 분석 결과</h3>
              <div className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-700 border border-gray-200">
                <span className="text-gray-400 mr-2">일반: {tmapRouteData.totalDistance}m</span>
                <span className="text-blue-600">안전: {Math.round(routeData.total_distance_meters)}m</span>
              </div>
            </div>
            <p className="text-blue-900 leading-relaxed mb-3">{routeData.route_analysis?.summary}</p>
          </div>
        )}

        {tmapRouteData?.tbtList && tmapRouteData.tbtList.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6 max-h-80 overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">상세 경로 안내</h3>
            <ul className="space-y-5 relative border-l-2 border-blue-100 ml-3">
              {tmapRouteData.tbtList.map((tbt, index) => (
                <li key={index} className="pl-6 relative">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-sm"></span>
                  <p className="text-gray-800 text-[15px] font-medium leading-relaxed">{tbt.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;