# 🗺️ SafeMap_FE

공공 민원 빅데이터 기반 지역 안전 지도 및 안심 경로 서비스 - 프론트엔드

---

## 📌 프로젝트 개요

시민이 체감하는 위험 요소(조도 부족, 파손 시설 등)를 반영한 안전 지도와
사용자 유형별 맞춤형 안심 경로를 제공하는 웹 서비스입니다.

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + Vite |
| 스타일링 | Tailwind CSS v4 |
| 지도 | Tmap JS SDK (지도 렌더링, 장소 검색, 보행자 경로) — CDN 로드 (`index.html`) |
| 라우팅 | React Router DOM v7 |
| HTTP | Axios |
| 아이콘 | Lucide React |

---

**구현 화면**

```
데스크탑 레이아웃
├── 왼쪽 패널 (400px, 드래그 리사이즈 가능)
│   ├── 출발지/도착지 검색 (Tmap POI API 실시간 검색)
│   ├── 지도 레이어 필터 칩 (CCTV/응급기관/경찰서)
│   ├── 페르소나 선택 (일반/여성 안심/노약자)
│   ├── 출발 시간 슬라이더 (0~23시)
│   ├── 안전 경로 탐색 버튼
│   └── 경로 결과 패널
│       ├── 안심 경로 카드 (거리, 위험도 뱃지, AI 요약)
│       ├── 일반 최단 경로 카드 (비교용)
│       └── 상세 경로 안내 (TBT 텍스트)
└── 오른쪽 지도 (Tmap 전체화면)

모바일 레이아웃
├── 상단: SafeMap 로고 바
└── 하단: 슬라이드업 패널
    ├── 검색/필터/페르소나/시간 설정
    ├── 경로 탐색 버튼
    └── 결과 + 상세 경로 안내
```

**지도 기능**

- 안심 경로: 위험도별 색상 실선 (초록/노랑/주황/빨강) + 흰색 외곽선
- 일반 최단 경로: 회색 점선 (비교용)
- 출발/도착 마커 (SVG 커스텀)
- 위험 요소 마커 (! 아이콘 + 팝업)
- CCTV 마커 (백엔드 DB 연동)
- 응급기관 마커 (Tmap POI API)
- 경찰서 마커 (Tmap POI API, 노이즈 필터링)
- 경로 탐색 후 자동 fitBounds
- 왼쪽 패널 드래그 리사이즈 (300px ~ 600px)

**색상 시스템**

```
안전:  #22C55E (초록)
주의:  #FACC15 (노랑)
경고:  #FB923C (주황)
위험:  #EF4444 (빨강)
```

**위험도 색상 계산 로직**

```
6대 지표 가중 평균
- security_cctv       × 0.25
- infrastructure_led  × 0.20
- realtime_sdot_light × 0.20 (기본값 1.0이면 제외)
- slope               × 0.15
- civil_complaint     × 0.10
- floating_population × 0.10

≤ 0.35 → 초록(안전)
≤ 0.50 → 노랑(주의)
≤ 0.65 → 주황(경고)
> 0.65 → 빨강(위험)
```

**GitHub 브랜치 관리**

```
main ← 최종 배포용
dev  ← 통합 브랜치 (현재 기준)
feat/기능명 ← 기능별 개발 브랜치
```

---

