const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

class JSONDatabase {
  constructor() {
    this.data = {
      products: [],
      settings: {
        coupangVendorId: '',
        coupangAccessKey: '',
        coupangSecretKey: '',
        naverClientId: '',
        naverClientSecret: '',
        naverStoreId: '',
        ssgApiKey: '',
        ssgPartnerId: '',
        lotteApiKey: '',
        lotteVendorNo: '',
        kakaoApiKey: '',
        simulationMode: true // 시뮬레이션 모드 기본 활성화
      },
      logs: []
    };
    this.init();
  }

  init() {
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    // 파일이 있으면 로드, 없으면 초기 데이터로 파일 생성
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          products: parsed.products || [],
          settings: { ...this.data.settings, ...(parsed.settings || {}) },
          logs: parsed.logs || []
        };
      } catch (err) {
        console.error('데이터베이스 로드 중 오류 발생, 초기화합니다:', err);
        this.save();
      }
    } else {
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('데이터베이스 저장 중 오류 발생:', err);
    }
  }

  // --- Products CRUD ---
  getProducts() {
    return this.data.products;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  insertProduct(product) {
    // 합성 ID 생성 (쇼핑몰코드 + 품번코드)
    const mallCode = product.mallCode || '';
    const productCode = product.productCode || '';
    const id = `${mallCode}_${productCode}`;

    const existingIndex = this.data.products.findIndex(p => p.id === id);

    const baseProduct = {
      id,
      name: product.name || '',
      category: product.category || '50001375',
      price: Number(product.price) || 0,
      stock: Number(product.stock) !== undefined && !isNaN(Number(product.stock)) ? Number(product.stock) : 99,
      image: product.image || '',
      subImages: product.subImages || '',
      description: product.description || '<p>상세설명</p>',
      shippingType: product.shippingType || 'FREE', // FREE, PAID, CONDITIONAL_FREE
      shippingFee: Number(product.shippingFee) || 0,
      origin: product.origin || 'DOMESTIC',
      optionName: product.optionName || '',
      optionValue: product.optionValue || '',
      
      // New Sabangnet Schema Fields
      productCode,
      mallCode,
      mallName: product.mallName || '',
      mallPrice: Number(product.mallPrice) || 0,
      mallProductName: product.mallProductName || '',
      mallDescription: product.mallDescription || '',
      cost: Number(product.cost) || 0,
      cost2: Number(product.cost2) || 0,
      mallAttrClassCode: product.mallAttrClassCode || '',
      mallPromotionText: product.mallPromotionText || '',
      extraInfoCode2: product.extraInfoCode2 || '',
      sellerProductCode: product.sellerProductCode || '',
      mallCost: Number(product.mallCost) || 0,
      stockSplitPercent: Number(product.stockSplitPercent) || 0,
      stockSplitDecimal: product.stockSplitDecimal || '',
      certNo: product.certNo || '',
      issueDate: product.issueDate || '',
      certDate: product.certDate || '',
      expiryStartDate: product.expiryStartDate || '',
      expiryEndDate: product.expiryEndDate || '',
      certOrg: product.certOrg || '',
      certField: product.certField || '',
      brandName: product.brandName || '',
      modelName: product.modelName || '',
      productCertSeq: Number(product.productCertSeq) || 0,

      statusCoupang: 'NOT_REGISTERED', // NOT_REGISTERED, SUCCESS, ERROR
      statusNaver: 'NOT_REGISTERED',
      statusSsg: 'NOT_REGISTERED',
      statusLotte: 'NOT_REGISTERED',
      statusKakao: 'NOT_REGISTERED',
      statusCoupangId: null,
      statusNaverId: null,
      statusSsgId: null,
      statusLotteId: null,
      statusKakaoId: null,
      lastSyncCoupang: null,
      lastSyncNaver: null,
      lastSyncSsg: null,
      lastSyncLotte: null,
      lastSyncKakao: null,
      errorCoupang: '',
      errorNaver: '',
      errorSsg: '',
      errorLotte: '',
      errorKakao: ''
    };

    // merge with passed product properties (but types are forced in baseProduct)
    const mergedProduct = {
      ...baseProduct,
      ...product,
      id, // force ID format
      updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      // 기존 상품이 있을 때 Upsert (덮어쓰기)
      // 기존의 연동 완료 정보(status, lastSync, error)는 유지하면서 업데이트합니다.
      const existing = this.data.products[existingIndex];
      const updated = {
        ...existing,
        ...mergedProduct,
        // 기존 연동 상태 명시적 보존
        statusCoupang: existing.statusCoupang,
        statusNaver: existing.statusNaver,
        statusSsg: existing.statusSsg,
        statusLotte: existing.statusLotte,
        statusKakao: existing.statusKakao,
        statusCoupangId: existing.statusCoupangId,
        statusNaverId: existing.statusNaverId,
        statusSsgId: existing.statusSsgId,
        statusLotteId: existing.statusLotteId,
        statusKakaoId: existing.statusKakaoId,
        lastSyncCoupang: existing.lastSyncCoupang,
        lastSyncNaver: existing.lastSyncNaver,
        lastSyncSsg: existing.lastSyncSsg,
        lastSyncLotte: existing.lastSyncLotte,
        lastSyncKakao: existing.lastSyncKakao,
        errorCoupang: existing.errorCoupang,
        errorNaver: existing.errorNaver,
        errorSsg: existing.errorSsg,
        errorLotte: existing.errorLotte,
        errorKakao: existing.errorKakao,
        createdAt: existing.createdAt // 최초 생성일 유지
      };
      this.data.products[existingIndex] = updated;
      this.save();
      return updated;
    } else {
      // 신규 등록
      mergedProduct.createdAt = new Date().toISOString();
      this.data.products.push(mergedProduct);
      this.save();
      return mergedProduct;
    }
  }

  updateProduct(id, updates) {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const current = this.data.products[index];
    
    // mallCode나 productCode 변경 시 ID 갱신 필요
    let newId = id;
    if (updates.mallCode !== undefined || updates.productCode !== undefined) {
      const mCode = updates.mallCode !== undefined ? updates.mallCode : current.mallCode;
      const pCode = updates.productCode !== undefined ? updates.productCode : current.productCode;
      newId = `${mCode}_${pCode}`;
    }

    this.data.products[index] = {
      ...current,
      ...updates,
      id: newId,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.products[index];
  }

  deleteProduct(id) {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.data.products.splice(index, 1);
    this.save();
    return true;
  }

  bulkUpdateProducts(ids, updates) {
    let count = 0;
    this.data.products = this.data.products.map(p => {
      if (ids.includes(p.id)) {
        count++;
        // 가격 인상 등 수식 계산 기능 처리 (클라이언트에서 연산된 값으로 오거나, 특별한 처리)
        let newPrice = p.price;
        if (updates.priceOffsetType === 'add') {
          newPrice = Math.max(0, p.price + (Number(updates.priceOffset) || 0));
        } else if (updates.priceOffsetType === 'percent') {
          newPrice = Math.max(0, Math.round(p.price * (1 + (Number(updates.priceOffset) || 0) / 100)));
        } else if (updates.price !== undefined) {
          newPrice = Number(updates.price);
        }

        let newName = p.name;
        if (updates.namePrefix) {
          newName = updates.namePrefix + newName;
        }
        if (updates.nameSuffix) {
          newName = newName + updates.nameSuffix;
        }
        if (updates.nameReplaceTarget && updates.nameReplaceVal !== undefined) {
          newName = newName.split(updates.nameReplaceTarget).join(updates.nameReplaceVal);
        }

        const merged = {
          ...p,
          name: newName,
          price: newPrice,
          updatedAt: new Date().toISOString()
        };

        // 기타 필드 일괄 복사
        ['category', 'stock', 'shippingType', 'shippingFee', 'origin'].forEach(field => {
          if (updates[field] !== undefined) {
            merged[field] = updates[field];
          }
        });

        return merged;
      }
      return p;
    });

    if (count > 0) this.save();
    return count;
  }

  // --- Settings CRUD ---
  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings
    };
    this.save();
    return this.data.settings;
  }

  // --- Logs CRUD ---
  getLogs() {
    return this.data.logs;
  }

  addLog(platform, type, message, details = '') {
    const log = {
      id: 'log_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      platform, // COUPANG, NAVER, SYSTEM
      type, // INFO, SUCCESS, ERROR
      message,
      details: typeof details === 'object' ? JSON.stringify(details, null, 2) : details
    };
    
    // 로그는 최근 500개만 보관하여 파일 크기 최적화
    this.data.logs.unshift(log);
    if (this.data.logs.length > 500) {
      this.data.logs.pop();
    }
    
    this.save();
    return log;
  }

  clearLogs() {
    this.data.logs = [];
    this.save();
  }
}

module.exports = new JSONDatabase();
