# 다음 작업 가이드

이 문서는 현재 코드 기준으로 바로 이어서 할 만한 작업과 주의점을 정리합니다.

## 현재 구현 상태 요약

- React/Vite + Express local app은 기본 실행 구조가 갖춰져 있습니다.
- 상품 CRUD, Excel template/download/upload, 대량 삭제/편집, SSE sync UI가 구현되어 있습니다.
- 플랫폼 client는 simulation mode 중심으로 잘 동작하도록 설계되어 있습니다.
- 쿠팡/네이버 live 연동은 실제 API 구조를 일부 반영하지만 production-ready로 보기는 어렵습니다.
- SSG/롯데/카카오는 가상 endpoint와 단순 payload skeleton입니다.

## 우선순위 높은 개선 후보

### 1. 설정 보안

현재 credential은 `server/data/database.json`에 평문 저장됩니다.

작업 방향:

- 최소: README/UI 문구를 실제 구현과 일치시키고 `.gitignore`에 `server/data/database.json` 포함 여부 확인
- 중간: credential masking, export/import 제한, file permission 안내
- 권장: OS keychain 또는 encrypted local store 적용

검증:

- 설정 저장 후 민감값이 UI와 로그에 노출되지 않는지 확인
- 로그 `details`에 API payload/credential이 들어가지 않는지 확인

### 2. 서버 validation 통일

Excel 업로드는 11개 필수 필드를 검증하지만, `POST /api/products`와 `PUT /api/products/:id`는 같은 검증을 하지 않습니다.

작업 방향:

- `database.js` 또는 별도 `product-validator.js`로 필수 필드 검증 공통화
- 단일 등록, Excel 업로드가 같은 validation rule을 쓰게 정리
- 숫자 변환 실패, 음수 가격, 빈 ID 조합 처리

검증:

- 필수 필드 누락 시 400 반환
- Excel 업로드 report의 row 단위 실패 유지
- 기존 정상 template 업로드 성공

### 3. 실제 API 연결 테스트 안전화

네이버 connection test는 현재 `registerProduct`를 호출합니다. live mode에서는 테스트 상품 등록 부작용이 날 수 있습니다.

작업 방향:

- `api-clients/naver.js`에서 token 발급만 테스트하는 함수를 export
- `server.js`의 `/api/settings/test-connection`에서 등록 API 대신 token-only check 사용
- Coupang/SSG/Lotte/Kakao도 실제 health/read-only endpoint 확인 로직으로 교체

검증:

- simulation mode는 기존처럼 mock success
- live mode는 상품 등록 없이 인증 성공/실패만 판별

### 4. 쇼핑몰 routing

현재 sync는 선택 상품을 선택 플랫폼 전체로 보냅니다. 상품의 `mallCode`/`mallName`과 플랫폼 선택 사이의 자동 매칭이 없습니다.

작업 방향:

- `mallCode` 또는 `mallName`을 플랫폼으로 매핑하는 함수 추가
- sync stream에서 mismatched platform은 skip
- skip 이벤트를 SSE로 내려 UI에 표시
- 수동 override 옵션을 둘지 결정

검증:

- 네이버 상품은 네이버만 전송
- 잘못 선택된 플랫폼은 skip log
- 기존 수동 전체 연동 흐름이 필요한 경우 옵션으로 유지

### 5. ProductList 컴포넌트 분리

`ProductList.jsx`가 1,000줄 이상이며 CRUD, modal, table, bulk edit, sync platform selector가 모두 들어 있습니다.

작업 방향:

- `ProductTable`
- `ProductFormModal`
- `BulkEditPanel`
- `SyncTargetModal`
- `useProducts` hook

검증:

- 분리 전후 기능 동등성 확인
- 상품 등록/수정/삭제/대량편집/대량연동 smoke test

## 작은 버그/정리 후보

- `SyncLogs.jsx` platform filter에 `SSG`, `LOTTE`, `KAKAO` 추가
- `SyncLogs.jsx` live log timestamp를 log 생성 시점에 저장
- `Settings.jsx` 보안 안내 문구를 실제 평문 저장과 맞게 수정
- `ProductList.jsx` 검색에서 `p.name`, `p.category` undefined 방어
- `db.updateProduct`에서 `mallCode/productCode` 변경 시 새 ID 충돌 검사
- `server/server.js` sync catch branch에서 모든 플랫폼의 `lastSync...` 갱신
- `BulkManager.jsx` file input 변경에도 Excel 확장자 검사
- `database.js`의 `Number(product.stock) !== undefined` 조건은 항상 true에 가까우므로 더 명확히 정리
- `api-clients/coupang.js`에서 payload brand가 `product.brand`를 참조하지만 data model은 `brandName`을 사용
- README에는 license가 MIT라고 되어 있으나 root `package.json`은 ISC입니다. 라이선스 정합성 확인 필요

## 새 기능을 넣을 때 확인할 기준

1. 데이터 모델 변경
   - `database.js` 기본값
   - `excel-handler.js` HEADER_MAP과 template headers
   - `ProductList.jsx` formData
   - `data-model.md`

2. 플랫폼 추가/변경
   - `server/api-clients/{platform}.js`
   - `server/server.js` sync stream branch
   - `database.js` status/id/lastSync/error fields
   - `ProductList.jsx` badge/filter/sync modal
   - `Dashboard.jsx` stats/card/chart
   - `Settings.jsx` credential form/test
   - `SyncLogs.jsx` filter/color

3. Excel 필드 변경
   - template header
   - HEADER_MAP
   - requiredFields
   - number normalization
   - ProductList modal
   - 문서의 27개 field table

## 수동 검증 체크리스트

개발 서버:

```bash
npm run dev
```

빌드:

```bash
npm run build
```

기능 smoke test:

- 대시보드가 열리고 상품/로그 count가 표시된다.
- Excel template을 다운로드할 수 있다.
- template 샘플 2행을 업로드하면 성공 report가 뜬다.
- 상품 목록에 업로드 상품이 보인다.
- 상품 하나를 수정하고 저장할 수 있다.
- 상품 여러 개를 선택해 가격/상품명 대량 편집이 된다.
- simulation mode에서 대량 연동을 실행하면 HUD와 로그가 움직인다.
- 연동 완료 후 상품 badge가 SUCCESS 또는 ERROR로 갱신된다.
- 로그 화면에서 DB log와 live log가 표시된다.

## 테스트 자동화 후보

현재 별도 test script는 없습니다. 추가한다면 다음부터 시작하는 것이 좋습니다.

- `server/database.js`: insert/upsert/status 보존/unit test
- `server/excel-handler.js`: template header, required validation, parse success/failure
- `server/server.js`: API route integration test with temp DB
- React: ProductList filtering, BulkManager upload report rendering

