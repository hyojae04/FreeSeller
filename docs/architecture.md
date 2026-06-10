# 아키텍처 개요

## 전체 구조

```text
root
├── package.json
├── client/                  React + Vite frontend
│   ├── src/App.jsx          앱 shell, 탭 전환, SSE 연결 관리
│   ├── src/components/      대시보드, 상품 목록, Excel 업로드, 설정, 로그
│   └── vite.config.js       /api 프록시를 localhost:5001로 전달
└── server/                  Express backend
    ├── server.js            REST API, Excel upload, SSE sync stream
    ├── database.js          JSON 파일 DB, 상품 upsert, 설정/로그 저장
    ├── excel-handler.js     Excel template 생성, Excel import 검증/적재
    ├── api-clients/         플랫폼별 register/update 구현
    └── data/database.json   로컬 저장소
```

## 실행 프로세스

- 루트 `npm run dev`는 `concurrently`로 서버와 클라이언트를 동시에 실행합니다.
- 서버는 기본 `PORT=5001`에서 Express 앱을 실행합니다.
- 클라이언트는 Vite 개발 서버 `localhost:3000`에서 실행됩니다.
- `client/vite.config.js`가 `/api` 요청을 `http://localhost:5001`로 proxy합니다.

## 주요 책임 분리

### 서버

- `server/server.js`
  - REST API 라우팅
  - Excel 템플릿 다운로드와 업로드
  - `/api/sync/stream` SSE 연결
  - 플랫폼별 API client 호출
  - sync 결과를 DB 상태 필드에 반영

- `server/database.js`
  - `server/data/database.json` 읽기/쓰기
  - 상품 CRUD
  - `mallCode_productCode` 합성 ID 생성
  - 동일 ID upsert 시 기존 sync 상태 보존
  - 설정 저장
  - 최근 500개 로그 저장

- `server/excel-handler.js`
  - 27개 표준 Excel 헤더 템플릿 생성
  - 한글/영문 헤더를 내부 product field로 매핑
  - 11개 필수 필드 검증
  - 수치 필드 정규화
  - DB insert/upsert 호출

- `server/api-clients/*.js`
  - `registerProduct(product, settings, logCallback)`
  - `updateProduct(product, settings, logCallback)`
  - simulation mode에서는 mock delay와 mock result 반환
  - live mode에서는 플랫폼별 API 호출 시도

### 클라이언트

- `client/src/App.jsx`
  - 탭 상태 관리
  - 설정 로드
  - sync 진행률 HUD
  - `/api/sync/stream` EventSource 연결
  - live log를 `SyncLogs`에 전달

- `ProductList.jsx`
  - 상품 목록 로드, 검색, 필터링
  - 단일 상품 등록/수정/삭제
  - 선택 상품 대량 삭제/편집
  - 플랫폼 선택 후 `onStartSync` 호출

- `BulkManager.jsx`
  - Excel template 다운로드
  - Excel 파일 drag/drop 업로드
  - upload report 표시

- `Dashboard.jsx`
  - `/api/products`, `/api/logs`를 읽어 통계 계산
  - 플랫폼별 성공 수, 오류 수, 전체 연동률 표시

- `Settings.jsx`
  - API credential과 simulation mode 저장
  - 플랫폼별 connection test 호출

- `SyncLogs.jsx`
  - live log와 DB log 병합
  - 필터링, 삭제, txt export

## 핵심 설계 포인트

1. Local-first
   - 별도 DB 서버 없이 `server/data/database.json`을 단일 저장소로 씁니다.
   - 장점은 설치/운영이 단순하다는 점입니다.
   - 단점은 동시 쓰기, 백업, credential 보호가 약하다는 점입니다.

2. 합성 ID
   - 상품 ID는 `${mallCode}_${productCode}`입니다.
   - 같은 쇼핑몰 코드와 품번 코드로 다시 업로드하면 신규 추가가 아니라 기존 상품 업데이트가 됩니다.

3. sync 상태 보존
   - `insertProduct`에서 기존 상품을 upsert할 때 플랫폼별 상태, 외부 상품 ID, 마지막 sync 시각, error message를 보존합니다.
   - Excel 재업로드나 수동 저장으로 가격/설명은 갱신하되, 이미 등록된 외부 listing 상태를 잃지 않기 위한 의도입니다.

4. SSE 기반 진행률
   - 대량 연동은 HTTP 요청 하나로 끝내지 않고 `/api/sync/stream`에서 `text/event-stream`으로 상태를 계속 전송합니다.
   - 클라이언트는 EventSource로 진행률, console log, success/error, complete 이벤트를 받습니다.

5. Simulation-first
   - 기본 설정은 `simulationMode: true`입니다.
   - 실제 API credential이 없어도 UI, Excel 업로드, 동기화 흐름을 테스트할 수 있습니다.

