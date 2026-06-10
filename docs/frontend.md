# Frontend 구조

프론트엔드는 React 18 + Vite 앱입니다. 별도 router는 없고, `App.jsx`의 `activeTab` state로 화면을 전환합니다.

## Entry

```text
client/src/main.jsx
→ ReactDOM.createRoot(...)
→ <App />
```

## App.jsx

역할:

- 좌측 sidebar와 상단 header 렌더링
- 탭 상태 `activeTab` 관리
- 설정 `settings` 로드
- 대량 sync 상태 `syncStatus` 관리
- live log `globalLogs` 관리
- `EventSource('/api/sync/stream?...')` 연결

`syncStatus` shape:

```js
{
  active: false,
  percent: 0,
  message: '',
  selectedCount: 0,
  completedCount: 0,
  errorsCount: 0
}
```

SSE 이벤트 처리:

- `info`: SYSTEM live log 추가
- `console`: 플랫폼 live log 추가
- `status`: 진행률/message 갱신
- `product_success`: completed count 증가
- `product_error`: error count 증가
- `complete`: active false, percent 100, EventSource close
- `error`: active false, EventSource close

주의: `completedCount`와 `errorsCount`는 상품 수가 아니라 상품 x 플랫폼 작업 수 기준입니다. UI 문구는 “성공 n건/실패 n건”이라 자연스럽지만 `selectedCount`는 상품 수라 서로 단위가 다릅니다.

## Dashboard.jsx

역할:

- `/api/products`, `/api/logs` 조회
- 플랫폼별 성공 개수 계산
- 오류 상품 수 계산
- 전체 연동률 계산
- 최근 로그 6개 표시
- 주요 탭으로 이동하는 shortcut 제공

통계 계산 방식:

- `totalSyncOpportunities = totalProducts * 5`
- `actualSyncs = naverSuccess + coupangSuccess + ssgSuccess + lotteSuccess + kakaoSuccess`
- `syncPercentage = actualSyncs / totalSyncOpportunities`

오류 상품 수는 플랫폼별 오류 총합이 아니라, 한 상품에 하나 이상의 플랫폼 오류가 있으면 1로 계산합니다.

## ProductList.jsx

가장 큰 컴포넌트이며 상품 관리 대부분을 담당합니다.

주요 state:

- `products`, `loading`
- `selectedIds`
- `searchTerm`, `selectedMall`, `selectedStatus`
- `isModalOpen`, `editingProduct`
- `isBulkEditOpen`, `bulkUpdates`
- `isSyncModalOpen`, `syncNaver`, `syncCoupang`, `syncSsg`, `syncLotte`, `syncKakao`
- `formData`

주요 함수:

- `loadProducts`: `/api/products` 조회
- `handleSelectAll`, `handleSelectOne`: 테이블 선택
- `handleDeleteOne`, `handleBulkDelete`: 삭제
- `handleBulkEditSubmit`: 대량 편집
- `openSingleModal`: 등록/수정 modal 초기화
- `handleSingleSubmit`: POST/PUT 저장
- `triggerSync`: 선택 플랫폼 배열 구성 후 `onStartSync`
- `getFilteredProducts`: 검색/필터
- `renderSyncBadge`: 플랫폼 status badge

주의:

- 단일 상품 등록은 browser `required` 외 서버 검증이 없습니다.
- `ProductList.jsx`가 1,000줄 이상이라 이후 기능 추가 전 분리 후보입니다.
- `useEffect(() => loadProducts(), [syncActive])` 덕분에 sync 시작/종료 시 상품 목록을 다시 읽습니다.

## BulkManager.jsx

역할:

- Excel 파일 drag/drop 및 file input
- 템플릿 다운로드
- upload report 표시
- 성공 후 “상품 목록에서 확인하기”로 products 탭 이동

검증:

- drag/drop에서는 `.xlsx`, `.xls` 확장자를 검사합니다.
- file input 변경에서는 확장자 검사를 하지 않습니다.
- 최종 검증은 서버 parse 단계에서 수행됩니다.

## Settings.jsx

역할:

- 5개 플랫폼 credential 입력
- simulation mode toggle
- platform별 connection test
- key visibility toggle

주의:

- UI 안내에는 안전 저장처럼 보이는 문구가 있지만 실제 DB 저장은 평문입니다.
- connection test는 상품 등록 API를 호출하지 않고 token-only/read-only API로만 인증 상태를 확인합니다.

## SyncLogs.jsx

역할:

- live logs와 DB logs 병합
- platform filter
- 로그 전체 삭제
- 현재 필터 기준 `.txt` 내보내기

주의:

- filter button 목록에 SSG/LOTTE/KAKAO가 빠져 있습니다.
- live log timestamp를 렌더 시점의 현재 시간으로 새로 만들기 때문에, 엄밀한 발생 시각 보존에는 약합니다.

## Styling

`client/src/index.css`에 CSS variable과 공통 class가 있습니다.

주요 class:

- `.glass-panel`
- `.btn-glow`
- `.form-input`
- `.table-container`
- `.custom-table`
- `.stat-card`
- `.console-container`

색상 theme은 dark UI이며 플랫폼 색상은 Naver/Coupang만 CSS variable로 정의되어 있고, SSG/Lotte/Kakao는 컴포넌트 inline color를 주로 씁니다.