## 📁 폴더 구조
```
SafeMap_FE/
├── public/                      # 정적 파일
├── src/
│   ├── assets/                  # 이미지, 아이콘
│   │   └── icons/
│   │       ├── danger-icon.svg  # 위험 구간 경고 아이콘
│   │       ├── icon-cctv.svg    # CCTV 필터 마커 아이콘
│   │       ├── icon-emergency.svg # 응급기관 마커 아이콘
│   │       └── icon-police.svg  # 경찰서 마커 아이콘
│   │
│   ├── components/              # 재사용 컴포넌트
│   │   ├── common/              # 공통 컴포넌트
│   │   │   ├── BottomSheet.jsx  # 모바일 하단 슬라이드업 패널 기반
│   │   │   ├── SafetyBadge.jsx  # 안전/주의/경고/위험 뱃지
│   │   │   └── SearchBar.jsx    # 검색바 공통 UI
│   │   │
│   │   ├── map/                 # 지도 관련 컴포넌트
│   │   │   ├── FilterChips.jsx  # CCTV/응급/경찰서 필터 칩 버튼
│   │   │   ├── FilterMarkers.jsx # 필터별 지도 마커 렌더링 (Leaflet용, 미사용)
│   │   │   └── TmapView.jsx     # ★ Tmap 지도 핵심 컴포넌트
│   │   │                        #   - Tmap SDK 초기화
│   │   │                        #   - 출발/도착 마커 렌더링
│   │   │                        #   - 안심경로 색상 Polyline (4색 구간별)
│   │   │                        #   - 일반경로 점선 Polyline
│   │   │                        #   - CCTV/응급/경찰서/위험범역 마커
│   │   │                        #   - 위험 요소(!) 마커
│   │   │                        #   - 지도 클릭 이벤트
│   │   │
│   │   ├── navigation/          # 길안내 관련 (현재 미사용 - 추후 확장용)
│   │   │   ├── DangerModal.jsx  # 위험 구간 진입 경고 모달
│   │   │   ├── NavBottom.jsx    # 길안내 하단 패널 (남은시간, 진행바)
│   │   │   └── NavHeader.jsx    # 길안내 상단 헤더 (방향, 거리)
│   │   │
│   │   └── route/               # 경로 관련 컴포넌트
│   │       ├── ControlPanel.jsx # 페르소나 드롭다운 + 시간 슬라이더
│   │       ├── LocationSearch.jsx # 장소 검색 입력 + 드롭다운 결과
│   │       │                    #   - Tmap POI API 엔터키 검색
│   │       │                    #   - 검색 결과 클릭 시 좌표 반환
│   │       ├── RouteCard.jsx    # 경로 카드 UI (안심/일반 경로)
│   │       ├── RoutePanel.jsx   # 경로 결과 패널 컨테이너
│   │       └── SafetyBar.jsx    # 안전도 비율 바 (초록~빨강)
│   │
│   ├── constants/               # 상수 정의
│   │   └── mapConfig.js         # 지도 초기 설정
│   │                            #   - 초기 중심 좌표 (서울 중심)
│   │                            #   - 줌 레벨
│   │
│   ├── hooks/                   # 커스텀 훅
│   │   ├── useLocation.js       # GPS 현재 위치 관리
│   │   ├── useRoute.js          # 경로 상태 관리 훅
│   │   └── useSearch.js         # 검색 상태 관리 훅
│   │
│   ├── pages/                   # 페이지 컴포넌트 (현재 미사용 - App.jsx가 담당)
│   │   ├── MainPage.jsx         # 메인 지도 화면
│   │   ├── NavigationPage.jsx   # 길안내 화면
│   │   ├── RouteResultPage.jsx  # 경로 결과 화면
│   │   └── SearchPage.jsx       # 검색 화면
│   │
│   ├── services/                # API 통신 모듈
│   │   ├── api.js               # Axios 기본 인스턴스
│   │   │                        #   - baseURL: VITE_API_BASE_URL
│   │   │                        #   - timeout, headers 설정
│   │   ├── routeService.js      # 백엔드 안심경로 API
│   │   │                        #   - fetchSafeRoute()
│   │   │                        #   - POST /api/routes/safe-path
│   │   ├── searchService.js     # 장소 검색 서비스 (미사용, tmapService로 통합)
│   │   └── tmapService.js       # ★ Tmap + 백엔드 API 통합
│   │                            #   - searchPlaces(): 장소 검색
│   │                            #   - fetchTmapPedestrianRoute(): 보행자 최단경로
│   │                            #   - fetchNearbyPolice(): 반경 경찰서
│   │                            #   - fetchNearbyCCTV(): 반경 CCTV (백엔드 DB)
│   │                            #   - fetchNearbyEmergency(): 반경 응급기관
│   │
│   ├── store/                   # 전역 상태 관리
│   │   ├── LocationContext.jsx  # 현재 GPS 위치 전역 공유
│   │   │                        #   - navigator.geolocation watchPosition
│   │   │                        #   - 기본값: 서울 중심 좌표
│   │   └── RouteContext.jsx     # 경로 전역 상태 공유
│   │                            #   - destination: 목적지 정보
│   │                            #   - selectedRoute: 선택된 경로
│   │                            #   - routeSegments: 경로 구간 데이터
│   │                            #   - isNavigating: 길안내 여부
│   │                            #   - startNavigation(), stopNavigation()
│   │
│   ├── styles/                  # 스타일 관련
│   │   └── colors.js            # ★ 색상 토큰 (Figma 기반)
│   │                            #   - COLORS: 색상 상수
│   │                            #   - BADGE_STYLES: 뱃지 스타일
│   │                            #   - getRouteColor(): 위험도→색상 변환
│   │                            #   - getRouteBadgeType(): 위험도→뱃지 타입
│   │
│   ├── App.jsx                  # ★★ 메인 앱 컴포넌트
│   │                            #   모든 상태와 핸들러 관리
│   │                            #   - 출발/도착 좌표 상태
│   │                            #   - 페르소나/시간 상태
│   │                            #   - 필터 활성 상태
│   │                            #   - 패널 드래그 리사이즈 (300~600px)
│   │                            #   - handleSearch(): 경로 탐색
│   │                            #   - handleFilterToggle(): 필터 ON/OFF
│   │                            #   - handleReset(): 전체 초기화
│   │                            #   - 데스크탑/모바일 레이아웃 분기
│   ├── App.css
│   ├── index.css                # Tailwind 기본 설정
│   └── main.jsx                 # React 앱 진입점
│                                #   - LocationProvider 감싸기
│                                #   - RouteProvider 감싸기
│
├── .env                         # 환경변수 (gitignore)
│                                #   - VITE_API_BASE_URL=http://localhost:8000
│                                #   - VITE_TMAP_APP_KEY=발급키
├── .gitignore
├── index.html                   # Tmap SDK 스크립트 CDN 로드
├── package.json
├── tailwind.config.js           # Tailwind 색상 토큰 설정
├── vite.config.js
└── README.md
```
**핵심 파일 3개 요약**

