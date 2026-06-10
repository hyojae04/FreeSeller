const crypto = require('crypto');
const axios = require('axios');
const db = require('../database');
const {
  buildValidationError,
  missingCredentialError,
  validateCoupangLiveProduct
} = require('./live-validation');

const COUPANG_HOST = 'https://api-gateway.coupang.com';

// HMAC SHA-256 서명 헤더 생성 함수
function generateCoupangHeaders(method, path, query = '', accessKey, secretKey) {
  // ISO8601 UTC 시간 생성 (yyMMddTHHmmssZ 포맷)
  const dateObj = new Date();
  const datetime = dateObj.toISOString().substr(2, 17).replace(/[:\-]/gi, '') + 'Z';

  // 서명 메시지 조립
  const message = datetime + method + path + query;

  // HMAC-SHA256 생성
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');

  return {
    'Content-Type': 'application/json;charset=UTF-8',
    'Authorization': `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`,
    'X-Requested-With': 'XMLHttpRequest'
  };
}

function formatCoupangDate(date) {
  return date.toISOString().substring(0, 19);
}

async function testConnection(settings) {
  const { coupangVendorId, coupangAccessKey, coupangSecretKey } = settings;

  if (!coupangVendorId || !coupangAccessKey || !coupangSecretKey) {
    return {
      success: false,
      message: missingCredentialError('쿠팡', ['Vendor ID', 'Access Key', 'Secret Key'])
    };
  }

  const path = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/time-frame';
  const createdAtTo = formatCoupangDate(new Date());
  const createdAtFrom = formatCoupangDate(new Date(Date.now() - 5 * 60 * 1000));
  const params = new URLSearchParams({
    vendorId: coupangVendorId,
    createdAtFrom,
    createdAtTo
  });
  const query = params.toString();
  const headers = generateCoupangHeaders('GET', path, query, coupangAccessKey, coupangSecretKey);

  try {
    await axios.get(`${COUPANG_HOST}${path}?${query}`, { headers, timeout: 10000 });
    db.addLog('COUPANG', 'INFO', '쿠팡 read-only 상품 목록 조회로 API 연결 테스트 성공');
    return { success: true, message: '쿠팡 API 연결 테스트 성공: read-only 상품 목록 조회 인증 완료' };
  } catch (err) {
    const errorDetails = err.response ? err.response.data : err.message;
    const message = errorDetails.message || errorDetails.error || err.message;
    db.addLog('COUPANG', 'ERROR', '쿠팡 API 연결 테스트 실패', errorDetails);
    return { success: false, message: `쿠팡 API 연결 테스트 실패: ${message}` };
  }
}

/**
 * 쿠팡 상품 등록 API 호출
 */
async function registerProduct(product, settings, logCallback = () => {}) {
  const { coupangVendorId, coupangAccessKey, coupangSecretKey, simulationMode } = settings;
  const path = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products';
  
  logCallback(`[쿠팡] 상품 등록 시작: "${product.name}"`);

  if (simulationMode) {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // 특정 키워드에 따라 고의로 오류를 내어 오류 처리 UI 검증을 돕습니다.
    if (product.name.includes('오류') || product.name.includes('fail') || Math.random() < 0.1) {
      const errorMsg = '카테고리 승인이 필요하거나 필수 이미지 규격이 올바르지 않습니다. (에러 코드: CPG_VAL_042)';
      logCallback(`[쿠팡] 상품 등록 실패: ${errorMsg}`, 'ERROR');
      db.addLog('COUPANG', 'ERROR', `상품 "${product.name}" 등록 실패`, errorMsg);
      return { success: false, error: errorMsg };
    }

    const mockSellerProductId = 'mock_c_' + Math.random().toString(36).substr(2, 8);
    logCallback(`[쿠팡] 상품 등록 성공! 상품ID: ${mockSellerProductId}`, 'SUCCESS');
    db.addLog('COUPANG', 'SUCCESS', `상품 "${product.name}" 등록 성공`, { sellerProductId: mockSellerProductId, status: 'APPROVED' });
    return { success: true, productId: mockSellerProductId };
  }

  if (!coupangAccessKey || !coupangSecretKey || !coupangVendorId) {
    const errorMsg = missingCredentialError('쿠팡', ['Vendor ID', 'Access Key', 'Secret Key']);
    logCallback(`[쿠팡] 상품 등록 차단: ${errorMsg}`, 'ERROR');
    db.addLog('COUPANG', 'ERROR', `상품 "${product.name}" 등록 차단`, errorMsg);
    return { success: false, error: errorMsg };
  }

  const validationError = buildValidationError('쿠팡', validateCoupangLiveProduct(product, settings));
  if (validationError) {
    logCallback(`[쿠팡] 상품 등록 차단: ${validationError}`, 'ERROR');
    db.addLog('COUPANG', 'ERROR', `상품 "${product.name}" 등록 전 검증 실패`, validationError);
    return { success: false, error: validationError };
  }

  // --- 실제 API 호출 모드 ---
  try {
    // 상품 옵션 가공
    const items = [];
    const options = product.optionValue ? product.optionValue.split(',') : ['기본옵션'];
    
    options.forEach((opt, idx) => {
      items.push({
        itemName: opt.trim(),
        originalPrice: product.price,
        salePrice: product.price,
        maximumBuyCount: 999,
        headCount: 0,
        images: [
          {
            imageOrder: 0,
            imageType: 'REPRESENTATION',
            vendorPath: product.image
          }
        ],
        attributes: [],
        contents: [],
        offers: []
      });
    });

    const payload = {
      displayCategoryCode: Number(product.category),
      sellerProductName: product.name,
      vendorId: coupangVendorId,
      saleStartedAt: new Date().toISOString().substring(0, 19).replace('T', ' '),
      saleEndedAt: '2099-12-31 23:59:59',
      brand: product.brandName || product.brand,
      generalDescription: product.description,
      items: items,
      deliveryProperties: {
        deliveryMethod: 'SEQUENTIAL',
        deliveryFeeType: product.shippingType === 'FREE' ? 'FREE' : 'PAID',
        deliveryFee: product.shippingType === 'FREE' ? 0 : (product.shippingFee || 3000)
      }
    };

    const headers = generateCoupangHeaders('POST', path, '', coupangAccessKey, coupangSecretKey);

    db.addLog('COUPANG', 'INFO', `쿠팡 API 요청 전송: "${product.name}"`, { url: COUPANG_HOST + path, payload });

    const response = await axios.post(COUPANG_HOST + path, payload, { headers, timeout: 10000 });
    
    if (response.data && response.data.code === 'SUCCESS') {
      const sellerProductId = response.data.data;
      logCallback(`[쿠팡] 상품 등록 성공! 상품ID: ${sellerProductId}`, 'SUCCESS');
      db.addLog('COUPANG', 'SUCCESS', `상품 "${product.name}" 등록 성공`, response.data);
      return { success: true, productId: sellerProductId };
    } else {
      const errMsg = response.data.message || '알 수 없는 API 오류';
      logCallback(`[쿠팡] 상품 등록 실패: ${errMsg}`, 'ERROR');
      db.addLog('COUPANG', 'ERROR', `상품 "${product.name}" 등록 실패`, response.data);
      return { success: false, error: errMsg };
    }
  } catch (err) {
    const errorDetails = err.response ? err.response.data : err.message;
    const errorMsg = errorDetails.message || errorDetails.error || err.message;
    logCallback(`[쿠팡] 네트워크/서버 오류 발생: ${errorMsg}`, 'ERROR');
    db.addLog('COUPANG', 'ERROR', `상품 "${product.name}" 통신 실패`, errorDetails);
    return { success: false, error: errorMsg };
  }
}

