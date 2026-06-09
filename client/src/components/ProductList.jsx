import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Plus, 
  RefreshCw, 
  X, 
  Info,
  HelpCircle
} from 'lucide-react';

function ProductList({ onStartSync, syncActive }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // 통합 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMall, setSelectedMall] = useState('ALL'); // ALL, naver, coupang, ssg, lotte, kakao
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL, NOT_REGISTERED, SUCCESS, ERROR

  // 모달 및 서랍 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  
  // 일괄 연동 모달 관련
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncNaver, setSyncNaver] = useState(true);
  const [syncCoupang, setSyncCoupang] = useState(true);
  const [syncSsg, setSyncSsg] = useState(true);
  const [syncLotte, setSyncLotte] = useState(true);
  const [syncKakao, setSyncKakao] = useState(true);

  // 단일 등록/수정 폼 데이터
  const [formData, setFormData] = useState({
    productCode: '',
    mallCode: '',
    mallName: '',
    mallPrice: '',
    mallProductName: '',
    mallDescription: '',
    cost: '',
    cost2: '',
    mallAttrClassCode: '',
    mallPromotionText: '',
    extraInfoCode2: '',
    sellerProductCode: '',
    name: '',
    price: '',
    mallCost: '',
    stockSplitPercent: '',
    stockSplitDecimal: '',
    certNo: '',
    issueDate: '',
    certDate: '',
    expiryStartDate: '',
    expiryEndDate: '',
    certOrg: '',
    certField: '',
    brandName: '',
    modelName: '',
    productCertSeq: '',
    image: '',
    subImages: ''
  });

  // 일괄 수정 폼 데이터
  const [bulkUpdates, setBulkUpdates] = useState({
    priceOffsetType: 'set', // set, add, percent
    priceOffset: '',
    namePrefix: '',
    nameSuffix: '',
    nameReplaceTarget: '',
    nameReplaceVal: '',
    category: '',
    stock: '',
    shippingType: '',
    shippingFee: '',
    origin: ''
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('상품 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [syncActive]);

  // 선택 로직
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const filtered = getFilteredProducts();
      setSelectedIds(filtered.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 개별 삭제
  const handleDeleteOne = async (id) => {
    if (!confirm('정말 이 상품을 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setSelectedIds(prev => prev.filter(item => item !== id));
      loadProducts();
    } catch (err) {
      alert('상품 삭제 중 오류가 발생했습니다.');
    }
  };

  // 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`선택한 ${selectedIds.length}개 상품을 일괄 삭제하시겠습니까?`)) return;
    
    try {
      await fetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      setSelectedIds([]);
      loadProducts();
    } catch (err) {
      alert('일괄 삭제 중 오류가 발생했습니다.');
    }
  };

  // 일괄 수정 제출
  const handleBulkEditSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const cleanedUpdates = {};
    if (bulkUpdates.namePrefix) cleanedUpdates.namePrefix = bulkUpdates.namePrefix;
    if (bulkUpdates.nameSuffix) cleanedUpdates.nameSuffix = bulkUpdates.nameSuffix;
    if (bulkUpdates.nameReplaceTarget) {
      cleanedUpdates.nameReplaceTarget = bulkUpdates.nameReplaceTarget;
      cleanedUpdates.nameReplaceVal = bulkUpdates.nameReplaceVal;
    }
    
    if (bulkUpdates.priceOffset) {
      cleanedUpdates.priceOffsetType = bulkUpdates.priceOffsetType;
      cleanedUpdates.priceOffset = Number(bulkUpdates.priceOffset);
    }
    
    if (bulkUpdates.category) cleanedUpdates.category = bulkUpdates.category;
    if (bulkUpdates.stock) cleanedUpdates.stock = Number(bulkUpdates.stock);
    if (bulkUpdates.shippingType) cleanedUpdates.shippingType = bulkUpdates.shippingType;
    if (bulkUpdates.shippingFee) cleanedUpdates.shippingFee = Number(bulkUpdates.shippingFee);
    if (bulkUpdates.origin) cleanedUpdates.origin = bulkUpdates.origin;

    try {
      await fetch('/api/products/bulk-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          updates: cleanedUpdates
        })
      });
      
      alert(`선택한 ${selectedIds.length}개 상품의 일괄 수정이 완료되었습니다.`);
      setIsBulkEditOpen(false);
      setBulkUpdates({
        priceOffsetType: 'set',
        priceOffset: '',
        namePrefix: '',
        nameSuffix: '',
        nameReplaceTarget: '',
        nameReplaceVal: '',
        category: '',
        stock: '',
        shippingType: '',
        shippingFee: '',
        origin: ''
      });
      loadProducts();
    } catch (err) {
      alert('일괄 수정 적용 중 오류가 발생했습니다.');
    }
  };

  // 단일 등록/수정 모달 열기
  const openSingleModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        productCode: product.productCode || '',
        mallCode: product.mallCode || '',
        mallName: product.mallName || '',
        mallPrice: product.mallPrice || '',
        mallProductName: product.mallProductName || '',
        mallDescription: product.mallDescription || '',
        cost: product.cost || '',
        cost2: product.cost2 || '',
        mallAttrClassCode: product.mallAttrClassCode || '',
        mallPromotionText: product.mallPromotionText || '',
        extraInfoCode2: product.extraInfoCode2 || '',
        sellerProductCode: product.sellerProductCode || '',
        name: product.name || '',
        price: product.price || '',
        mallCost: product.mallCost || '',
        stockSplitPercent: product.stockSplitPercent || '',
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
        productCertSeq: product.productCertSeq || '',
        image: product.image || '',
        subImages: product.subImages || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        productCode: '',
        mallCode: '',
        mallName: '',
        mallPrice: '',
        mallProductName: '',
        mallDescription: '',
        cost: '',
        cost2: '',
        mallAttrClassCode: '',
        mallPromotionText: '',
        extraInfoCode2: '',
        sellerProductCode: '',
        name: '',
        price: '',
        mallCost: '',
        stockSplitPercent: '',
        stockSplitDecimal: '',
        certNo: '',
        issueDate: '',
        certDate: '',
        expiryStartDate: '',
        expiryEndDate: '',
        certOrg: '',
        certField: '',
        brandName: '',
        modelName: '',
        productCertSeq: '',
        image: '',
        subImages: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      alert('상품 저장에 실패했습니다.');
    }
  };

  // 일괄 동기화 요청 트리거
  const triggerSync = () => {
    const platforms = [];
    if (syncNaver) platforms.push('naver');
    if (syncCoupang) platforms.push('coupang');
    if (syncSsg) platforms.push('ssg');
    if (syncLotte) platforms.push('lotte');
    if (syncKakao) platforms.push('kakao');

    if (platforms.length === 0) {
      alert('최소 하나의 쇼핑몰 마켓을 선택해야 합니다.');
      return;
    }

    onStartSync(selectedIds, platforms);
    setIsSyncModalOpen(false);
    setSelectedIds([]);
  };

  // 필터링 적용 연산
  const getFilteredProducts = () => {
    return products.filter(p => {
      // 1. 검색어 필터
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.category.includes(searchTerm);
      if (!matchesSearch) return false;

      // 2. 플랫폼과 연동 상태 조합 필터
      if (selectedMall !== 'ALL') {
        const statusField = `status${selectedMall.charAt(0).toUpperCase() + selectedMall.slice(1)}`;
        const status = p[statusField];
        if (selectedStatus !== 'ALL') {
          return status === selectedStatus;
        }
        return true;
      } else if (selectedStatus !== 'ALL') {
        // 모든 마켓 중 어느 하나라도 해당 상태인지 확인
        const statuses = [p.statusNaver, p.statusCoupang, p.statusSsg, p.statusLotte, p.statusKakao];
        return statuses.includes(selectedStatus);
      }

      return true;
    });
  };

  const filteredProducts = getFilteredProducts();

  // 배지 렌더러 유틸리티
  const renderSyncBadge = (platformName, status, idOut, errorText) => {
    let letter = '';
    let brandColor = '';
    let hoverTitle = '';
    let activeStyle = {};

    switch(platformName) {
      case 'naver':
        letter = 'N';
        brandColor = 'var(--color-naver)';
        hoverTitle = '네이버 스마트스토어';
        break;
      case 'coupang':
        letter = 'C';
        brandColor = 'var(--color-coupang)';
        hoverTitle = '쿠팡 WING';
        break;
      case 'ssg':
        letter = 'S';
        brandColor = '#eab308';
        hoverTitle = 'SSG.COM';
        break;
      case 'lotte':
        letter = 'L';
        brandColor = '#e11d48';
        hoverTitle = '롯데온';
        break;
      case 'kakao':
        letter = 'K';
        brandColor = '#facc15';
        hoverTitle = '카카오 톡스토어';
        break;
      default:
        break;
    }

    if (status === 'SUCCESS') {
      activeStyle = {
        background: brandColor,
        color: platformName === 'kakao' ? '#000' : '#fff',
        border: `1px solid ${brandColor}`,
        boxShadow: `0 0 6px ${brandColor}50`
      };
      hoverTitle += ` [성공] - 상품ID: ${idOut}`;
    } else if (status === 'ERROR') {
      activeStyle = {
        background: 'rgba(239, 68, 68, 0.15)',
        color: 'var(--color-error)',
        border: '1px solid rgba(239, 68, 68, 0.4)'
      };
      hoverTitle += ` [오류] - ${errorText || '알 수 없는 오류'}`;
    } else {
      // NOT_REGISTERED
      activeStyle = {
        background: 'rgba(255,255,255,0.03)',
        color: 'var(--text-dark)',
        border: '1px solid var(--card-border)'
      };
      hoverTitle += ' [미연동]';
    }

    return (
      <span 
        key={platformName}
        title={hoverTitle}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          borderRadius: '6px',
          fontSize: '0.72rem',
          fontWeight: 'bold',
          marginRight: '6px',
          userSelect: 'none',
          cursor: (status === 'SUCCESS' || status === 'ERROR') ? 'help' : 'default',
          transition: 'all 0.2s',
          ...activeStyle
        }}
      >
        {letter}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. 상품 검색 및 필터링 툴바 */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="상품명 또는 카테고리 코드로 검색..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* 쇼핑몰 채널 선택 필터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>연동 채널:</span>
            <select 
              value={selectedMall} 
              onChange={e => setSelectedMall(e.target.value)}
              className="form-input" 
              style={{ padding: '8px 12px', width: '135px', background: 'var(--bg-tertiary)' }}
            >
              <option value="ALL">전체 쇼핑몰</option>
              <option value="naver">네이버 스마트</option>
              <option value="coupang">쿠팡 Wing</option>
              <option value="ssg">SSG.COM</option>
              <option value="lotte">롯데온</option>
              <option value="kakao">카카오 톡스토어</option>
            </select>
          </div>

          {/* 연동 상태 필터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>연동 상태:</span>
            <select 
              value={selectedStatus} 
              onChange={e => setSelectedStatus(e.target.value)}
              className="form-input" 
              style={{ padding: '8px 12px', width: '125px', background: 'var(--bg-tertiary)' }}
            >
              <option value="ALL">전체 상태</option>
              <option value="NOT_REGISTERED">미연동</option>
              <option value="SUCCESS">연동성공</option>
              <option value="ERROR">연동에러</option>
            </select>
          </div>

          <button onClick={() => openSingleModal()} className="btn-glow" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <Plus size={16} /> 상품 등록
          </button>
        </div>
      </div>

      {/* 2. 다중 선택 활성화 시 일괄 액션 바 */}
      {selectedIds.length > 0 && (
        <div className="glass-panel" style={{ 
          padding: '16px 24px', 
          borderColor: 'var(--color-primary)', 
          background: 'rgba(79, 70, 229, 0.08)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            선택된 상품 <span style={{ color: 'var(--color-secondary)' }}>{selectedIds.length}</span>개
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setIsSyncModalOpen(true)} 
              disabled={syncActive}
              className="btn-glow" 
              style={{ 
                background: 'linear-gradient(135deg, var(--color-secondary) 0%, #0891b2 100%)',
                padding: '8px 16px',
                fontSize: '0.85rem'
              }}
            >
              <RefreshCw size={14} /> 쇼핑몰 일괄 연동
            </button>

            <button 
              onClick={() => setIsBulkEditOpen(!isBulkEditOpen)}
              className="btn-glow"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid var(--card-border)', 
                padding: '8px 16px', 
                fontSize: '0.85rem' 
              }}
            >
              <Edit3 size={14} /> 일괄 수정 가공
            </button>

            <button 
              onClick={handleBulkDelete}
              className="btn-glow" 
              style={{ 
                background: 'linear-gradient(135deg, var(--color-error) 0%, #b91c1c 100%)',
                padding: '8px 16px',
                fontSize: '0.85rem'
              }}
            >
              <Trash2 size={14} /> 일괄 삭제
            </button>
          </div>
        </div>
      )}

      {/* 3. 일괄 수정 폼 영역 */}
      {selectedIds.length > 0 && isBulkEditOpen && (
        <form onSubmit={handleBulkEditSubmit} className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', borderTop: 'none', borderRadius: `0 0 var(--border-radius-md) var(--border-radius-md)` }}>
          <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--color-secondary)' }}>선택 상품 일괄 가공 수정툴</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>변경하고자 하는 항목만 값을 채우시면 됩니다. 비워진 항목은 그대로 유지됩니다.</p>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>상품명 앞말(접두사)</label>
            <input 
              type="text" 
              placeholder="예: [특가] " 
              value={bulkUpdates.namePrefix}
              onChange={e => setBulkUpdates(prev => ({ ...prev, namePrefix: e.target.value }))}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>상품명 뒷말(접미사)</label>
            <input 
              type="text" 
              placeholder="예: (무료배송)" 
              value={bulkUpdates.nameSuffix}
              onChange={e => setBulkUpdates(prev => ({ ...prev, nameSuffix: e.target.value }))}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>가격 가공 방식</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                value={bulkUpdates.priceOffsetType}
                onChange={e => setBulkUpdates(prev => ({ ...prev, priceOffsetType: e.target.value }))}
                className="form-input"
                style={{ width: '90px', padding: '10px 8px', background: 'var(--bg-tertiary)' }}
              >
                <option value="set">고정가</option>
                <option value="add">금액더하기</option>
                <option value="percent">% 인상/인하</option>
              </select>
              <input 
                type="number" 
                placeholder="금액 or %값" 
                value={bulkUpdates.priceOffset}
                onChange={e => setBulkUpdates(prev => ({ ...prev, priceOffset: e.target.value }))}
                className="form-input"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>카테고리 일괄 지정</label>
            <input 
              type="text" 
              placeholder="카테고리 8자리 코드" 
              value={bulkUpdates.category}
              onChange={e => setBulkUpdates(prev => ({ ...prev, category: e.target.value }))}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>재고 일괄 변경</label>
            <input 
              type="number" 
              placeholder="일괄 재고 수량" 
              value={bulkUpdates.stock}
              onChange={e => setBulkUpdates(prev => ({ ...prev, stock: e.target.value }))}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>배송 구분</label>
            <select 
              value={bulkUpdates.shippingType}
              onChange={e => setBulkUpdates(prev => ({ ...prev, shippingType: e.target.value }))}
              className="form-input"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <option value="">기존 유지</option>
              <option value="FREE">무료배송</option>
              <option value="PAID">유료배송</option>
              <option value="CONDITIONAL_FREE">조건부 무료배송</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: '10px', gridColumn: '1 / -1', marginTop: '8px' }}>
            <button 
              type="button" 
              onClick={() => setIsBulkEditOpen(false)} 
              className="btn-glow" 
              style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--card-border)' }}
            >
              취소
            </button>
            <button type="submit" className="btn-glow">
              일괄 수정사항 즉시 적용
            </button>
          </div>
        </form>
      )}

      {/* 4. 상품 데이터 테이블 리스트 */}
      <div className="table-container glass-panel">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                  onChange={handleSelectAll}
                  style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                />
              </th>
              <th>대표 이미지</th>
              <th>상품 정보</th>
              <th>가격 정보</th>
              <th>쇼핑몰 연동 정보</th>
              <th style={{ textAlign: 'center', width: '190px' }}>마켓 연동 상태</th>
              <th style={{ textAlign: 'center', width: '100px' }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  데이터 불러오는 중...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  등록된 상품이 없거나 필터 조건에 부합하는 상품이 없습니다. 엑셀로 상품을 대량 업로드해보세요!
                </td>
              </tr>
            ) : (
              filteredProducts.map(p => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <tr key={p.id} style={{ background: isSelected ? 'rgba(79, 70, 229, 0.05)' : 'transparent' }}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleSelectOne(p.id)}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <img 
                        src={p.image || 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=120'} 
                        alt={p.name}
                        style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--card-border)' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{p.name}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>자체코드: <strong style={{ color: 'var(--color-secondary)' }}>{p.sellerProductCode || '-'}</strong></span>
                          <span>브랜드/모델: <strong>{p.brandName || '-'}/{p.modelName || '-'}</strong></span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--color-secondary)' }}>판매가: {p.price.toLocaleString()} 원</span>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>원가: {Number(p.cost || 0).toLocaleString()}원</span>
                          <span>원가2: {Number(p.cost2 || 0).toLocaleString()}원</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.mallName || '-'} ({p.mallCode || '-'})</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>쇼핑몰 판매가: <strong>{Number(p.mallPrice || 0).toLocaleString()}원</strong></span>
                          <span>품번코드: <strong>{p.productCode || '-'}</strong></span>
                        </div>
                      </div>
                    </td>
                    
                    {/* 통합 마켓 연동 상태 배지 컴팩트 열 */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        {renderSyncBadge('naver', p.statusNaver, p.statusNaverId, p.errorNaver)}
                        {renderSyncBadge('coupang', p.statusCoupang, p.statusCoupangId, p.errorCoupang)}
                        {renderSyncBadge('ssg', p.statusSsg, p.statusSsgId, p.errorSsg)}
                        {renderSyncBadge('lotte', p.statusLotte, p.statusLotteId, p.errorLotte)}
                        {renderSyncBadge('kakao', p.statusKakao, p.statusKakaoId, p.errorKakao)}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => openSingleModal(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="수정">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDeleteOne(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }} title="삭제">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. 단일 추가/수정용 모달 다이얼로그 */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{
            width: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '32px',
            animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{editingProduct ? '상품 상세 정보 수정' : '신규 상품 개별 등록'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSingleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 섹션 1: 자체 상품 기본 정보 (필수) */}
              <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-secondary)', marginBottom: '12px' }}>1. 기본 상품 정보 (필수 항목)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>자체상품코드 *</label>
                    <input type="text" required value={formData.sellerProductCode} onChange={e => setFormData(prev => ({ ...prev, sellerProductCode: e.target.value }))} className="form-input" placeholder="예: SELF_PROD_101" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>상품명 *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="form-input" placeholder="예: 통기타 패키지" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>판매가 (원) *</label>
                    <input type="number" required value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>원가 (원) *</label>
                    <input type="number" required value={formData.cost} onChange={e => setFormData(prev => ({ ...prev, cost: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>원가2 (원) *</label>
                    <input type="number" required value={formData.cost2} onChange={e => setFormData(prev => ({ ...prev, cost2: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>브랜드명 *</label>
                    <input type="text" required value={formData.brandName} onChange={e => setFormData(prev => ({ ...prev, brandName: e.target.value }))} className="form-input" placeholder="예: 야마하" />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>모델명 *</label>
                    <input type="text" required value={formData.modelName} onChange={e => setFormData(prev => ({ ...prev, modelName: e.target.value }))} className="form-input" placeholder="예: FG-800" />
                  </div>
                </div>
              </div>

              {/* 섹션 2: 쇼핑몰 연동 정보 */}
              <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-secondary)', marginBottom: '12px' }}>2. 쇼핑몰 등록 정보 (필수/선택)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>품번코드 *</label>
                    <input type="text" required value={formData.productCode} onChange={e => setFormData(prev => ({ ...prev, productCode: e.target.value }))} className="form-input" placeholder="예: P00001" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>쇼핑몰코드 *</label>
                    <input type="text" required value={formData.mallCode} onChange={e => setFormData(prev => ({ ...prev, mallCode: e.target.value }))} className="form-input" placeholder="예: M001" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>쇼핑몰명 *</label>
                    <input type="text" required value={formData.mallName} onChange={e => setFormData(prev => ({ ...prev, mallName: e.target.value }))} className="form-input" placeholder="예: 네이버 스마트스토어" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>쇼핑몰 판매가 *</label>
                    <input type="number" required value={formData.mallPrice} onChange={e => setFormData(prev => ({ ...prev, mallPrice: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>쇼핑몰 원가</label>
                    <input type="number" value={formData.mallCost} onChange={e => setFormData(prev => ({ ...prev, mallCost: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>쇼핑몰 상품명</label>
                    <input type="text" value={formData.mallProductName} onChange={e => setFormData(prev => ({ ...prev, mallProductName: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>쇼핑몰 속성분류코드</label>
                    <input type="text" value={formData.mallAttrClassCode} onChange={e => setFormData(prev => ({ ...prev, mallAttrClassCode: e.target.value }))} className="form-input" placeholder="예: CAT_GUITAR_01" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>쇼핑몰 홍보문구</label>
                    <input type="text" value={formData.mallPromotionText} onChange={e => setFormData(prev => ({ ...prev, mallPromotionText: e.target.value }))} className="form-input" />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>쇼핑몰 상세설명</label>
                    <textarea rows="2" value={formData.mallDescription} onChange={e => setFormData(prev => ({ ...prev, mallDescription: e.target.value }))} className="form-input" style={{ resize: 'vertical' }} placeholder="쇼핑몰용 HTML 상세설명"></textarea>
                  </div>
                </div>
              </div>

              {/* 섹션 3: 상품 인증 및 부가 정보 */}
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-secondary)', marginBottom: '12px' }}>3. 인증 및 기타 부가정보 (선택 항목)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>인증번호</label>
                    <input type="text" value={formData.certNo} onChange={e => setFormData(prev => ({ ...prev, certNo: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>인증기관</label>
                    <input type="text" value={formData.certOrg} onChange={e => setFormData(prev => ({ ...prev, certOrg: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>인증분야</label>
                    <input type="text" value={formData.certField} onChange={e => setFormData(prev => ({ ...prev, certField: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>상품인증순번</label>
                    <input type="number" value={formData.productCertSeq} onChange={e => setFormData(prev => ({ ...prev, productCertSeq: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>발급일자</label>
                    <input type="date" value={formData.issueDate} onChange={e => setFormData(prev => ({ ...prev, issueDate: e.target.value }))} className="form-input" style={{ colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>인증일자</label>
                    <input type="date" value={formData.certDate} onChange={e => setFormData(prev => ({ ...prev, certDate: e.target.value }))} className="form-input" style={{ colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>유효기간 시작일</label>
                    <input type="date" value={formData.expiryStartDate} onChange={e => setFormData(prev => ({ ...prev, expiryStartDate: e.target.value }))} className="form-input" style={{ colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>유효기간 종료일</label>
                    <input type="date" value={formData.expiryEndDate} onChange={e => setFormData(prev => ({ ...prev, expiryEndDate: e.target.value }))} className="form-input" style={{ colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>재고분할 퍼센트</label>
                    <input type="number" value={formData.stockSplitPercent} onChange={e => setFormData(prev => ({ ...prev, stockSplitPercent: e.target.value }))} className="form-input" placeholder="예: 50" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>재고분할 소수점 설정</label>
                    <input type="text" value={formData.stockSplitDecimal} onChange={e => setFormData(prev => ({ ...prev, stockSplitDecimal: e.target.value }))} className="form-input" placeholder="예: ROUNDS_DOWN" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>부가정보코드II</label>
                    <input type="text" value={formData.extraInfoCode2} onChange={e => setFormData(prev => ({ ...prev, extraInfoCode2: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>대표 이미지 URL</label>
                    <input type="text" value={formData.image} onChange={e => setFormData(prev => ({ ...prev, image: e.target.value }))} className="form-input" placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-glow" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--card-border)' }}>취소</button>
                <button type="submit" className="btn-glow">상품 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. 일괄 연동 대상 마켓 선택 모달 (5대 마켓 확장) */}
      {isSyncModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '450px', padding: '32px', animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>대량 쇼핑몰 연동 타겟 설정</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              선택한 <strong style={{ color: 'var(--color-secondary)' }}>{selectedIds.length}개</strong> 상품을 전송할 마켓을 체크하세요.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {/* 네이버 */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                <input type="checkbox" checked={syncNaver} onChange={e => setSyncNaver(e.target.checked)} style={{ transform: 'scale(1.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-naver)' }}>네이버 스마트스토어</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>스마트스토어 센터 상품 등록 API 연동</span>
                </div>
              </label>

              {/* 쿠팡 */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                <input type="checkbox" checked={syncCoupang} onChange={e => setSyncCoupang(e.target.checked)} style={{ transform: 'scale(1.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-coupang)' }}>쿠팡 (Coupang Wing)</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>쿠팡 마켓플레이스 판매자 API 연동</span>
                </div>
              </label>

              {/* SSG */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                <input type="checkbox" checked={syncSsg} onChange={e => setSyncSsg(e.target.checked)} style={{ transform: 'scale(1.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#eab308' }}>SSG.COM (쓱닷컴)</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SSG 파트너 오피스 오픈 API 연동</span>
                </div>
              </label>

              {/* 롯데온 */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                <input type="checkbox" checked={syncLotte} onChange={e => setSyncLotte(e.target.checked)} style={{ transform: 'scale(1.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e11d48' }}>롯데온 (LOTTE ON)</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>롯데온 스토어센터 OpenAPI 연동</span>
                </div>
              </label>

              {/* 카카오 */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                <input type="checkbox" checked={syncKakao} onChange={e => setSyncKakao(e.target.checked)} style={{ transform: 'scale(1.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#facc15' }}>카카오 톡스토어</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>카카오쇼핑 판매자센터 API 연동</span>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsSyncModalOpen(false)} className="btn-glow" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--card-border)' }}>취소</button>
              <button onClick={triggerSync} className="btn-glow">일괄 연동 전송</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ProductList;
