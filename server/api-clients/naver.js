const bcrypt = require('bcryptjs');
const axios = require('axios');
const db = require('../database');

const NAVER_API_HOST = 'https://api.commerce.naver.com/external';

// 토큰 인메모리 캐싱 (유효기간 대응)
let cachedToken = null;
let tokenExpiry = null;

// 네이버 client_secret_sign 전자서명 생성
function generateNaverSign(clientId, clientSecret, timestamp) {
  const password = `${clientId}_${timestamp}`;
  
  // bcryptjs를 이용해 clientSecret을 솔트로 사용하여 해싱
  const hashed = bcrypt.hashSync(password, clientSecret);
  
  // 결과를 Base64 인코딩
  return Buffer.from(hashed).toString('base64');
}

// Access Token 발급 요청
async function getAccessToken(clientId, clientSecret) {
  // 캐시 검증 (만료 1분 전 여유 공간)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const timestamp = Date.now().toString();
  const clientSecretSign = generateNaverSign(clientId, clientSecret, timestamp);

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('timestamp', timestamp);
    params.append('grant_type', 'client_credentials');
    params.append('client_secret_sign', clientSecretSign);
    params.append('type', 'SELF');

    const response = await axios.post(
      `${NAVER_API_HOST}/v1/oauth2/token`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data && response.data.access_token) {
      cachedToken = response.data.access_token;
      // expires_in은 보통 초 단위 (예: 3600초)
      tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      db.addLog('NAVER', 'INFO', '네이버 API 토큰 신규 발급 성공');
      return cachedToken;
    } else {
      throw new Error('토큰 응답에 access_token이 누락되었습니다.');
    }
  } catch (err) {
    const errDetails = err.response ? err.response.data : err.message;
    db.addLog('NAVER', 'ERROR', '네이버 API 토큰 발급 실패', errDetails);
    throw new Error(`토큰 발급 실패: ${err.message}`);
  }
}

/**
 * 네이버 스마트스토어 상품 등록 API 호출
 */
async function registerProduct(product, settings, logCallback = () => {}) {
  const { naverClientId, naverClientSecret, simulationMode } = settings;
  
  logCallback(`[네이버] 상품 등록 시작: "${product.name}"`);

  // --- 시뮬레이션 모드 (Mock) ---
  if (simulationMode || !naverClientId || !naverClientSecret) {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
    
    if (product.name.includes('오류') || product.name.includes('fail') || Math.random() < 0.08) {
      const errorMsg = '해당 카테고리에 유효한 고시 정보가 누락되었습니다. (에러 코드: NAV_ERR_019)';
      logCallback(`[네이버] 상품 등록 실패: ${errorMsg}`, 'ERROR');
      db.addLog('NAVER', 'ERROR', `상품 "${product.name}" 등록 실패`, errorMsg);
      return { success: false, error: errorMsg };
    }

    const mockSellerProductId = 'mock_n_' + Math.random().toString(36).substr(2, 8);
    logCallback(`[네이버] 상품 등록 성공! 상품ID: ${mockSellerProductId}`, 'SUCCESS');
    db.addLog('NAVER', 'SUCCESS', `상품 "${product.name}" 등록 성공`, { smartstoreProductId: mockSellerProductId });
    return { success: true, productId: mockSellerProductId };
  }

  // --- 실제 API 호출 모드 ---
  try {
    const token = await getAccessToken(naverClientId, naverClientSecret);

    // 네이버 스마트스토어 규격 페이로드 구축
    const payload = {
      originProduct: {
        statusType: 'SALE',
        name: product.name,
        leafCategoryId: product.category || '50001375', // 카테고리
        images: {
          representativeImage: {
            url: product.image || 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1'
          },
          optionalImages: product.subImages 
            ? product.subImages.split(',').map(url => ({ url: url.trim() }))
            : []
        },
        detailContent: product.description,
        salePrice: product.price,
        stockQuantity: product.stock,
        deliveryInfo: {
          deliveryType: 'DELIVERY',
          deliveryAttributeType: 'NORMAL',
          deliveryFeeType: product.shippingType === 'FREE' ? 'FREE' : 'PAID',
          baseFee: product.shippingType === 'FREE' ? 0 : (product.shippingFee || 3000)
        },
        detailAttribute: {
          originAreaInfo: {
            originAreaType: product.origin === 'FOREIGN' ? 'IMPORT' : 'DOMESTIC',
            // 필수 상세값 임의 기입 또는 국내 고정
            importer: product.origin === 'FOREIGN' ? '수입협력업체' : ''
          }
        }
      }
    };

    db.addLog('NAVER', 'INFO', `네이버 API 요청 전송: "${product.name}"`, payload);

    const response = await axios.post(
      `${NAVER_API_HOST}/v1/products`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 12000
      }
    );

    if (response.data && response.data.smartstoreProductId) {
      const smartstoreProductId = response.data.smartstoreProductId;
      logCallback(`[네이버] 상품 등록 성공! 상품ID: ${smartstoreProductId}`, 'SUCCESS');
      db.addLog('NAVER', 'SUCCESS', `상품 "${product.name}" 등록 성공`, response.data);
      return { success: true, productId: smartstoreProductId };
    } else {
      logCallback(`[네이버] 상품 등록 완료 되었으나 상품 ID를 받지 못했습니다.`, 'ERROR');
      return { success: false, error: '응답 내 상품 ID 누락' };
    }
  } catch (err) {
    const errorDetails = err.response ? err.response.data : err.message;
    const errorMsg = errorDetails.message || errorDetails.error || err.message;
    logCallback(`[네이버] API 호출 오류 발생: ${errorMsg}`, 'ERROR');
    db.addLog('NAVER', 'ERROR', `상품 "${product.name}" 등록 실패`, errorDetails);
    return { success: false, error: errorMsg };
  }
}

/**
 * 네이버 스마트스토어 상품 정보 수정 API 호출
 */
async function updateProduct(product, settings, logCallback = () => {}) {
  const { naverClientId, naverClientSecret, simulationMode } = settings;
  logCallback(`[네이버] 상품 수정 요청: "${product.name}" (ID: ${product.statusNaverId})`);

  if (simulationMode || !naverClientId || !naverClientSecret) {
    await new Promise(resolve => setTimeout(resolve, 600));
    logCallback(`[네이버] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('NAVER', 'SUCCESS', `상품 "${product.name}" 정보 수정 성공(시뮬레이션)`);
    return { success: true };
  }

  try {
    const token = await getAccessToken(naverClientId, naverClientSecret);
    const path = `/v1/products/${product.statusNaverId}`;
    const payload = {
      name: product.name,
      salePrice: product.price,
      stockQuantity: product.stock,
      deliveryInfo: {
        baseFee: product.shippingType === 'FREE' ? 0 : (product.shippingFee || 3000)
      }
    };

    const response = await axios.put(
      `${NAVER_API_HOST}${path}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logCallback(`[네이버] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('NAVER', 'SUCCESS', `상품 "${product.name}" 수정 성공`, response.data);
    return { success: true };
  } catch (err) {
    const errorDetails = err.response ? err.response.data : err.message;
    logCallback(`[네이버] 상품 수정 실패`, 'ERROR');
    db.addLog('NAVER', 'ERROR', `상품 "${product.name}" 수정 실패`, errorDetails);
    return { success: false, error: err.message };
  }
}

module.exports = {
  registerProduct,
  updateProduct
};
