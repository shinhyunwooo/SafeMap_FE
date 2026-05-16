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
| 프레임워크 | React 18 + Vite |
| 스타일링 | Tailwind CSS v4 |
| 지도 | Leaflet.js + react-leaflet |
| 라우팅 | React Router DOM v6 |
| HTTP | Axios |
| 아이콘 | Lucide React |

---

## 📁 폴더 구조
src/
├── components/
│   ├── map/          # 지도 관련 컴포넌트
│   ├── route/        # 경로 카드, 안전도 바
│   ├── navigation/   # 길안내 화면
│   └── common/       # 공통 컴포넌트
├── pages/            # 페이지 단위 컴포넌트
├── hooks/            # 커스텀 훅
├── services/         # API 통신
├── store/            # 전역 상태 (Context)
└── constants/        # 상수 (지도 설정 등)

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

### 3. 환경변수 설정

루트 폴더에 `.env` 파일 생성 후 아래 내용 입력
VITE_KAKAO_MAP_KEY=카카오맵_API_키
VITE_API_BASE_URL=백엔드_서버_주소

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

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