/**
 * 쿠팡 상품 정보 수정 API 호출 (등록 상품 가격/재고 등 변경)
 */
async function updateProduct(product, settings, logCallback = () => {}) {
  const { coupangAccessKey, coupangSecretKey, coupangVendorId, simulationMode } = settings;
  logCallback(`[쿠팡] 상품 수정 요청: "${product.name}" (ID: ${product.statusCoupangId})`);

  if (simulationMode) {
    await new Promise(resolve => setTimeout(resolve, 800));
    logCallback(`[쿠팡] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('COUPANG', 'SUCCESS', `상품 "${product.name}" 정보 수정 성공(시뮬레이션)`);
    return { success: true };
  }

  if (!coupangAccessKey || !coupangSecretKey || !coupangVendorId) {
    const errorMsg = missingCredentialError('쿠팡', ['Vendor ID', 'Access Key', 'Secret Key']);
    logCallback(`[쿠팡] 상품 수정 차단: ${errorMsg}`, 'ERROR');
    db.addLog('COUPANG', 'ERROR', `상품 "${product.name}" 수정 차단`, errorMsg);
    return { success: false, error: errorMsg };
  }

  // 실제 연동은 상품 아이템(vendorItemId) 단위 가격 변경 API 등을 사용해야 합니다.
  // 여기서는 구조적 서명 생성 및 처리 패턴 위주로 기입
  try {
    const path = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${product.statusCoupangId}`;
    const payload = {
      sellerProductName: product.name,
      generalDescription: product.description
    };
    const headers = generateCoupangHeaders('PUT', path, '', coupangAccessKey, coupangSecretKey);
    const response = await axios.put(COUPANG_HOST + path, payload, { headers });
    
    if (response.data && response.data.code === 'SUCCESS') {
      logCallback(`[쿠팡] 상품 수정 성공!`, 'SUCCESS');
      db.addLog('COUPANG', 'SUCCESS', `상품 "${product.name}" 수정 완료`, response.data);
      return { success: true };
    } else {
      const errMsg = response.data.message || '알 수 없는 API 오류';
      logCallback(`[쿠팡] 상품 수정 실패: ${errMsg}`, 'ERROR');
      db.addLog('COUPANG', 'ERROR', `상품 "${product.name}" 수정 실패`, response.data);
      return { success: false, error: errMsg };
    }
  } catch (err) {
    const errorDetails = err.response ? err.response.data : err.message;
    logCallback(`[쿠팡] 상품 수정 통신 실패`, 'ERROR');
    db.addLog('COUPANG', 'ERROR', `상품 "${product.name}" 수정 통신 실패`, errorDetails);
    return { success: false, error: err.message };
  }
}

module.exports = {
  registerProduct,
  updateProduct,
  testConnection
};
