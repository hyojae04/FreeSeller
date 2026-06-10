const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require('./database');
const excelHandler = require('./excel-handler');
const coupang = require('./api-clients/coupang');
const naver = require('./api-clients/naver');
const ssg = require('./api-clients/ssg');
const lotte = require('./api-clients/lotte');
const kakao = require('./api-clients/kakao');

const app = express();
const PORT = process.env.PORT || 5001;

const SYNC_PLATFORMS = {
  coupang: {
    label: 'COUPANG',
    destinationName: '쿠팡에',
    client: coupang,
    statusField: 'statusCoupang',
    idField: 'statusCoupangId',
    errorField: 'errorCoupang',
    lastSyncField: 'lastSyncCoupang'
  },
  naver: {
    label: 'NAVER',
    destinationName: '네이버 스마트스토어에',
    client: naver,
    statusField: 'statusNaver',
    idField: 'statusNaverId',
    errorField: 'errorNaver',
    lastSyncField: 'lastSyncNaver'
  },
  ssg: {
    label: 'SSG',
    destinationName: 'SSG에',
    client: ssg,
    statusField: 'statusSsg',
    idField: 'statusSsgId',
    errorField: 'errorSsg',
    lastSyncField: 'lastSyncSsg'
  },
  lotte: {
    label: 'LOTTE',
    destinationName: '롯데온에',
    client: lotte,
    statusField: 'statusLotte',
    idField: 'statusLotteId',
    errorField: 'errorLotte',
    lastSyncField: 'lastSyncLotte'
  },
  kakao: {
    label: 'KAKAO',
    destinationName: '카카오 톡스토어에',
    client: kakao,
    statusField: 'statusKakao',
    idField: 'statusKakaoId',
    errorField: 'errorKakao',
    lastSyncField: 'lastSyncKakao'
  }
};

const CONNECTION_TESTERS = Object.fromEntries(
  Object.entries(SYNC_PLATFORMS).map(([platform, config]) => [platform, config.client])
);

// CORS 설정 - 모든 로컬 개발 주소 허용
app.use(cors());
app.use(express.json());

// 멀터 임시 폴더 설정
const uploadDir = path.join(__dirname, 'temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

function sendSyncHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
}

async function syncProductToPlatform(productId, product, platform, settings, percent, sendEvent) {
  const config = SYNC_PLATFORMS[platform];
  if (!config) return;

  const isRegistered = product[config.statusField] === 'SUCCESS' && product[config.idField];
  const handler = isRegistered ? config.client.updateProduct : config.client.registerProduct;

  sendEvent('status', {
    productId,
    platform: config.label,
    message: `${config.destinationName} 상품 ${isRegistered ? '수정' : '등록'} 요청 중...`,
    percent
  });

  try {
    const result = await handler(product, settings, (msg, type = 'INFO') => {
      sendEvent('console', { platform: config.label, type, message: msg });
    });

    if (result.success) {
      const updates = {
        [config.statusField]: 'SUCCESS',
        [config.errorField]: '',
        [config.lastSyncField]: new Date().toISOString()
      };
      if (result.productId) updates[config.idField] = result.productId;
      db.updateProduct(productId, updates);
      sendEvent('product_success', {
        productId,
        platform: config.label,
        productIdOut: result.productId || product[config.idField]
      });
      return;
    }

    db.updateProduct(productId, {
      [config.statusField]: 'ERROR',
      [config.errorField]: result.error,
      [config.lastSyncField]: new Date().toISOString()
    });
    sendEvent('product_error', { productId, platform: config.label, error: result.error });
  } catch (err) {
    sendEvent('console', {
      platform: config.label,
      type: 'ERROR',
      message: `동기화 처리 오류: ${err.message}`
    });
    db.updateProduct(productId, {
      [config.statusField]: 'ERROR',
      [config.errorField]: err.message
    });
    sendEvent('product_error', { productId, platform: config.label, error: err.message });
  }
}

// --- API 라우팅 ---

// 1. 상품 관련 API
app.get('/api/products', (req, res) => {
  res.json(db.getProducts());
});

app.post('/api/products', (req, res) => {
  const newProd = db.insertProduct(req.body);
  res.status(201).json(newProd);
});

app.put('/api/products/:id', (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
  res.json(updated);
});

app.delete('/api/products/:id', (req, res) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
  res.json({ success: true });
});

