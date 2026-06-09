const XLSX = require('xlsx-js-style');
const db = require('./database');

// 컬럼 헤더 매핑 규칙 (한글 및 영문 지원)
const HEADER_MAP = {
  '품번코드': 'productCode',
  'productcode': 'productCode',
  
  '쇼핑몰코드': 'mallCode',
  'mallcode': 'mallCode',
  
  '쇼핑몰명': 'mallName',
  'mallname': 'mallName',
  
  '쇼핑몰판매가': 'mallPrice',
  'mallprice': 'mallPrice',
  
  '쇼핑몰상품명': 'mallProductName',
  'mallproductname': 'mallProductName',
  
  '쇼핑몰상세설명': 'mallDescription',
  'malldescription': 'mallDescription',
  
  '원가': 'cost',
  'cost': 'cost',
  
  '원가2': 'cost2',
  'cost2': 'cost2',
  
  '쇼핑몰속성분류코드': 'mallAttrClassCode',
  'mallattrclasscode': 'mallAttrClassCode',
  
  '쇼핑몰홍보문구': 'mallPromotionText',
  'mallpromotiontext': 'mallPromotionText',
  
  '부가정보코드ii': 'extraInfoCode2',
  'extrainfocode2': 'extraInfoCode2',
  
  '자체상품코드': 'sellerProductCode',
  'sellerproductcode': 'sellerProductCode',
  
  '상품명': 'name',
  'name': 'name',
  
  '판매가': 'price',
  'price': 'price',
  
  '쇼핑몰원가': 'mallCost',
  'mallcost': 'mallCost',
  
  '재고분할퍼센트': 'stockSplitPercent',
  'stocksplitpercent': 'stockSplitPercent',
  
  '재고분할소수점설정': 'stockSplitDecimal',
  'stocksplitdecimal': 'stockSplitDecimal',
  
  '인증번호': 'certNo',
  'certno': 'certNo',
  
  '발급일자': 'issueDate',
  'issuedate': 'issueDate',
  
  '인증일자': 'certDate',
  'certdate': 'certDate',
  
  '유효기간시작일': 'expiryStartDate',
  'expirystartdate': 'expiryStartDate',
  
  '유효기간종료일': 'expiryEndDate',
  'expiryenddate': 'expiryEndDate',
  
  '인증기관': 'certOrg',
  'certorg': 'certOrg',
  
  '인증분야': 'certField',
  'certfield': 'certField',
  
  '브랜드명': 'brandName',
  'brandname': 'brandName',
  
  '모델명': 'modelName',
  'modelname': 'modelName',
  
  '상품인증순번': 'productCertSeq',
  'productcertseq': 'productCertSeq'
};

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // raw 데이터 파싱
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  const report = {
    total: rows.length,
    success: 0,
    failures: 0,
    errors: [],
    inserted: []
  };

  rows.forEach((row, idx) => {
    try {
      const productData = {};
      
      // 로우의 각 키를 정규화하여 매핑
      Object.keys(row).forEach(originalKey => {
        const cleanKey = originalKey.replace(/\s+/g, '').toLowerCase();
        const mappedKey = HEADER_MAP[cleanKey] || HEADER_MAP[originalKey];
        if (mappedKey) {
          productData[mappedKey] = row[originalKey];
        }
      });

      // 필수 데이터 검증 (11개 필수값 체크)
      const requiredFields = [
        { key: 'productCode', label: '품번코드' },
        { key: 'mallCode', label: '쇼핑몰코드' },
        { key: 'mallName', label: '쇼핑몰명' },
        { key: 'mallPrice', label: '쇼핑몰 판매가' },
        { key: 'sellerProductCode', label: '자체상품코드' },
        { key: 'name', label: '상품명' },
        { key: 'price', label: '판매가' },
        { key: 'cost', label: '원가' },
        { key: 'cost2', label: '원가2' },
        { key: 'brandName', label: '브랜드명' },
        { key: 'modelName', label: '모델명' }
      ];

      requiredFields.forEach(f => {
        const val = productData[f.key];
        if (val === undefined || val === null || String(val).trim() === '') {
          throw new Error(`필수 필드 [${f.label}]의 값이 비어있거나 유효하지 않습니다.`);
        }
      });

      // 값 정규화 및 수치 자료형 안전 보장
      productData.price = Number(productData.price) || 0;
      productData.cost = Number(productData.cost) || 0;
      productData.cost2 = Number(productData.cost2) || 0;
      productData.mallPrice = Number(productData.mallPrice) || 0;
      productData.mallCost = Number(productData.mallCost) || 0;
      productData.stockSplitPercent = Number(productData.stockSplitPercent) || 0;
      productData.productCertSeq = Number(productData.productCertSeq) || 0;

      // 기존 API 호환을 위한 디폴트 세팅 기입
      productData.stock = 99; // 기본 재고 수량 제공
      productData.category = productData.mallAttrClassCode || '50001375'; // 속성분류코드가 있으면 카테고리로 매핑
      productData.description = productData.mallDescription || '<p>상세설명</p>';
      productData.shippingType = 'FREE';
      productData.shippingFee = 0;
      productData.origin = 'DOMESTIC';

      // DB 적재
      const insertedProd = db.insertProduct(productData);
      report.success++;
      report.inserted.push(insertedProd);
    } catch (err) {
      report.failures++;
      report.errors.push({
        rowIndex: idx + 2, // 1-indexed + header row
        productName: row['상품명'] || row['name'] || `행 번호 ${idx + 2}`,
        error: err.message
      });
    }
  });

  db.addLog(
    'SYSTEM',
    report.failures > 0 ? 'ERROR' : 'SUCCESS',
    `엑셀 대량 업로드 처리 완료: 전체 ${report.total}건 중 성공 ${report.success}건, 실패 ${report.failures}건`
  );

  return report;
}

