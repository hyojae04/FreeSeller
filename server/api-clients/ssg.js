const axios = require('axios');
const db = require('../database');

const SSG_API_HOST = 'https://api.ssgadm.com'; // 가상 도메인

async function registerProduct(product, settings, logCallback = () => {}) {
  const { ssgApiKey, ssgPartnerId, simulationMode } = settings;
  logCallback(`[SSG] 상품 등록 시작: "${product.name}"`);

  if (simulationMode || !ssgApiKey || !ssgPartnerId) {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
    
    if (product.name.includes('오류') || product.name.includes('fail') || Math.random() < 0.08) {
      const errorMsg = 'SSG 표준 마진율 카테고리가 매핑되지 않았습니다. (에러 코드: SSG_ERR_302)';
      logCallback(`[SSG] 상품 등록 실패: ${errorMsg}`, 'ERROR');
      db.addLog('SSG', 'ERROR', `상품 "${product.name}" 등록 실패`, errorMsg);
      return { success: false, error: errorMsg };
    }

    const mockId = 'ssg_' + Math.random().toString(36).substr(2, 8);
    logCallback(`[SSG] 상품 등록 성공! 상품 ID: ${mockId}`, 'SUCCESS');
    db.addLog('SSG', 'SUCCESS', `상품 "${product.name}" 등록 성공`, { ssgItemId: mockId });
    return { success: true, productId: mockId };
  }

  try {
    const payload = {
      partnerId: ssgPartnerId,
      itemId: product.id,
      itemName: product.name,
      sellPrice: product.price,
      stockQty: product.stock,
      dispCtgNo: product.category || '50001375',
      itemDetail: product.description,
      shippingFeeType: product.shippingType === 'FREE' ? '10' : '20',
      shippingFee: product.shippingType === 'FREE' ? 0 : product.shippingFee
    };

    db.addLog('SSG', 'INFO', `SSG API 요청 전송: "${product.name}"`, payload);

    // 실제 ssg api는 헤더에 Authorization 인증키 등을 실어서 보냅니다.
    const response = await axios.post(`${SSG_API_HOST}/v1/item/register`, payload, {
      headers: {
        'Authorization': `Bearer ${ssgApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.success) {
      const ssgItemId = response.data.ssgItemId;
      logCallback(`[SSG] 상품 등록 성공! 상품 ID: ${ssgItemId}`, 'SUCCESS');
      db.addLog('SSG', 'SUCCESS', `상품 "${product.name}" 등록 성공`, response.data);
      return { success: true, productId: ssgItemId };
    } else {
      const errMsg = response.data.message || 'SSG API 오류';
      logCallback(`[SSG] 상품 등록 실패: ${errMsg}`, 'ERROR');
      return { success: false, error: errMsg };
    }
  } catch (err) {
    const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
    logCallback(`[SSG] API 호출 오류 발생: ${err.message}`, 'ERROR');
    db.addLog('SSG', 'ERROR', `상품 "${product.name}" 등록 실패`, errorMsg);
    return { success: false, error: err.message };
  }
}

async function updateProduct(product, settings, logCallback = () => {}) {
  const { ssgApiKey, simulationMode } = settings;
  logCallback(`[SSG] 상품 수정 시작: "${product.name}" (ID: ${product.statusSsgId})`);

  if (simulationMode || !ssgApiKey) {
    await new Promise(resolve => setTimeout(resolve, 600));
    logCallback(`[SSG] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('SSG', 'SUCCESS', `상품 "${product.name}" 수정 성공(시뮬레이션)`);
    return { success: true };
  }

  try {
    const payload = {
      itemId: product.statusSsgId,
      itemName: product.name,
      sellPrice: product.price,
      stockQty: product.stock
    };

    const response = await axios.put(`${SSG_API_HOST}/v1/item/update`, payload, {
      headers: { 'Authorization': `Bearer ${ssgApiKey}` }
    });

    logCallback(`[SSG] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('SSG', 'SUCCESS', `상품 "${product.name}" 수정 성공`, response.data);
    return { success: true };
  } catch (err) {
    logCallback(`[SSG] 상품 수정 실패: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

module.exports = {
  registerProduct,
  updateProduct
};