```
App.jsx
모든 상태(출발지, 도착지, 경로, 필터 등)와
핸들러를 관리하는 최상위 컴포넌트.
데스크탑/모바일 레이아웃을 하나의 파일에서 분기 처리.
패널 드래그 리사이즈 기능 포함.

TmapView.jsx
Tmap SDK를 직접 제어하는 지도 컴포넌트.
props로 받은 좌표/경로/마커 데이터를
Tmap API로 렌더링. React와 독립적으로 동작.

tmapService.js
Tmap API와 백엔드 API 호출을 담당.
장소 검색, 보행자 경로, 주변 시설
데이터를 가져오는 모든 함수 모음.
```
### 현재 실제로 사용 중인 파일 vs 미사용

```
✅ 실제 사용 중
App.jsx, TmapView.jsx, tmapService.js,
routeService.js, ControlPanel.jsx,
LocationSearch.jsx, RouteCard.jsx, RoutePanel.jsx,
SafetyBar.jsx, SafetyBadge.jsx, BottomSheet.jsx,
FilterChips.jsx, colors.js,
LocationContext.jsx, RouteContext.jsx

⚠️ 초기 구현 후 현재 미사용
(추후 기능 확장 시 활용 가능)
pages/MainPage.jsx
pages/NavigationPage.jsx
pages/RouteResultPage.jsx
pages/SearchPage.jsx
components/navigation/DangerModal.jsx
components/navigation/NavBottom.jsx
components/navigation/NavHeader.jsx
components/map/FilterMarkers.jsx (Leaflet용)
services/searchService.js
```


---


## ⚙️ 로컬 실행 방법

### 1. 레포지토리 클론

```bash
git clone https://github.com/shinhyunwooo/SafeMap_FE.git
cd SafeMap_FE
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경변수 설정 (.env 파일 생성)
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_TMAP_APP_KEY=팀_공용_앱키_입력
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속
> **주의:** Tmap SDK는 CDN으로 로드됩니다 (`index.html`). npm 패키지 아님.

---

## 🌿 브랜치 전략
main        ← 최종 배포 브랜치
dev         ← 개발 통합 브랜치
feat/기능명  ← 기능별 개발 브랜치

### 작업 순서

```bash
# 1. dev 브랜치에서 기능 브랜치 생성
git checkout dev
git pull origin dev
git checkout -b feat/기능명

# 2. 작업 후 커밋
git add .
git commit -m "feat: 기능 설명"

# 3. 원격에 push
git push origin feat/기능명

# 4. GitHub에서 dev로 Pull Request 생성
```

---

## 💬 커밋 메시지 규칙

| 태그 | 설명 |
|------|------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `style` | UI 스타일 변경 |
| `refactor` | 코드 리팩토링 |
| `chore` | 설정, 패키지 변경 |
| `docs` | 문서 수정 |

예시: `feat: 메인 지도 화면 구현`

---

## 프론트엔드 환경 변수(env) 설정 및 Tmap API 연동 가이드

Tmap API 기반 경로 탐색 및 Turn-by-Turn(TBT) 기능이 업데이트되었습니다. 로컬 환경에서 정상 작동을 위해 아래 설정을 반드시 완료해 주세요.

### 1. 환경 변수 파일 생성
프로젝트 최상단 루트 폴더(src 폴더 바깥)에 `.env` 파일을 생성하고 팀 공용 API 키를 입력합니다.

VITE_TMAP_APP_KEY=공유된_팀_공용_앱키_입력

### 2. 주요 아키텍처 및 UI 변경 사항
- **TmapView 컴포넌트 추가:** 기존 Leaflet 기반 SafeMap 및 RouteLayer 컴포넌트가 Tmap SDK 기반의 TmapView 컴포넌트로 전면 대체되었습니다.
- **TBT 경로 안내 레이아웃 추가:** 경로 탐색 완료 시 지도 하단에 네비게이션용 상세 텍스트 안내(Turn-by-Turn) UI가 추가되었습니다.
- **실시간 시간대 연동:** 사용자의 현재 접속 시간을 기반으로 백엔드 조도 및 위험도 가중치 알고리즘을 동적으로 요청합니다.