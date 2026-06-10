# 데이터 모델

저장소는 `server/data/database.json` 하나입니다. 서버 시작 시 `server/database.js`가 파일을 읽고, 없으면 기본 구조로 생성합니다.

## 최상위 구조

```json
{
  "products": [],
  "settings": {
    "simulationMode": true
  },
  "logs": []
}
```

## Product

상품 ID는 다음 합성 규칙을 따릅니다.

```js
id = `${mallCode}_${productCode}`
```

### 기본 판매/API 호환 필드

| Field | Type | 기본값 | 설명 |
| --- | --- | --- | --- |
| `id` | string | generated | `mallCode_productCode` |
| `name` | string | `""` | 내부 상품명/API 전송 상품명 |
| `category` | string | `"50001375"` | 플랫폼 API category/leaf/display category 후보 |
| `price` | number | `0` | 판매가 |
| `stock` | number | `99` | 재고 |
| `image` | string | `""` | 대표 이미지 URL |
| `subImages` | string | `""` | 콤마 구분 추가 이미지 URL |
| `description` | string | `"<p>상세설명</p>"` | 상세 설명 HTML |
| `shippingType` | string | `"FREE"` | `FREE`, `PAID`, `CONDITIONAL_FREE` |
| `shippingFee` | number | `0` | 배송비 |
| `origin` | string | `"DOMESTIC"` | 국내/해외 원산지 구분 |
| `optionName` | string | `""` | 옵션명 |
| `optionValue` | string | `""` | 콤마 구분 옵션값 |

### Sabangnet 표준 27개 필드

| Excel Header | Product Field | 필수 | 설명 |
| --- | --- | --- | --- |
| 품번코드 | `productCode` | 예 | 합성 ID 일부 |
| 쇼핑몰코드 | `mallCode` | 예 | 합성 ID 일부 |
| 쇼핑몰명 | `mallName` | 예 | 대상 쇼핑몰명 |
| 쇼핑몰 판매가 | `mallPrice` | 예 | 쇼핑몰 기준 판매가 |
| 쇼핑몰 상품명 | `mallProductName` | 아니오 | 쇼핑몰별 상품명 |
| 쇼핑몰 상세설명 | `mallDescription` | 아니오 | 쇼핑몰별 상세설명 |
| 원가 | `cost` | 예 | 원가 |
| 원가2 | `cost2` | 예 | 보조 원가 |
| 쇼핑몰 속성분류코드 | `mallAttrClassCode` | 아니오 | Excel 업로드 시 `category` fallback으로 사용 |
| 쇼핑몰 홍보문구 | `mallPromotionText` | 아니오 | 홍보 문구 |
| 부가정보코드II | `extraInfoCode2` | 아니오 | 추가 코드 |
| 자체상품코드 | `sellerProductCode` | 예 | 판매자 내부 상품 코드 |
| 상품명 | `name` | 예 | 내부/API 상품명 |
| 판매가 | `price` | 예 | API 전송 가격 |
| 쇼핑몰 원가 | `mallCost` | 아니오 | 쇼핑몰 원가 |
| 재고분할 퍼센트 | `stockSplitPercent` | 아니오 | 재고 배분 후보값 |
| 재고분할 소수점 설정 | `stockSplitDecimal` | 아니오 | 반올림 정책 후보값 |
| 인증번호 | `certNo` | 아니오 | 인증 번호 |
| 발급일자 | `issueDate` | 아니오 | 인증 발급일 |
| 인증일자 | `certDate` | 아니오 | 인증일 |
| 유효기간 시작일 | `expiryStartDate` | 아니오 | 인증 유효 시작 |
| 유효기간종료일 | `expiryEndDate` | 아니오 | 인증 유효 종료 |
| 인증기관 | `certOrg` | 아니오 | 인증 기관 |
| 인증분야 | `certField` | 아니오 | 인증 분야 |
| 브랜드명 | `brandName` | 예 | 브랜드 |
| 모델명 | `modelName` | 예 | 모델 |
| 상품인증순번 | `productCertSeq` | 아니오 | 인증 순번 |

## Sync 상태 필드

각 플랫폼별로 같은 패턴의 상태 필드가 있습니다.

| Platform | Status | External ID | Last Sync | Error |
| --- | --- | --- | --- | --- |
| Coupang | `statusCoupang` | `statusCoupangId` | `lastSyncCoupang` | `errorCoupang` |
| Naver | `statusNaver` | `statusNaverId` | `lastSyncNaver` | `errorNaver` |
| SSG | `statusSsg` | `statusSsgId` | `lastSyncSsg` | `errorSsg` |
| Lotte | `statusLotte` | `statusLotteId` | `lastSyncLotte` | `errorLotte` |
| Kakao | `statusKakao` | `statusKakaoId` | `lastSyncKakao` | `errorKakao` |

상태값:

- `NOT_REGISTERED`
- `SUCCESS`
- `ERROR`

## Upsert 동작

`db.insertProduct(product)`는 신규 생성과 갱신을 모두 담당합니다.

1. `mallCode`와 `productCode`로 ID 생성
2. 같은 ID가 없으면 기본값을 채운 상품을 push
3. 같은 ID가 있으면 기존 상품과 새 상품을 merge
4. 단, sync 상태/외부 ID/마지막 sync/error/createdAt은 기존 값을 명시적으로 보존
5. `updatedAt`은 항상 새 timestamp로 갱신

이 설계는 Excel 재업로드로 상품 데이터만 갱신하고, 이미 등록된 마켓 상태를 잃지 않기 위한 것입니다.

## Settings

```json
{
  "coupangVendorId": "",
  "coupangAccessKey": "",
  "coupangSecretKey": "",
  "naverClientId": "",
  "naverClientSecret": "",
  "naverStoreId": "",
  "ssgApiKey": "",
  "ssgPartnerId": "",
  "lotteApiKey": "",
  "lotteVendorNo": "",
  "kakaoApiKey": "",
  "simulationMode": true
}
```

주의: 현재 설정은 암호화 없이 JSON 파일에 평문 저장됩니다. 실제 배포 전에는 OS keychain, encrypted local store, 최소한 파일 permission/secret masking 정책을 검토해야 합니다.

## Logs

```json
{
  "id": "log_xxx",
  "timestamp": "2026-06-10T01:56:35.798Z",
  "platform": "SYSTEM",
  "type": "SUCCESS",
  "message": "대량 삭제 완료",
  "details": ""
}
```

- `db.addLog`는 새 로그를 배열 앞에 `unshift`합니다.
- 최대 500개만 유지합니다.
- `details`가 object이면 JSON string으로 저장합니다.

