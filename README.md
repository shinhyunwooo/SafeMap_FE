# 🗺️  SafeMap_FE

공공 데이터와 민원 데이터를 활용해 보행자의 안전한 이동을 돕는 위험요소 기반 보행 경로 안내 프론트엔드입니다.

## 📌 프로젝트 개요

SafeMap은 기존의 최단거리 중심 보행 경로 안내에서 벗어나, 조도 부족, CCTV 공백, 경사도, 민원, 주변 안전시설 등 다양한 위험요소를 함께 고려해 더 안전한 보행 경로를 제안하는 서비스입니다.

사용자는 출발지와 도착지를 검색하거나 지도에서 직접 선택할 수 있으며, 안전 경로와 일반 최단 경로를 비교할 수 있습니다. 경로 주변의 CCTV, 경찰서, 응급시설을 지도에 표시하고, 위험 지점은 네이버 거리뷰로 실제 환경을 확인할 수 있습니다. 또한 사용자가 직접 위험 요소를 제보해 지도에 실시간으로 반영할 수 있습니다.

---

## 주요 기능

### 1. 안전 경로 탐색

- 백엔드 안전 경로 API와 Tmap 보행자 경로 API를 동시에 호출합니다.
- 안전 경로와 일반 최단 경로를 함께 보여주어 거리, 예상 소요 시간, 위험 수준을 비교할 수 있습니다.
- 안전 경로는 구간별 위험도에 따라 색상으로 표시됩니다.
- 상세 경로 안내에서는 위험 분석 마커와 Tmap Turn-by-Turn 안내를 함께 제공합니다.

### 2. 위험요소 시각화 강화

- 위험 구간은 안전, 주의, 경고, 위험 4단계 색상으로 지도 위에 표시됩니다.
- 급경사 구간과 도로 파손/시설물 관련 민원 지점에는 별도 경고 마커를 표시합니다.
- 경고 마커를 클릭하면 네이버 거리뷰 모달이 열려 실제 보행 환경을 확인할 수 있습니다.
- 거리뷰 모달에는 위험 유형, 상세 설명, 네이버 파노라마 촬영일자를 함께 표시합니다.
- 거리뷰를 사용할 수 없는 위치는 로딩, 미제공, 오류 상태를 사용자에게 안내합니다.

### 3. 실시간 주민 제보

- 사용자는 `제보하기` 버튼으로 위험요소를 직접 등록할 수 있습니다.
- 제보 위치는 현재 위치를 사용하거나 지도에서 직접 선택할 수 있습니다.
- 제보 유형은 복수 선택이 가능하며, 체감 위험 강도는 0~8 범위로 입력합니다.
- 기타 유형 선택 시 직접 입력한 문구가 제보 제목처럼 표시됩니다.
- 등록 성공 후 제보 마커가 지도에 즉시 반영되고, 제보 필터가 자동 활성화됩니다.
- 제보 마커 클릭 시 유형, 강도, 메모, 등록일을 확인하는 상세 모달이 열립니다.
- 제보 데이터는 백엔드 `/api/reports` API와 연동됩니다.

### 4. 주변 안전시설 필터

- CCTV, 응급시설, 경찰서 필터를 지도 위에 표시할 수 있습니다.
- CCTV는 백엔드 DB API에서 조회합니다.
- 경찰서와 응급시설은 Tmap POI API를 활용하며, 검색 노이즈를 줄이기 위한 이름 필터링을 적용합니다.
- 경로 중심 또는 출발지 기준으로 주변 시설을 조회합니다.

### 5. 현재 위치 및 지도 인터랙션

- 현재 위치 버튼으로 사용자의 위치를 지도에 표시하고 해당 지점으로 이동합니다.
- 위치 정확도 확보를 위해 빠른 위치 요청 후 고정밀 위치 요청을 한 번 더 수행합니다.
- 지도 클릭으로 출발지와 도착지를 순차 지정할 수 있습니다.
- 클릭한 좌표는 Tmap Reverse Geocoding으로 짧은 주소명으로 변환됩니다.
- 제보 위치 선택 모드에서는 지도 클릭이 경로 입력이 아니라 제보 위치 지정으로 동작합니다.

### 6. 반응형 UI 개선

- 데스크톱은 좌측 컨트롤 패널과 우측 전체 지도 구조입니다.
- 좌측 패널은 300~600px 범위에서 드래그 리사이즈가 가능합니다.
- 모바일은 지도 중심 화면에 상단 검색 패널, 필터 칩, 하단 경로 결과 패널을 배치했습니다.
- 모바일 검색 패널은 브라우저 뒤로가기로 닫을 수 있도록 히스토리 상태를 관리합니다.
- 경로 결과 카드 클릭으로 안전 경로와 일반 최단 경로의 상세 안내를 전환합니다.

---

## 🛠️  기술 스택

