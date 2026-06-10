const db = require('../database');
const { missingCredentialError, unsupportedLiveError } = require('./live-validation');

const PLATFORM_NAME = 'SSG';
const CREDENTIAL_FIELDS = ['API Key', 'Partner ID'];

async function registerProduct(product, settings, logCallback = () => {}) {
  const { ssgApiKey, ssgPartnerId, simulationMode } = settings;
  logCallback(`[SSG] 상품 등록 시작: "${product.name}"`);

  if (simulationMode) {
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

  if (!ssgApiKey || !ssgPartnerId) {
    const errorMsg = missingCredentialError(PLATFORM_NAME, CREDENTIAL_FIELDS);
    logCallback(`[SSG] 상품 등록 차단: ${errorMsg}`, 'ERROR');
    db.addLog('SSG', 'ERROR', `상품 "${product.name}" 등록 차단`, errorMsg);
    return { success: false, error: errorMsg };
  }

  const errorMsg = unsupportedLiveError(PLATFORM_NAME);
  logCallback(`[SSG] 상품 등록 차단: ${errorMsg}`, 'ERROR');
  db.addLog('SSG', 'ERROR', `상품 "${product.name}" 등록 차단`, errorMsg);
  return { success: false, error: errorMsg };
}

async function updateProduct(product, settings, logCallback = () => {}) {
  const { ssgApiKey, ssgPartnerId, simulationMode } = settings;
  logCallback(`[SSG] 상품 수정 시작: "${product.name}" (ID: ${product.statusSsgId})`);

  if (simulationMode) {
    await new Promise(resolve => setTimeout(resolve, 600));
    logCallback(`[SSG] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('SSG', 'SUCCESS', `상품 "${product.name}" 수정 성공(시뮬레이션)`);
    return { success: true };
  }

  if (!ssgApiKey || !ssgPartnerId) {
    const errorMsg = missingCredentialError(PLATFORM_NAME, CREDENTIAL_FIELDS);
    logCallback(`[SSG] 상품 수정 차단: ${errorMsg}`, 'ERROR');
    db.addLog('SSG', 'ERROR', `상품 "${product.name}" 수정 차단`, errorMsg);
    return { success: false, error: errorMsg };
  }

  const errorMsg = unsupportedLiveError(PLATFORM_NAME);
  logCallback(`[SSG] 상품 수정 차단: ${errorMsg}`, 'ERROR');
  db.addLog('SSG', 'ERROR', `상품 "${product.name}" 수정 차단`, errorMsg);
  return { success: false, error: errorMsg };
}

async function testConnection(settings) {
  const { ssgApiKey, ssgPartnerId } = settings;
  if (!ssgApiKey || !ssgPartnerId) {
    return { success: false, message: missingCredentialError(PLATFORM_NAME, CREDENTIAL_FIELDS) };
  }
  return { success: false, message: unsupportedLiveError(PLATFORM_NAME) };
}

module.exports = {
  registerProduct,
  updateProduct,
  testConnection
};