// 상품 대량 삭제
app.post('/api/products/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: '유효한 ID 목록이 필요합니다.' });
  
  let deletedCount = 0;
  ids.forEach(id => {
    if (db.deleteProduct(id)) deletedCount++;
  });
  
  db.addLog('SYSTEM', 'SUCCESS', `대량 삭제 완료: 총 ${ids.length}개 중 ${deletedCount}개 삭제`);
  res.json({ success: true, count: deletedCount });
});

// 상품 대량 편집 (가격 인상, 접두어 추가 등)
app.post('/api/products/bulk-edit', (req, res) => {
  const { ids, updates } = req.body;
  if (!Array.isArray(ids) || !updates) {
    return res.status(400).json({ error: '유효하지 않은 요청 데이터입니다.' });
  }

  const updatedCount = db.bulkUpdateProducts(ids, updates);
  db.addLog('SYSTEM', 'SUCCESS', `대량 편집 완료: 상품 ${updatedCount}개 정보 일괄 업데이트`);
  res.json({ success: true, count: updatedCount });
});

// 2. 설정 관련 API
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.post('/api/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// API 키 자격증명 연결 테스트
app.post('/api/settings/test-connection', async (req, res) => {
  const { platform, credentials = {} } = req.body || {};

  if (credentials.simulationMode) {
    // 시뮬레이션 모드 테스트
    await new Promise(resolve => setTimeout(resolve, 800));
    return res.json({ success: true, message: '시뮬레이션 연결 테스트 성공! (로컬 가상 연결)' });
  }

  try {
    const tester = CONNECTION_TESTERS[platform];
    if (!tester || !tester.testConnection) {
      return res.status(400).json({ success: false, message: '지원하지 않는 플랫폼입니다.' });
    }

    const result = await tester.testConnection(credentials);
    const status = result.success ? 200 : 400;
    return res.status(status).json({
      success: result.success,
      message: result.message || result.error
    });
  } catch (err) {
    res.status(500).json({ success: false, message: `연결 테스트 실패: ${err.message}` });
  }
});

// 3. 로그 관련 API
app.get('/api/logs', (req, res) => {
  res.json(db.getLogs());
});

app.post('/api/logs/clear', (req, res) => {
  db.clearLogs();
  res.json({ success: true });
});

// 4. 엑셀 관련 API
app.get('/api/excel/template', (req, res) => {
  try {
    const templateBuffer = excelHandler.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_bulk_template.xlsx');
    res.send(templateBuffer);
  } catch (err) {
    res.status(500).json({ error: `템플릿 생성 중 오류: ${err.message}` });
  }
});

app.post('/api/excel/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '업로드할 엑셀 파일이 누락되었습니다.' });
  }

  try {
    const report = excelHandler.parseExcel(req.file.path);
    // 업로드 후 임시 파일 즉시 삭제
    fs.unlinkSync(req.file.path);
    res.json(report);
  } catch (err) {
    // 에러 발생시에도 임시 파일 삭제 시도
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: `엑셀 처리 중 실패: ${err.message}` });
  }
});

// 5. 상품 실시간 연동 스트림 (Server-Sent Events)
app.get('/api/sync/stream', async (req, res) => {
  const ids = (req.query.ids || '').split(',').filter(Boolean);
  const platforms = (req.query.platforms || '').split(',').filter(Boolean);

  sendSyncHeaders(res);

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  if (ids.length === 0 || platforms.length === 0) {
    sendEvent('error', { message: '선택된 상품이나 마켓이 없습니다.' });
    res.end();
    return;
  }

  const settings = db.getSettings();
  const totalSteps = ids.length * platforms.length;
  let currentStep = 0;

  sendEvent('info', { message: `대량 연동 작업이 시작되었습니다. (상품 ${ids.length}개, 마켓: ${platforms.join(', ')})` });

  for (let i = 0; i < ids.length; i++) {
    const productId = ids[i];
    const product = db.getProductById(productId);

    if (!product) {
      sendEvent('warn', { message: `상품 ID ${productId}를 찾을 수 없어 건너뜁니다.` });
      currentStep += platforms.length;
      continue;
    }

    sendEvent('product_start', { productId, name: product.name });

    for (const platform of platforms) {
      currentStep++;
      const percent = Math.round((currentStep / totalSteps) * 100);
      await syncProductToPlatform(productId, product, platform, settings, percent, sendEvent);
    }
  }

  sendEvent('complete', { message: '대량 상품 등록 및 연동 작업이 완료되었습니다!' });
  res.end();
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`[서버] 사방넷 로컬 프로그램 백엔드가 포트 ${PORT}에서 실행 중입니다.`);
});