| 분류 | 기술 |
| --- | --- |
| 프레임워크 | React 19, Vite |
| 스타일 | Tailwind CSS v4 |
| 지도 | Tmap JS SDK, Tmap REST API |
| 거리뷰 | Naver Maps JavaScript API Panorama |
| HTTP | Axios |
| 아이콘 | Lucide React |
| 라우팅 | React Router DOM |

---

## 경로 위험도 색상

| 단계 | 색상 | 의미 |
| --- | --- | --- |
| 안전 | `#22C55E` | 상대적으로 안전한 구간 |
| 주의 | `#FACC15` | 일부 위험요소가 있는 구간 |
| 경고 | `#FB923C` | 주의가 필요한 구간 |
| 위험 | `#EF4444` | 위험도가 높은 구간 |

---

## 주요 화면 구성

### 데스크톱

```text
좌측 패널
  - SafeMap 로고 및 서비스 설명
  - 출발지/도착지 검색
  - 지도 레이어 필터(CCTV, 응급시설, 경찰서)
  - 사용자 유형 및 출발 시간 설정
  - 안전 경로 탐색 버튼
  - 안전 경로/일반 최단 경로 결과 카드
  - 상세 경로 안내

우측 지도
  - Tmap 지도
  - 출발지/도착지 마커
  - 안전 경로 및 일반 경로
  - 주변 안전시설 마커
  - 위험구간 경고 마커
  - 주민 제보 마커
  - 현재 위치 마커
  - 제보하기/현재 위치 버튼
```

### 모바일

```text
상단
  - SafeMap 검색 바
  - 경로 입력 패널
  - 필터 칩

지도 영역
  - Tmap 지도와 마커
  - 제보하기 FAB
  - 현재 위치 FAB

하단
  - 접이식 경로 결과 패널
  - 안전 경로/일반 최단 경로 카드
  - 상세 경로 안내
```

---

## 📁 폴더 구조

```text
SafeMap_FE/
├─ public/
├─ src/
│  ├─ assets/
│  │  └─ icons/
│  ├─ components/
│  │  ├─ common/
│  │  │  ├─ BottomSheet.jsx
│  │  │  ├─ SafetyBadge.jsx
│  │  │  └─ SearchBar.jsx
│  │  ├─ map/
│  │  │  ├─ FilterChips.jsx
│  │  │  ├─ FilterMarkers.jsx
│  │  │  ├─ ReportDetailModal.jsx
│  │  │  ├─ ReportModal.jsx
│  │  │  └─ TmapView.jsx
│  │  ├─ navigation/
│  │  │  ├─ DangerModal.jsx
│  │  │  ├─ NavBottom.jsx
│  │  │  ├─ NavHeader.jsx
│  │  │  ├─ NaverPanorama.jsx
│  │  │  └─ RoadviewModal.jsx
│  │  └─ route/
│  │     ├─ ControlPanel.jsx
│  │     ├─ LocationSearch.jsx
│  │     ├─ RouteCard.jsx
│  │     ├─ RoutePanel.jsx
│  │     └─ SafetyBar.jsx
│  ├─ constants/
│  │  └─ mapConfig.js
│  ├─ hooks/
│  │  ├─ useLocation.js
│  │  ├─ useRoute.js
│  │  └─ useSearch.js
│  ├─ pages/
│  ├─ services/
│  │  ├─ api.js
│  │  ├─ reportService.js
│  │  ├─ routeService.js
│  │  ├─ searchService.js
│  │  └─ tmapService.js
│  ├─ store/
│  ├─ styles/
│  │  └─ colors.js
│  ├─ App.jsx
│  ├─ index.css
│  └─ main.jsx
├─ index.html
├─ package.json
├─ tailwind.config.js
└─ vite.config.js
```

---

## 핵심 파일 설명

### `src/App.jsx`

- 앱의 최상위 상태와 이벤트 핸들러를 관리합니다.
- 출발지/도착지, 경로 데이터, 필터 상태, 주변 시설, 현재 위치, 모바일 검색 패널, 제보 모달 상태를 관리합니다.
- 안전 경로 API와 Tmap 일반 보행 경로 API를 병렬 호출합니다.
- 제보 등록 후 지도 마커와 필터 상태를 즉시 갱신합니다.
- 데스크톱/모바일 레이아웃과 경로 결과 패널을 렌더링합니다.

### `src/components/map/TmapView.jsx`

- Tmap JS SDK를 직접 제어하는 지도 컴포넌트입니다.
- 출발지/도착지 마커, 안전 경로, 일반 최단 경로, 시설 마커, 위험구간, 제보 마커, 현재 위치 마커를 렌더링합니다.
- 안전 경로는 GeoJSON FeatureCollection의 `risk_level`에 따라 구간별 색상 Polyline으로 표시합니다.
- 급경사 구간과 민원 기반 위험 지점에 경고 마커를 만들고, 클릭 시 네이버 거리뷰 모달을 엽니다.
- 제보 위치 선택 모드에서는 지도 클릭을 제보 위치 확정 이벤트로 처리합니다.

