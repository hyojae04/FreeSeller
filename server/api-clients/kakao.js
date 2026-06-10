const db = require('../database');
const { missingCredentialError, unsupportedLiveError } = require('./live-validation');

const PLATFORM_NAME = '카카오';
const CREDENTIAL_FIELDS = ['API Key'];

async function registerProduct(product, settings, logCallback = () => {}) {
  const { kakaoApiKey, simulationMode } = settings;
  logCallback(`[카카오] 상품 등록 시작: "${product.name}"`);

  if (simulationMode) {
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

  if (!kakaoApiKey) {
    const errorMsg = missingCredentialError(PLATFORM_NAME, CREDENTIAL_FIELDS);
    logCallback(`[카카오] 상품 등록 차단: ${errorMsg}`, 'ERROR');
    db.addLog('KAKAO', 'ERROR', `상품 "${product.name}" 등록 차단`, errorMsg);
    return { success: false, error: errorMsg };
  }

  const errorMsg = unsupportedLiveError(PLATFORM_NAME);
  logCallback(`[카카오] 상품 등록 차단: ${errorMsg}`, 'ERROR');
  db.addLog('KAKAO', 'ERROR', `상품 "${product.name}" 등록 차단`, errorMsg);
  return { success: false, error: errorMsg };
}

async function updateProduct(product, settings, logCallback = () => {}) {
  const { kakaoApiKey, simulationMode } = settings;
  logCallback(`[카카오] 상품 수정 시작: "${product.name}" (ID: ${product.statusKakaoId})`);

  if (simulationMode) {
    await new Promise(resolve => setTimeout(resolve, 600));
    logCallback(`[카카오] 상품 수정 성공!`, 'SUCCESS');
    db.addLog('KAKAO', 'SUCCESS', `상품 "${product.name}" 수정 성공(시뮬레이션)`);
    return { success: true };
  }

  if (!kakaoApiKey) {
    const errorMsg = missingCredentialError(PLATFORM_NAME, CREDENTIAL_FIELDS);
    logCallback(`[카카오] 상품 수정 차단: ${errorMsg}`, 'ERROR');
    db.addLog('KAKAO', 'ERROR', `상품 "${product.name}" 수정 차단`, errorMsg);
    return { success: false, error: errorMsg };
  }

  const errorMsg = unsupportedLiveError(PLATFORM_NAME);
  logCallback(`[카카오] 상품 수정 차단: ${errorMsg}`, 'ERROR');
  db.addLog('KAKAO', 'ERROR', `상품 "${product.name}" 수정 차단`, errorMsg);
  return { success: false, error: errorMsg };
}

async function testConnection(settings) {
  const { kakaoApiKey } = settings;
  if (!kakaoApiKey) {
    return { success: false, message: missingCredentialError(PLATFORM_NAME, CREDENTIAL_FIELDS) };
  }
  return { success: false, message: unsupportedLiveError(PLATFORM_NAME) };
}

module.exports = {
  registerProduct,
  updateProduct,
  testConnection
};
