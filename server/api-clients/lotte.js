const axios = require('axios');
const db = require('../database');

const LOTTE_API_HOST = 'https://openapi.lotteon.com'; // 가상 도메인

async function registerProduct(product, settings, logCallback = () => {}) {
  const { lotteApiKey, lotteVendorNo, simulationMode } = settings;
  logCallback(`[롯데온] 상품 등록 시작: "${product.name}"`);

  if (simulationMode || !lotteApiKey || !lotteVendorNo) {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
    
    if (product.name.includes('오류') || product.name.includes('fail') || Math.random() < 0.08) {
      const errorMsg = '거래처(Vendor) 출고지 주소 정보가 설정되지 않았습니다. (에러 코드: LOM_ADR_992)';
      logCallback(`[롯데온] 상품 등록 실패: ${errorMsg}`, 'ERROR');
      db.addLog('LOTTE', 'ERROR', `상품 "${product.name}" 등록 실패`, errorMsg);
      return { success: false, error: errorMsg };
    }

    const mockId = 'lot_' + Math.random().toString(36).substr(2, 8);
    logCallback(`[롯데온] 상품 등록 성공! 상품 ID: ${mockId}`, 'SUCCESS');
    db.addLog('LOTTE', 'SUCCESS', `상품 "${product.name}" 등록 성공`, { spdNo: mockId });
    return { success: true, productId: mockId };
  }

  try {
    const payload = {
      vendorNo: lotteVendorNo,
      spdNm: product.name,
      sellPrC: product.price,
      estQty: product.stock,
      stdCtgNo: product.category || '50001375',
      spdDesc: product.description,
      shippingFeeType: product.shippingType === 'FREE' ? 'FREE' : 'PAID',
      shippingFee: product.shippingType === 'FREE' ? 0 : product.shippingFee
    };

    db.addLog('LOTTE', 'INFO', `롯데온 API 요청 전송: "${product.name}"`, payload);

    const response = await axios.post(`${LOTTE_API_HOST}/v1/product/register`, payload, {
      headers: {
        'Lotteon-Openapi-Key': lotteApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.spdNo) {
      const spdNo = response.data.spdNo;
      logCallback(`[롯데온] 상품 등록 성공! 상품 ID: ${spdNo}`, 'SUCCESS');
      db.addLog('LOTTE', 'SUCCESS', `상품 "${product.name}" 등록 성공`, response.data);
      return { success: true, productId: spdNo };
    } else {
      const errMsg = response.data.message || '롯데온 API 응답 오류';
      logCallback(`[롯데온] 상품 등록 실패: ${errMsg}`, 'ERROR');
      return { success: false, error: errMsg };
    }
  } catch (err) {
    const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
    logCallback(`[롯데온] API 호출 오류 발생: ${err.message}`, 'ERROR');
    db.addLog('LOTTE', 'ERROR', `상품 "${product.name}" 등록 실패`, errorMsg);
    return { success: false, error: err.message };
  }
}

async function updateProduct(product, settings, logCallback = () => {}) {
  const { lotteApiKey, simulationMode } = settings;
  logCallback(`[롯데온] 상품 수정 시작: "${product.name}" (ID: ${product.statusLotteId})`);

  if (simulationMode || !lotteApiKey) {
    await new Promise(resolve => setTimeout(resolve, 600));
    logCallback(`[롯데온] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('LOTTE', 'SUCCESS', `상품 "${product.name}" 수정 성공(시뮬레이션)`);
    return { success: true };
  }

  try {
    const payload = {
      spdNo: product.statusLotteId,
      spdNm: product.name,
      sellPrC: product.price,
      estQty: product.stock
    };

    const response = await axios.put(`${LOTTE_API_HOST}/v1/product/update`, payload, {
      headers: { 'Lotteon-Openapi-Key': lotteApiKey }
    });

    logCallback(`[롯데온] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('LOTTE', 'SUCCESS', `상품 "${product.name}" 수정 성공`, response.data);
    return { success: true };
  } catch (err) {
    logCallback(`[롯데온] 상품 수정 실패: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

module.exports = {
  registerProduct,
  updateProduct
};