### `src/components/navigation/NaverPanorama.jsx`

- 좌표를 받아 네이버 지도 Panorama 객체를 생성합니다.
- 거리뷰 로딩, 정상 표시, 미제공, 오류 상태를 처리합니다.
- 파노라마 위치 정보에서 촬영일자를 추출해 상위 모달에 전달합니다.

### `src/components/navigation/RoadviewModal.jsx`

- 위험 지점 상세 정보와 네이버 거리뷰를 표시하는 모달입니다.
- 위험 유형, 설명, 거리뷰 촬영일자를 사용자에게 제공합니다.

### `src/components/map/ReportModal.jsx`

- 주민 위험 제보 작성 모달입니다.
- 제보 위치, 유형, 체감 위험 강도, 메모를 입력받습니다.
- 현재 위치 사용과 지도에서 직접 선택 기능을 제공합니다.
- `createReport()` 호출 후 등록된 제보를 상위 컴포넌트에 반환합니다.

### `src/components/map/ReportDetailModal.jsx`

- 제보 마커 클릭 시 제보 상세 내용을 표시합니다.
- 제보 유형, 직접 입력 제목, 체감 위험 강도, 메모, 등록일을 보여줍니다.

### `src/services/reportService.js`

- 주민 제보 API 클라이언트입니다.
- `POST /api/reports`: 제보 등록
- `GET /api/reports`: 좌표와 반경 기준 제보 조회
- 프론트엔드 제보 유형 상수를 관리합니다.

### `src/services/tmapService.js`

- Tmap POI 검색, 역지오코딩, 보행자 경로 탐색을 담당합니다.
- 주변 경찰서, CCTV, 응급시설 조회를 제공합니다.
- CCTV는 백엔드 API(`/api/map/cctv`)를 통해 조회하고, 경찰서/응급시설은 Tmap POI API를 사용합니다.

### `src/components/route/LocationSearch.jsx`

- 장소 검색 입력 컴포넌트입니다.
- Enter 입력 시 Tmap POI API로 장소를 검색하고, 결과 선택 시 좌표와 장소명을 부모 컴포넌트에 전달합니다.

### `index.html`

- Tmap JS SDK와 네이버 지도 Panorama API를 CDN으로 로드합니다.
- 환경변수 기반으로 `VITE_TMAP_APP_KEY`, `VITE_NAVER_MAP_KEY`를 주입합니다.

---

## API 연동

### 백엔드 API

| 기능 | 메서드 | 경로 | 설명 |
| --- | --- | --- | --- |
| 안전 경로 탐색 | `POST` | `/api/routes/safe-path` | 사용자 유형과 시간대를 반영한 안전 경로 요청 |
| CCTV 조회 | `GET` | `/api/map/cctv` | 좌표 주변 CCTV 조회 |
| 제보 등록 | `POST` | `/api/reports` | 사용자 위험 제보 등록 |
| 제보 조회 | `GET` | `/api/reports` | 좌표 주변 제보 목록 조회 |

### 외부 API

| API | 사용 목적 |
| --- | --- |
| Tmap JS SDK | 지도 렌더링, 마커, Polyline, 지도 이벤트 |
| Tmap POI API | 장소 검색, 경찰서/응급시설 검색 |
| Tmap Pedestrian Route API | 일반 최단 보행 경로와 TBT 안내 |
| Tmap Reverse Geocoding API | 지도 클릭 좌표를 주소명으로 변환 |
| Naver Maps Panorama API | 위험 지점 실제 거리뷰 확인 |

---

## 환경 변수

프로젝트 루트에 `.env` 파일을 생성합니다.

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_TMAP_APP_KEY=발급받은_Tmap_App_Key
VITE_NAVER_MAP_KEY=발급받은_Naver_Maps_Client_Key
```

> Tmap SDK와 네이버 지도 SDK는 `index.html`에서 CDN으로 로드됩니다.

---

## ⚙️ 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 Vite 개발 서버 주소로 접속합니다.

```text
http://localhost:5173
```

---

## 빌드 및 검사

```bash
npm run build
npm run lint
```

## 🌿 Git 브랜치 전략

```text
main        최종 배포 브랜치
dev         개발 통합 브랜치
feat/*      기능 개발 브랜치
style/*     UI 개선 브랜치
```

---

## 💬 커밋 메시지 규칙

| 태그 | 설명 |
| --- | --- |
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `style` | UI/스타일 변경 |
| `refactor` | 코드 구조 개선 |
| `chore` | 설정, 패키지, 기타 작업 |
| `docs` | 문서 수정 |

예시:

```text
feat: 주민 위험 제보 기능 추가
style: 모바일 검색 패널 위치 개선
docs: README 최신 기능 반영
```
