const db = require('../database');
const { missingCredentialError, unsupportedLiveError } = require('./live-validation');

const PLATFORM_NAME = '롯데온';
const CREDENTIAL_FIELDS = ['API Key', '거래처 번호'];

async function registerProduct(product, settings, logCallback = () => {}) {
  const { lotteApiKey, lotteVendorNo, simulationMode } = settings;
  logCallback(`[롯데온] 상품 등록 시작: "${product.name}"`);

  if (simulationMode) {
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

  if (!lotteApiKey || !lotteVendorNo) {
    const errorMsg = missingCredentialError(PLATFORM_NAME, CREDENTIAL_FIELDS);
    logCallback(`[롯데온] 상품 등록 차단: ${errorMsg}`, 'ERROR');
    db.addLog('LOTTE', 'ERROR', `상품 "${product.name}" 등록 차단`, errorMsg);
    return { success: false, error: errorMsg };
  }

  const errorMsg = unsupportedLiveError(PLATFORM_NAME);
  logCallback(`[롯데온] 상품 등록 차단: ${errorMsg}`, 'ERROR');
  db.addLog('LOTTE', 'ERROR', `상품 "${product.name}" 등록 차단`, errorMsg);
  return { success: false, error: errorMsg };
}

async function updateProduct(product, settings, logCallback = () => {}) {
  const { lotteApiKey, lotteVendorNo, simulationMode } = settings;
  logCallback(`[롯데온] 상품 수정 시작: "${product.name}" (ID: ${product.statusLotteId})`);

  if (simulationMode) {
    await new Promise(resolve => setTimeout(resolve, 600));
    logCallback(`[롯데온] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('LOTTE', 'SUCCESS', `상품 "${product.name}" 수정 성공(시뮬레이션)`);
    return { success: true };
  }

  if (!lotteApiKey || !lotteVendorNo) {
    const errorMsg = missingCredentialError(PLATFORM_NAME, CREDENTIAL_FIELDS);
    logCallback(`[롯데온] 상품 수정 차단: ${errorMsg}`, 'ERROR');
    db.addLog('LOTTE', 'ERROR', `상품 "${product.name}" 수정 차단`, errorMsg);
    return { success: false, error: errorMsg };
  }

  const errorMsg = unsupportedLiveError(PLATFORM_NAME);
  logCallback(`[롯데온] 상품 수정 차단: ${errorMsg}`, 'ERROR');
  db.addLog('LOTTE', 'ERROR', `상품 "${product.name}" 수정 차단`, errorMsg);
  return { success: false, error: errorMsg };
}

async function testConnection(settings) {
  const { lotteApiKey, lotteVendorNo } = settings;
  if (!lotteApiKey || !lotteVendorNo) {
    return { success: false, message: missingCredentialError(PLATFORM_NAME, CREDENTIAL_FIELDS) };
  }
  return { success: false, message: unsupportedLiveError(PLATFORM_NAME) };
}

module.exports = {
  registerProduct,
  updateProduct,
  testConnection
};
