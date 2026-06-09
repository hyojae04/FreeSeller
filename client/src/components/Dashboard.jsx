import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  CheckCircle2, 
  AlertTriangle, 
  Settings,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

function Dashboard({ setActiveTab, syncStatus }) {
  const [stats, setStats] = useState({
    total: 0,
    naverSuccess: 0,
    coupangSuccess: 0,
    ssgSuccess: 0,
    lotteSuccess: 0,
    kakaoSuccess: 0,
    errors: 0,
    unsynced: 0
  });
  
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // 상품 정보 가져오기
      const prodRes = await fetch('/api/products');
      const products = await prodRes.json();
      
      // 로그 가져오기
      const logRes = await fetch('/api/logs');
      const logs = await logRes.json();
      
      // 통계 계산
      let naverSuccess = 0;
      let coupangSuccess = 0;
      let ssgSuccess = 0;
      let lotteSuccess = 0;
      let kakaoSuccess = 0;
      let errors = 0;
      
      products.forEach(p => {
        if (p.statusNaver === 'SUCCESS') naverSuccess++;
        if (p.statusCoupang === 'SUCCESS') coupangSuccess++;
        if (p.statusSsg === 'SUCCESS') ssgSuccess++;
        if (p.statusLotte === 'SUCCESS') lotteSuccess++;
        if (p.statusKakao === 'SUCCESS') kakaoSuccess++;
        
        if (
          p.statusNaver === 'ERROR' || 
          p.statusCoupang === 'ERROR' ||
          p.statusSsg === 'ERROR' ||
          p.statusLotte === 'ERROR' ||
          p.statusKakao === 'ERROR'
        ) {
          errors++;
        }
      });

      const total = products.length;
      const unsynced = products.filter(p => 
        p.statusNaver === 'NOT_REGISTERED' && 
        p.statusCoupang === 'NOT_REGISTERED' &&
        p.statusSsg === 'NOT_REGISTERED' &&
        p.statusLotte === 'NOT_REGISTERED' &&
        p.statusKakao === 'NOT_REGISTERED'
      ).length;

      setStats({
        total,
        naverSuccess,
        coupangSuccess,
        ssgSuccess,
        lotteSuccess,
        kakaoSuccess,
        errors,
        unsynced
      });

      // 최근 로그 6개
      setRecentLogs(logs.slice(0, 6));
    } catch (err) {
      console.error('대시보드 데이터를 불러오는 중 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    if (!syncStatus.active && syncStatus.percent === 100) {
      loadDashboardData();
    }
  }, [syncStatus.active, syncStatus.percent]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--card-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--text-muted)' }}>통계 분석 중...</p>
      </div>
    );
  }

  // 5개 플랫폼의 전체 연동 기회 수
  const totalSyncOpportunities = stats.total * 5;
  const actualSyncs = stats.naverSuccess + stats.coupangSuccess + stats.ssgSuccess + stats.lotteSuccess + stats.kakaoSuccess;
  const syncPercentage = totalSyncOpportunities > 0 ? Math.round((actualSyncs / totalSyncOpportunities) * 100) : 0;

  // 도넛 차트 스트로크 오프셋 계산 (둘레 = 251.2)
  const circumference = 251.2;
  const totalOperations = actualSyncs + stats.errors;
  const successRate = totalOperations > 0 ? (actualSyncs / totalOperations) : 0;
  const successDash = circumference * successRate;
  const errorDash = circumference - successDash;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 5대 플랫폼 확장형 스탯 카드 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
        gap: '16px'
      }}>
        {/* 전체 상품 */}
        <div className="glass-panel stat-card" style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => setActiveTab('products')}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>전체 상품</span>
            <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '4px' }}>{stats.total}</div>
          </div>
          <div style={{ color: 'var(--color-primary)', opacity: 0.7 }}><ShoppingBag size={24} /></div>
        </div>

        {/* 네이버 */}
        <div className="glass-panel stat-card naver" style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => setActiveTab('products')}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>네이버 스마트</span>
            <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '4px', color: 'var(--color-naver)' }}>{stats.naverSuccess}</div>
          </div>
          <div style={{ color: 'var(--color-naver)', opacity: 0.7 }}><CheckCircle2 size={24} /></div>
        </div>

        {/* 쿠팡 */}
        <div className="glass-panel stat-card coupang" style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => setActiveTab('products')}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>쿠팡 Wing</span>
            <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '4px', color: 'var(--color-coupang)' }}>{stats.coupangSuccess}</div>
          </div>
          <div style={{ color: 'var(--color-coupang)', opacity: 0.7 }}><CheckCircle2 size={24} /></div>
        </div>

        {/* SSG */}
        <div className="glass-panel stat-card" style={{ 
          padding: '16px 20px', 
          cursor: 'pointer',
          borderTop: '4px solid #eab308'
        }} onClick={() => setActiveTab('products')}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SSG.COM</span>
            <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '4px', color: '#eab308' }}>{stats.ssgSuccess}</div>
          </div>
          <div style={{ color: '#eab308', opacity: 0.7 }}><CheckCircle2 size={24} /></div>
        </div>

        {/* 롯데온 */}
        <div className="glass-panel stat-card" style={{ 
          padding: '16px 20px', 
          cursor: 'pointer',
          borderTop: '4px solid #e11d48'
        }} onClick={() => setActiveTab('products')}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>롯데온 (Lotte)</span>
            <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '4px', color: '#e11d48' }}>{stats.lotteSuccess}</div>
          </div>
          <div style={{ color: '#e11d48', opacity: 0.7 }}><CheckCircle2 size={24} /></div>
        </div>

        {/* 카카오 */}
        <div className="glass-panel stat-card" style={{ 
          padding: '16px 20px', 
          cursor: 'pointer',
          borderTop: '4px solid #facc15'
        }} onClick={() => setActiveTab('products')}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>카카오 톡스토어</span>
            <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '4px', color: '#facc15' }}>{stats.kakaoSuccess}</div>
          </div>
          <div style={{ color: '#facc15', opacity: 0.7 }}><CheckCircle2 size={24} /></div>
        </div>

        {/* 에러 */}
        <div className="glass-panel stat-card error" style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => setActiveTab('logs')}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>연동 오류 상품</span>
            <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '4px', color: 'var(--color-error)' }}>{stats.errors}</div>
          </div>
          <div style={{ color: 'var(--color-error)', opacity: 0.7 }}><AlertTriangle size={24} /></div>
        </div>
      </div>

      {/* 시각화 차트 영역 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        
        {/* 플랫폼별 등록 대비 미등록 비교 (5대 마켓 확장 바 차트) */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>5대 플랫폼 연동 점유율</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} /> 연동율 비교
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 네이버 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-naver)' }}>네이버 스마트스토어</span>
                <span>{stats.naverSuccess} / {stats.total} 개 ({stats.total > 0 ? Math.round(stats.naverSuccess / stats.total * 100) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.total > 0 ? (stats.naverSuccess / stats.total * 100) : 0}%`, background: 'var(--color-naver)', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* 쿠팡 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-coupang)' }}>쿠팡 (Coupang Wing)</span>
                <span>{stats.coupangSuccess} / {stats.total} 개 ({stats.total > 0 ? Math.round(stats.coupangSuccess / stats.total * 100) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.total > 0 ? (stats.coupangSuccess / stats.total * 100) : 0}%`, background: 'var(--color-coupang)', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* SSG */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#eab308' }}>SSG.COM</span>
                <span>{stats.ssgSuccess} / {stats.total} 개 ({stats.total > 0 ? Math.round(stats.ssgSuccess / stats.total * 100) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.total > 0 ? (stats.ssgSuccess / stats.total * 100) : 0}%`, background: '#eab308', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* 롯데온 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#e11d48' }}>롯데온 (Lotte On)</span>
                <span>{stats.lotteSuccess} / {stats.total} 개 ({stats.total > 0 ? Math.round(stats.lotteSuccess / stats.total * 100) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.total > 0 ? (stats.lotteSuccess / stats.total * 100) : 0}%`, background: '#e11d48', borderRadius: '4px' }}></div>
              </div>
            </div>

            {/* 카카오 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#facc15' }}>카카오 톡스토어</span>
                <span>{stats.kakaoSuccess} / {stats.total} 개 ({stats.total > 0 ? Math.round(stats.kakaoSuccess / stats.total * 100) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.total > 0 ? (stats.kakaoSuccess / stats.total * 100) : 0}%`, background: '#facc15', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 연동 성공률 (Doughnut Chart) */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>종합 연동 품질</h3>
          
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-around', gap: '20px' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--bg-tertiary)" strokeWidth="10" />
                {actualSyncs > 0 && (
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="var(--color-success)" 
                    strokeWidth="10" 
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - successDash}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                  />
                )}
                {stats.errors > 0 && (
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="var(--color-error)" 
                    strokeWidth="10" 
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - errorDash}
                    strokeLinecap="round"
                    transform={`rotate(${successRate * 360 - 90} 50 50)`}
                    style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                  />
                )}
              </svg>
              <div style={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                  {syncPercentage}%
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>연동률 충족</span>
              </div>
            </div>

            {/* 범례 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-success)' }}></div>
                <span>정상 연동: <strong>{actualSyncs}건</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-error)' }}></div>
                <span>연동 에러: <strong>{stats.errors}건</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                <span>미지정 채널: <strong>{totalSyncOpportunities - actualSyncs - stats.errors}건</strong></span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '190px', lineHeight: 1.4 }}>
                5대 쇼핑몰 연동 기회 중 실제 성공적으로 송출 및 등록 완료된 전체 비율입니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 바로가기 & 최근 작업 로그 타임라인 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
        
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>대량 신속작업 바로가기</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
              상품의 일괄 수정 및 업로드를 빠르게 실행할 수 있습니다.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => setActiveTab('excel')} 
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-sm)',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileSpreadsheet size={20} color="var(--color-success)" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>대용량 엑셀 등록</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>여러 개의 신규 제품 엑셀 등록</div>
                  </div>
                </div>
                <ArrowRight size={16} />
              </button>

              <button 
                onClick={() => setActiveTab('products')} 
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-sm)',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShoppingBag size={20} color="var(--color-primary)" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>상품 가격 일괄 변경</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>선택 제품의 가격 10% 일괄 증감</div>
                  </div>
                </div>
                <ArrowRight size={16} />
              </button>

              <button 
                onClick={() => setActiveTab('settings')} 
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-sm)',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Settings size={20} color="var(--color-secondary)" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>API 환경 연동 진단</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>5대 쇼핑몰 연동 인증키 기입 관리</div>
                  </div>
                </div>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginTop: '16px', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>쿠팡: api-gateway.coupang.com | 네이버: api.commerce.naver.com</span>
            <span>SSG: api.ssgadm.com | 롯데온: openapi.lotteon.com | 카카오: api.shopping-sell.kakao.com</span>
          </div>
        </div>

        {/* 최근 연동 활동 내역 */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>최근 연동 히스토리</h3>
          
          {recentLogs.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              등록 또는 수정된 연동 히스토리가 존재하지 않습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentLogs.map((log) => {
                let badgeColor = '#4b5563';
                if (log.platform === 'NAVER') badgeColor = 'var(--color-naver)';
                if (log.platform === 'COUPANG') badgeColor = 'var(--color-coupang)';
                if (log.platform === 'SSG') badgeColor = '#eab308';
                if (log.platform === 'LOTTE') badgeColor = '#e11d48';
                if (log.platform === 'KAKAO') badgeColor = '#facc15';

                return (
                  <div key={log.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.15)',
                    padding: '10px 14px',
                    borderRadius: 'var(--border-radius-sm)',
                    borderLeft: `3px solid ${
                      log.type === 'SUCCESS' ? 'var(--color-success)' :
                      log.type === 'ERROR' ? 'var(--color-error)' : 'var(--color-primary)'
                    }`
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 'bold', 
                          background: badgeColor,
                          color: log.platform === 'KAKAO' ? '#000' : '#fff',
                          padding: '2px 5px',
                          borderRadius: '3px',
                          flexShrink: 0
                        }}>
                          {log.platform}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.message}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '12px', flexShrink: 0 }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}

export default Dashboard;
