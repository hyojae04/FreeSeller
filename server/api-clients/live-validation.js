function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function isPositiveNumber(value) {
  if (isBlank(value)) return false;
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

function isNonNegativeNumber(value) {
  if (isBlank(value)) return false;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

function isHttpUrl(value) {
  if (isBlank(value)) return false;
  try {
    const parsed = new URL(String(value).trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isNonEmptyJsonArray(value) {
  if (isBlank(value)) return false;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

function validateCommonLiveProduct(product) {
  const errors = [];

  if (isBlank(product.name)) errors.push('상품명');
  if (!isPositiveNumber(product.price)) errors.push('판매가');
  if (!isNonNegativeNumber(product.stock)) errors.push('재고수량');
  if (isBlank(product.category) || !/^\d+$/.test(String(product.category).trim())) {
    errors.push('실제 카테고리 ID');
  }
  if (!isHttpUrl(product.image)) errors.push('대표 이미지 URL');
  if (isBlank(product.description)) errors.push('상세 설명');
  if (isBlank(product.shippingType)) errors.push('배송 구분');
  if (product.shippingType !== 'FREE' && !isNonNegativeNumber(product.shippingFee)) {
    errors.push('배송비');
  }

  return errors;
}

function validateNaverLiveProduct(product, settings) {
  const errors = validateCommonLiveProduct(product);
  if (isBlank(product.origin)) errors.push('원산지');
  if (isBlank(settings.naverNoticeCategoryType)) errors.push('네이버 상품 고시정보 분류');
  return errors;
}

function validateCoupangLiveProduct(product, settings) {
  const errors = validateCommonLiveProduct(product);

  if (isBlank(product.brandName || product.brand)) errors.push('브랜드명');
  if (isBlank(product.modelName)) errors.push('모델명');
  if (isBlank(settings.coupangDeliveryCompanyCode)) errors.push('쿠팡 택배사 코드');
  if (isBlank(settings.coupangOutboundShippingPlaceCode)) errors.push('쿠팡 출고지 코드');
  if (isBlank(settings.coupangVendorUserId)) errors.push('쿠팡 Wing 사용자 ID');
  if (isBlank(settings.coupangReturnCenterCode)) errors.push('쿠팡 반품지 센터 코드');
  if (isBlank(settings.coupangReturnChargeName)) errors.push('쿠팡 반품지명');
  if (isBlank(settings.coupangCompanyContactNumber)) errors.push('쿠팡 반품지 연락처');
  if (isBlank(settings.coupangReturnZipCode)) errors.push('쿠팡 반품지 우편번호');
  if (isBlank(settings.coupangReturnAddress)) errors.push('쿠팡 반품지 주소');
  if (!isNonNegativeNumber(settings.coupangDeliveryChargeOnReturn)) errors.push('쿠팡 초기 반품 배송비');
  if (!isNonNegativeNumber(settings.coupangReturnCharge)) errors.push('쿠팡 반품 배송비');
  if (isBlank(settings.coupangNoticeCategoryName)) errors.push('쿠팡 상품 고시정보 분류');
  if (!isNonEmptyJsonArray(settings.coupangNoticeDetailsJson)) errors.push('쿠팡 고시정보 상세 JSON 배열');
  if (!isNonEmptyJsonArray(settings.coupangAttributesJson)) errors.push('쿠팡 속성 JSON 배열');

  return errors;
}

function buildValidationError(platformName, errors) {
  if (errors.length === 0) return null;
  return `${platformName} 실제 상품 등록 전 필수값을 확인해주세요: ${errors.join(', ')}`;
}

function missingCredentialError(platformName, fields) {
  return `${platformName} 실제 API 모드에서는 ${fields.join(', ')} 인증 정보가 필요합니다.`;
}

function unsupportedLiveError(platformName) {
  return `${platformName} 실제 API 연동은 공식 스펙 기반 구현이 완료될 때까지 비활성화되어 있습니다. 시뮬레이션 모드에서만 테스트할 수 있습니다.`;
}

module.exports = {
  buildValidationError,
  missingCredentialError,
  unsupportedLiveError,
  validateCoupangLiveProduct,
  validateNaverLiveProduct
};
