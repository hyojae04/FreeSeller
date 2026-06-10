# API Reference

서버 진입점은 `server/server.js`입니다. 개발 환경에서는 Vite proxy 덕분에 클라이언트에서 `/api/...`로 호출하면 `localhost:5001` 서버로 전달됩니다.

## Products

### `GET /api/products`

전체 상품 배열을 반환합니다.

응답:

```json
[
  {
    "id": "M001_P00001",
    "productCode": "P00001",
    "mallCode": "M001",
    "name": "상품명",
    "statusNaver": "NOT_REGISTERED"
  }
]
```

### `POST /api/products`

상품을 생성합니다. 내부적으로 `db.insertProduct`를 호출하며, 같은 `mallCode_productCode` ID가 이미 있으면 upsert됩니다.

요청 body는 product field 일부 또는 전체입니다.

응답: 생성 또는 갱신된 product 객체, status `201`.

### `PUT /api/products/:id`

상품을 수정합니다. `mallCode` 또는 `productCode`가 변경되면 ID도 새 합성 ID로 바뀝니다.

응답:

- 성공: 수정된 product 객체
- 실패: `404 { "error": "상품을 찾을 수 없습니다." }`

주의: ID 변경 시 새 ID와 기존 상품의 충돌 여부를 별도로 검사하지 않습니다.

### `DELETE /api/products/:id`

상품 하나를 삭제합니다.

응답:

- 성공: `{ "success": true }`
- 실패: `404`

### `POST /api/products/bulk-delete`

선택 상품들을 삭제합니다.

요청:

```json
{
  "ids": ["M001_P00001", "M002_P00002"]
}
```

응답:

```json
{
  "success": true,
  "count": 2
}
```

### `POST /api/products/bulk-edit`

선택 상품들에 일괄 수정 규칙을 적용합니다.

요청:

```json
{
  "ids": ["M001_P00001"],
  "updates": {
    "priceOffsetType": "percent",
    "priceOffset": 10,
    "namePrefix": "[특가] ",
    "category": "50001375",
    "stock": 99
  }
}
```

지원 규칙:

- `priceOffsetType: "add"`: 기존 가격에 금액 더하기
- `priceOffsetType: "percent"`: 기존 가격에 퍼센트 적용 후 반올림
- `price`: 고정가 설정
- `namePrefix`, `nameSuffix`, `nameReplaceTarget`, `nameReplaceVal`
- `category`, `stock`, `shippingType`, `shippingFee`, `origin`

응답:

```json
{
  "success": true,
  "count": 1
}
```

## Settings

### `GET /api/settings`

저장된 credential과 simulation mode를 반환합니다.

주의: 현재 구현은 credential을 `server/data/database.json`에 평문 저장합니다.

### `POST /api/settings`

설정을 merge 저장합니다.

요청 예:

```json
{
  "simulationMode": true,
  "naverClientId": "",
  "naverClientSecret": "",
  "naverNoticeCategoryType": "",
  "coupangDeliveryCompanyCode": "",
  "coupangOutboundShippingPlaceCode": "",
  "coupangNoticeDetailsJson": "[{\"noticeCategoryDetailName\":\"품명 및 모델명\",\"content\":\"상품 상세 참조\"}]",
  "coupangAttributesJson": "[{\"attributeTypeName\":\"수량\",\"attributeValueName\":\"1개\"}]"
}
```

### `POST /api/settings/test-connection`

플랫폼 credential을 검사합니다.

요청:

```json
{
  "platform": "naver",
  "credentials": {
    "simulationMode": true
  }
}
```

플랫폼:

- `coupang`
- `naver`
- `ssg`
- `lotte`
- `kakao`

현재 구현 수준:

- simulation mode: 모든 플랫폼이 mock success를 반환합니다.
- coupang live test: read-only 상품 목록 조회 API로 인증을 확인합니다.
- naver live test: OAuth token-only 발급으로 인증을 확인합니다.
- ssg/lotte/kakao live test: 공식 endpoint와 인증 스펙이 프로젝트에 반영되기 전까지 실패로 반환합니다.

## Logs

### `GET /api/logs`

DB에 저장된 로그 배열을 반환합니다. 최신 로그가 배열 앞쪽에 저장됩니다.

### `POST /api/logs/clear`

저장된 로그를 모두 삭제합니다.

응답:

```json
{
  "success": true
}
```

## Excel

### `GET /api/excel/template`

27개 표준 필드와 샘플 행을 포함한 `.xlsx` 템플릿을 다운로드합니다.

파일명:

```text
product_bulk_template.xlsx
```

### `POST /api/excel/upload`

Excel 파일을 업로드하고, 첫 번째 sheet의 row를 상품으로 파싱해 DB에 upsert합니다.

요청:

- `multipart/form-data`
- field name: `file`

응답:

```json
{
  "total": 2,
  "success": 2,
  "failures": 0,
  "errors": [],
  "inserted": []
}
```

실패 row는 전체 업로드를 중단하지 않고 report에 누적됩니다.

## Sync Stream

### `GET /api/sync/stream?ids=...&platforms=...`

선택 상품을 선택 플랫폼으로 순차 등록/수정하는 SSE endpoint입니다.

예:

```text
/api/sync/stream?ids=M001_P00001,M002_P00002&platforms=naver,coupang
```

플랫폼별 처리 규칙:

- product의 해당 플랫폼 상태가 `SUCCESS`이고 외부 상품 ID가 있으면 `updateProduct`
- 아니면 `registerProduct`

SSE 이벤트:

- `info`: 작업 시작 메시지
- `warn`: 상품 누락 등 경고
- `product_start`: 상품 단위 시작
- `status`: 플랫폼 단위 진행률과 메시지
- `console`: API client에서 발생한 상세 log
- `product_success`: 플랫폼 처리 성공
- `product_error`: 플랫폼 처리 실패
- `complete`: 전체 작업 완료
- `error`: 요청 조건 오류 또는 EventSource error

`status` payload 예:

```json
{
  "productId": "M001_P00001",
  "platform": "NAVER",
  "message": "네이버 스마트스토어에 상품 등록 요청 중...",
  "percent": 50
}
```

성공 시 DB에 반영되는 필드:

- `status{Platform}: "SUCCESS"`
- `error{Platform}: ""`
- `lastSync{Platform}: ISO timestamp`
- `status{Platform}Id`: register 결과에 상품 ID가 있으면 저장

실패 시 DB에 반영되는 필드:

- `status{Platform}: "ERROR"`
- `error{Platform}: error message`
- 일부 catch 경로에서는 `lastSync{Platform}`이 갱신되지 않습니다.