function generateTemplate() {
  const headers = [
    '품번코드',
    '쇼핑몰코드',
    '쇼핑몰명',
    '쇼핑몰 판매가',
    '쇼핑몰 상품명',
    '쇼핑몰 상세설명',
    '원가',
    '원가2',
    '쇼핑몰 속성분류코드',
    '쇼핑몰 홍보문구',
    '부가정보코드II',
    '자체상품코드',
    '상품명',
    '판매가',
    '쇼핑몰 원가',
    '재고분할 퍼센트',
    '재고분할 소수점 설정',
    '인증번호',
    '발급일자',
    '인증일자',
    '유효기간 시작일',
    '유효기간종료일',
    '인증기관',
    '인증분야',
    '브랜드명',
    '모델명',
    '상품인증순번'
  ];

  const sampleRows = [
    [
      'P00001',          // 품번코드
      'M001',            // 쇼핑몰코드
      '네이버 스마트스토어', // 쇼핑몰명
      138000,            // 쇼핑몰 판매가
      '모던 통기타 패키지',  // 쇼핑몰 상품명
      '<p>상세설명</p>',   // 쇼핑몰 상세설명
      80000,             // 원가
      82000,             // 원가2
      'CAT_GUITAR_01',   // 쇼핑몰 속성분류코드
      '초심자를 위한 입문 기타', // 쇼핑몰 홍보문구
      'ADD_INFO_02',     // 부가정보코드II
      'SELF_PROD_101',   // 자체상품코드
      '어쿠스틱 통기타 패키지', // 상품명
      158000,            // 판매가
      75000,             // 쇼핑몰 원가
      50,                // 재고분할 퍼센트
      'ROUNDS_HALF_UP',  // 재고분할 소수점 설정
      'CERT-12345',      // 인증번호
      '2026-01-01',      // 발급일자
      '2026-01-02',      // 인증일자
      '2026-01-01',      // 유효기간 시작일
      '2028-12-31',      // 유효기간종료일
      '한국전자연구소',      // 인증기관
      '안전인증',          // 인증분야
      '야마하',           // 브랜드명
      'FG-800',          // 모델명
      1                  // 상품인증순번
    ],
    [
      'P00002',          // 품번코드
      'M002',            // 쇼핑몰코드
      '쿠팡 WING',        // 쇼핑몰명
      218000,            // 쇼핑몰 판매가
      '노이즈캔슬링 헤드폰',  // 쇼핑몰 상품명
      '<p>음향 기기 상세설명</p>', // 쇼핑몰 상세설명
      120000,            // 원가
      125000,            // 원가2
      'CAT_SOUND_02',    // 쇼핑몰 속성분류코드
      '완벽한 고요함, 프리미엄 사운드', // 쇼핑몰 홍보문구
      'ADD_INFO_03',     // 부가정보코드II
      'SELF_PROD_202',   // 자체상품코드
      '노이즈캔슬링 헤드폰 H1', // 상품명
      249000,            // 판매가
      115000,            // 쇼핑몰 원가
      100,               // 재고분할 퍼센트
      'ROUNDS_DOWN',     // 재고분할 소수점 설정
      'CERT-67890',      // 인증번호
      '2026-02-15',      // 발급일자
      '2026-02-16',      // 인증일자
      '2026-02-15',      // 유효기간 시작일
      '2029-02-14',      // 유효기간종료일
      'KC인증원',         // 인증기관
      '전파인증',          // 인증분야
      '소니',            // 브랜드명
      'WH-1000XM4',      // 모델명
      1                  // 상품인증순번
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 셀 너비 자동 조정
  const wscols = headers.map(h => ({ wch: Math.max(h.length * 2 + 4, 14) }));
  ws['!cols'] = wscols;

  // 행 높이 조정 (헤더 행 높이 28px 설정)
  ws['!rows'] = [{ hpx: 28 }];

  // 헤더 셀 스타일 적용 (1행: A1 ~ AA1)
  const cols = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA'
  ];
  cols.forEach(col => {
    const cellRef = `${col}1`;
    if (ws[cellRef]) {
      ws[cellRef].s = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: '993301' } // 갈색 배경 (#993301)
        },
        font: {
          name: '맑은 고딕',
          sz: 10,
          bold: true,
          color: { rgb: 'FFFFFF' } // 흰색 글씨
        },
        alignment: {
          vertical: 'center',
          horizontal: 'center',
          wrapText: true
        },
        border: {
          top: { style: 'thin', color: { rgb: 'D3D3D3' } },
          bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
          left: { style: 'thin', color: { rgb: 'D3D3D3' } },
          right: { style: 'thin', color: { rgb: 'D3D3D3' } }
        }
      };
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, '상품일괄등록템플릿');
  
  // Buffer로 내보내기
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

module.exports = {
  parseExcel,
  generateTemplate
};
