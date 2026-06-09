const axios = require('axios');
const db = require('../database');

const KAKAO_API_HOST = 'https://api.shopping-sell.kakao.com'; // 가상 도메인

async function registerProduct(product, settings, logCallback = () => {}) {
  const { kakaoApiKey, simulationMode } = settings;
  logCallback(`[카카오] 상품 등록 시작: "${product.name}"`);

  if (simulationMode || !kakaoApiKey) {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
    
    if (product.name.includes('오류') || product.name.includes('fail') || Math.random() < 0.08) {
      const errorMsg = '카카오 비즈니스 채널 연동 승인이 거절되었거나 상태가 활성화되어 있지 않습니다. (에러 코드: KK_AUTH_808)';
      logCallback(`[카카오] 상품 등록 실패: ${errorMsg}`, 'ERROR');
      db.addLog('KAKAO', 'ERROR', `상품 "${product.name}" 등록 실패`, errorMsg);
      return { success: false, error: errorMsg };
    }

    const mockId = 'kak_' + Math.random().toString(36).substr(2, 8);
    logCallback(`[카카오] 상품 등록 성공! 상품 ID: ${mockId}`, 'SUCCESS');
    db.addLog('KAKAO', 'SUCCESS', `상품 "${product.name}" 등록 성공`, { kakaoStoreProductId: mockId });
    return { success: true, productId: mockId };
  }

  try {
    const payload = {
      productName: product.name,
      basePrice: product.price,
      salePrice: product.price,
      stockQuantity: product.stock,
      categoryId: product.category || '50001375',
      content: product.description,
      deliveryType: product.shippingType === 'FREE' ? 'FREE' : 'PAID',
      deliveryFee: product.shippingType === 'FREE' ? 0 : product.shippingFee
    };

    db.addLog('KAKAO', 'INFO', `카카오 API 요청 전송: "${product.name}"`, payload);

    const response = await axios.post(`${KAKAO_API_HOST}/v1/products`, payload, {
      headers: {
        'Authorization': `Bearer ${kakaoApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.productId) {
      const productId = response.data.productId;
      logCallback(`[카카오] 상품 등록 성공! 상품 ID: ${productId}`, 'SUCCESS');
      db.addLog('KAKAO', 'SUCCESS', `상품 "${product.name}" 등록 성공`, response.data);
      return { success: true, productId };
    } else {
      const errMsg = response.data.message || '카카오 API 응답 오류';
      logCallback(`[카카오] 상품 등록 실패: ${errMsg}`, 'ERROR');
      return { success: false, error: errMsg };
    }
  } catch (err) {
    const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
    logCallback(`[카카오] API 호출 오류 발생: ${err.message}`, 'ERROR');
    db.addLog('KAKAO', 'ERROR', `상품 "${product.name}" 등록 실패`, errorMsg);
    return { success: false, error: err.message };
  }
}

async function updateProduct(product, settings, logCallback = () => {}) {
  const { kakaoApiKey, simulationMode } = settings;
  logCallback(`[카카오] 상품 수정 시작: "${product.name}" (ID: ${product.statusKakaoId})`);

  if (simulationMode || !kakaoApiKey) {
    await new Promise(resolve => setTimeout(resolve, 600));
    logCallback(`[카카오] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('KAKAO', 'SUCCESS', `상품 "${product.name}" 수정 성공(시뮬레이션)`);
    return { success: true };
  }

  try {
    const payload = {
      productId: product.statusKakaoId,
      productName: product.name,
      salePrice: product.price,
      stockQuantity: product.stock
    };

    const response = await axios.put(`${KAKAO_API_HOST}/v1/products/${product.statusKakaoId}`, payload, {
      headers: { 'Authorization': `Bearer ${kakaoApiKey}` }
    });

    logCallback(`[카카오] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('KAKAO', 'SUCCESS', `상품 "${product.name}" 수정 성공`, response.data);
    return { success: true };
  } catch (err) {
    logCallback(`[카카오] 상품 수정 실패: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

module.exports = {
  registerProduct,
  updateProduct
};
