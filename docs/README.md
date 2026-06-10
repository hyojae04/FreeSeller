# OpenSabangnet 개발 문서

이 폴더는 다음 개발 작업자가 프로젝트의 핵심 구조와 로직을 빠르게 이어받기 위한 문서 묶음입니다. 코드 기준일은 2026-06-10이며, 현재 구현을 기준으로 작성했습니다.

## 빠른 시작

1. 루트에서 의존성 설치

```bash
npm run install-all
```

2. 서버와 클라이언트 동시 실행

```bash
npm run dev
```

3. 브라우저 접속

```text
http://localhost:3000
```

## 문서 안내

- [architecture.md](./architecture.md): 전체 구조, 실행 흐름, 주요 모듈 책임
- [api-reference.md](./api-reference.md): Express API 엔드포인트와 SSE 이벤트
- [data-model.md](./data-model.md): JSON DB 구조, 상품 필드, 상태 필드, Excel 매핑
- [workflows.md](./workflows.md): 상품 등록, Excel 업로드, 대량 편집, 쇼핑몰 연동 흐름
- [frontend.md](./frontend.md): React 화면 구성, 상태 흐름, 주요 컴포넌트 역할
- [marketplace-api-readiness.md](./marketplace-api-readiness.md): 실제 마켓 API endpoint, 인증, live mode 안전장치
- [next-work.md](./next-work.md): 다음 작업 후보, 리스크, 검증 체크리스트

## 한 줄 요약

OpenSabangnet은 로컬 JSON DB에 상품과 설정을 저장하고, React UI에서 상품을 관리한 뒤, Express 서버가 Excel 업로드와 5개 쇼핑몰 연동 작업을 처리하는 local-first 상품 대량 등록 프로그램입니다.

핵심 로직은 `mallCode_productCode` 합성 ID 기반 upsert, Excel 27개 필드 표준화, 필수 11개 필드 검증, 플랫폼별 `SUCCESS`/`ERROR` 상태 보존, SSE 기반 실시간 동기화 로그입니다.
