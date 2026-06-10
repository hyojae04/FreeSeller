# 핵심 워크플로우

## 1. 수동 상품 등록/수정

```text
ProductList modal
→ POST /api/products 또는 PUT /api/products/:id
→ db.insertProduct 또는 db.updateProduct
→ server/data/database.json 저장
→ ProductList reload
```

등록 시 필수값 검증은 주로 브라우저 `required` 속성에 의존합니다. 서버의 `POST /api/products`는 Excel 업로드와 달리 11개 필수 필드를 별도로 검증하지 않습니다.

## 2. Excel 템플릿 다운로드

```text
BulkManager download button
→ GET /api/excel/template
→ excelHandler.generateTemplate()
→ xlsx-js-style workbook 생성
→ product_bulk_template.xlsx 다운로드
```

템플릿 특징:

- 27개 표준 헤더
- 샘플 2행 포함
- 첫 행 갈색 배경 `#993301`
- sheet name: `상품일괄등록템플릿`

## 3. Excel 업로드

```text
BulkManager upload
→ POST /api/excel/upload multipart file
→ multer가 server/temp에 임시 저장
→ excelHandler.parseExcel(filePath)
→ 첫 번째 sheet를 JSON row로 변환
→ HEADER_MAP으로 product field 매핑
→ 11개 필수 필드 검증
→ 숫자 필드 정규화
→ API 호환 기본값 채움
→ db.insertProduct(productData)
→ upload report 반환
→ 임시 파일 삭제
```

필수 필드:

- `productCode`
- `mallCode`
- `mallName`
- `mallPrice`
- `sellerProductCode`
- `name`
- `price`
- `cost`
- `cost2`
- `brandName`
- `modelName`

실패 row는 전체 업로드를 중단하지 않습니다. report의 `errors`에 행 번호, 상품명, error message를 누적합니다.

## 4. 상품 검색/필터

```text
ProductList loadProducts()
→ GET /api/products
→ 클라이언트 메모리에서 검색/필터
```

검색 조건:

- `p.name`에 검색어 포함
- `p.category`에 검색어 포함

필터 조건:

- `selectedMall !== ALL`이면 해당 플랫폼 status field 확인
- `selectedStatus !== ALL`이면 상태값 매칭
- 전체 쇼핑몰 + 특정 상태이면 5개 플랫폼 중 하나라도 해당 상태인지 확인

주의: `p.name` 또는 `p.category`가 비어 있거나 undefined이면 `.toLowerCase()`/`.includes()`에서 오류가 날 수 있습니다. 현재 기본값으로 대부분 방지되지만, 외부 데이터 import를 넓히면 방어 코드가 필요합니다.

## 5. 대량 편집

```text
ProductList selectedIds
→ bulk edit panel submit
→ POST /api/products/bulk-edit
→ db.bulkUpdateProducts(ids, updates)
→ JSON DB 저장
→ ProductList reload
```

지원 작업:

- 가격 고정/더하기/퍼센트 변경
- 상품명 prefix/suffix 추가
- 상품명 문자열 치환
- category, stock, shippingType, shippingFee, origin 일괄 지정

대량 편집은 sync 상태를 직접 건드리지 않습니다.

## 6. 대량 삭제

```text
ProductList selectedIds
→ POST /api/products/bulk-delete
→ db.deleteProduct(id) 반복
→ SYSTEM log 기록
→ ProductList reload
```

현재 구현은 삭제된 개수만 반환하고, 삭제 실패 ID 목록은 반환하지 않습니다.

## 7. 쇼핑몰 대량 연동

```text
ProductList selectedIds + selected platforms
→ App.handleStartSync(productIds, platforms)
→ EventSource /api/sync/stream
→ server loops products x platforms sequentially
→ platform api client register/update
→ db.updateProduct sync status
→ SSE events back to App
→ globalLogs + HUD update
→ complete event closes EventSource
```

등록/수정 판단:

```text
if statusPlatform === "SUCCESS" and statusPlatformId exists
  updateProduct
else
  registerProduct
```

성공:

- 상태를 `SUCCESS`로 저장
- error field를 빈 문자열로 초기화
- last sync timestamp 저장
- 신규 external product ID가 있으면 저장

실패:

- 상태를 `ERROR`로 저장
- error field에 message 저장
- 일부 branch에서는 last sync timestamp도 저장

## 8. 로그 화면

```text
App globalLogs: SSE live logs
SyncLogs dbLogs: GET /api/logs
→ merge
→ timestamp 정렬
→ platform/type/message 기준 중복 제거
→ terminal UI 표시
```

주의: 현재 로그 필터 버튼은 `ALL`, `COUPANG`, `NAVER`, `SYSTEM`만 제공합니다. SSG/LOTTE/KAKAO 로그가 생성되어도 버튼 필터에는 없습니다.

