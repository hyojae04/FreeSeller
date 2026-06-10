# 마켓 API 실제 연동 점검

기준일: 2026-06-10

이 문서는 simulation mode를 끈 실제 API 모드에서 mock 성공이나 가상 endpoint가 섞이지 않도록 확인한 내용을 정리합니다.

## 공통 원칙

- simulation mode가 `true`일 때만 mock 성공/실패를 반환합니다.
- simulation mode가 `false`이면 인증 정보 누락을 실패로 반환합니다.
- 상품 등록 전 대표 이미지 URL, 숫자형 실제 카테고리 ID, 배송/반품/고시정보에 필요한 필수값을 먼저 검사합니다.
- 연결 테스트는 상품 등록 API를 호출하지 않습니다. token-only 또는 read-only API만 사용합니다.

## 쿠팡

- Base URL: `https://api-gateway.coupang.com`
- 상품 등록 endpoint: `POST /v2/providers/seller_api/apis/api/v1/marketplace/seller-products`
- 인증: Coupang Open API HMAC `Authorization: CEA algorithm=HmacSHA256, ...`
- 연결 테스트: `GET /v2/providers/seller_api/apis/api/v1/marketplace/seller-products/time-frame`
- 공식 문서 확인 사항:
  - 상품 생성에는 출고/반품지, 카테고리, 고시정보, 옵션 정보가 필요합니다.
  - 상품 등록 endpoint는 위 seller-products 경로입니다.

현재 코드 상태:

- 실제 모드에서 인증 정보가 없으면 mock 등록으로 대체하지 않고 실패합니다.
- live 등록 전 쿠팡 택배사 코드, 출고지 코드, Wing 사용자 ID, 반품지, 반품 배송비, 고시정보, 상품 속성 JSON 배열을 요구합니다.
- Settings UI에서 위 운영 필드를 저장할 수 있습니다.
- `coupangNoticeDetailsJson`과 `coupangAttributesJson`은 쿠팡 Category meta data query API 또는 카테고리 엑셀 기준으로 카테고리별 값을 채워야 합니다.

공식 문서:

- [Coupang Product Creation](https://developers.coupangcorp.com/hc/en-us/articles/360033877853-Product-Creation)
- [Coupang HMAC Signature](https://developers.coupangcorp.com/hc/en-us/articles/360033461914-Creating-HMAC-Signature)
- [Coupang Product list ranging query](https://developers.coupangcorp.com/hc/en-us/articles/360033645054-Product-list-ranging-query)

## 네이버

- Base URL: `https://api.commerce.naver.com/external`
- 인증 endpoint: `POST /v1/oauth2/token`
- 상품 등록 endpoint: `POST /v1/products`
- 인증: OAuth2 Client Credentials Grant, `client_secret_sign` bcrypt 서명, Bearer token
- 연결 테스트: token-only 발급 요청

현재 코드 상태:

- 기존 연결 테스트의 테스트 상품 등록 호출을 제거했습니다.
- 실제 모드에서 인증 정보가 없으면 mock 등록으로 대체하지 않고 실패합니다.
- live 등록 전 대표 이미지 URL, 실제 카테고리 ID, 상세 설명, 배송 구분, 원산지, 고시정보 분류 등 최소 필수값을 검사합니다.
- Settings UI에서 `naverNoticeCategoryType`을 저장할 수 있습니다.
- 카테고리별 고시정보/속성 스펙은 네이버 커머스API 상세 스펙 기반으로 추가 매핑이 필요합니다.

공식 문서:

- [Naver Commerce API Introduction](https://apicenter.commerce.naver.com/docs/introduction)
- [Naver RESTful API](https://apicenter.commerce.naver.com/docs/restful-api)
- [Naver Auth](https://apicenter.commerce.naver.com/docs/auth)
- [Naver OAuth Token API](https://apicenter.commerce.naver.com/docs/commerce-api/current/exchange-sellers-auth)

## SSG, 롯데온, 카카오

현재 프로젝트의 기존 SSG/롯데온/카카오 client는 `가상 도메인`과 추정 payload를 사용하고 있었습니다. 공식 partner 문서와 실제 계정 권한 없이 이 경로를 live API로 유지하면 잘못된 성공 로그나 잘못된 요청이 발생할 수 있습니다.

현재 코드 상태:

- simulation mode에서는 기존처럼 mock 테스트가 가능합니다.
- 실제 API 모드에서는 인증 누락을 실패로 반환합니다.
- 인증 정보가 있어도 공식 스펙 기반 구현이 완료될 때까지 등록/수정/연결 테스트를 명시적으로 실패시킵니다.

production 전 필수 작업:

- 공식 endpoint 문서 확보
- 인증 헤더/토큰 발급 방식 확정
- 상품 등록 payload 필수 필드 확정
- read-only 또는 token-only 연결 테스트 endpoint 확정
- 카테고리, 배송/반품, 고시정보 mapping table 추가
