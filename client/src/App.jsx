import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FileSpreadsheet, 
  Settings, 
  Terminal,
  CloudLightning,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import BulkManager from './components/BulkManager';
import SettingsView from './components/Settings';
import SyncLogs from './components/SyncLogs';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState({ simulationMode: true });
  const [syncStatus, setSyncStatus] = useState({
    active: false,
    percent: 0,
    message: '',
    selectedCount: 0,
    completedCount: 0,
    errorsCount: 0
  });
  
  // 글로벌 로그 목록 (모든 화면에서 공유 및 로그 탭 노출)
  const [globalLogs, setGlobalLogs] = useState([]);
  
  // 설정 정보 읽어오기
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('설정 정보를 불러오는데 실패했습니다:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 연동 작업 시작 핸들러
  const handleStartSync = (productIds, platforms) => {
    if (productIds.length === 0 || platforms.length === 0) return;
    
    setSyncStatus({
      active: true,
      percent: 0,
      message: '연동 준비 중...',
      selectedCount: productIds.length,
      completedCount: 0,
      errorsCount: 0
    });
    
    setGlobalLogs([]); // 로그 초기화
    
    // Server-Sent Events 연결
    const idsQuery = productIds.join(',');
    const platsQuery = platforms.join(',');
    const eventSource = new EventSource(`/api/sync/stream?ids=${idsQuery}&platforms=${platsQuery}`);
    
    eventSource.addEventListener('info', (e) => {
      const data = JSON.parse(e.data);
      addConsoleLog('SYSTEM', 'INFO', data.message);
    });

    eventSource.addEventListener('console', (e) => {
      const data = JSON.parse(e.data);
      addConsoleLog(data.platform, data.type, data.message);
    });

    eventSource.addEventListener('status', (e) => {
      const data = JSON.parse(e.data);
      setSyncStatus(prev => ({
        ...prev,
        percent: data.percent,
        message: data.message
      }));
    });

    eventSource.addEventListener('product_success', (e) => {
      setSyncStatus(prev => ({
        ...prev,
        completedCount: prev.completedCount + 1
      }));
    });

    eventSource.addEventListener('product_error', (e) => {
      setSyncStatus(prev => ({
        ...prev,
        errorsCount: prev.errorsCount + 1
      }));
    });

    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      addConsoleLog('SYSTEM', 'SUCCESS', data.message);
      setSyncStatus(prev => ({
        ...prev,
        active: false,
        percent: 100,
        message: '동기화 완료'
      }));
      eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
      addConsoleLog('SYSTEM', 'ERROR', '통신 중 오류가 발생했거나 연동 연결이 끊겼습니다.');
      setSyncStatus(prev => ({
        ...prev,
        active: false
      }));
      eventSource.close();
    });
  };

  const addConsoleLog = (platform, type, message) => {
    const newLog = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      platform,
      type,
      message
    };
    setGlobalLogs(prev => [newLog, ...prev]);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* 사이드바 */}
      <aside className="glass-panel" style={{ 
        width: 'var(--sidebar-width)', 
        margin: '16px 0 16px 16px',
        padding: '24px 16px',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        borderRadius: 'var(--border-radius-lg)',
        borderRight: '1px solid var(--card-border)'
      }}>
        <div>
          {/* 브랜드 로고 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '40px',
            paddingLeft: '8px'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
            }}>
              <CloudLightning size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                SABANG<span style={{ color: 'var(--color-secondary)' }}>NET</span>
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '1px' }}>
                LOCAL MANAGER
              </span>
            </div>
          </div>

          {/* 메뉴 링크 */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                background: activeTab === 'dashboard' ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                color: activeTab === 'dashboard' ? 'var(--text-main)' : 'var(--text-muted)',
                borderLeft: activeTab === 'dashboard' ? '3px solid var(--color-primary)' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: activeTab === 'dashboard' ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              <LayoutDashboard size={18} />
              대시보드
            </button>

            <button 
              onClick={() => setActiveTab('products')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                background: activeTab === 'products' ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                color: activeTab === 'products' ? 'var(--text-main)' : 'var(--text-muted)',
                borderLeft: activeTab === 'products' ? '3px solid var(--color-primary)' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: activeTab === 'products' ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              <ShoppingBag size={18} />
              상품 대량 관리
            </button>

            <button 
              onClick={() => setActiveTab('excel')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                background: activeTab === 'excel' ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                color: activeTab === 'excel' ? 'var(--text-main)' : 'var(--text-muted)',
                borderLeft: activeTab === 'excel' ? '3px solid var(--color-primary)' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: activeTab === 'excel' ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              <FileSpreadsheet size={18} />
              엑셀 대량 업로드
            </button>

            <button 
              onClick={() => setActiveTab('settings')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                background: activeTab === 'settings' ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                color: activeTab === 'settings' ? 'var(--text-main)' : 'var(--text-muted)',
                borderLeft: activeTab === 'settings' ? '3px solid var(--color-primary)' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: activeTab === 'settings' ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              <Settings size={18} />
              쇼핑몰 연동 설정
            </button>

            <button 
              onClick={() => setActiveTab('logs')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                background: activeTab === 'logs' ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                color: activeTab === 'logs' ? 'var(--text-main)' : 'var(--text-muted)',
                borderLeft: activeTab === 'logs' ? '3px solid var(--color-primary)' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: activeTab === 'logs' ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              <Terminal size={18} />
              연동 실시간 로그
            </button>
          </nav>
        </div>

        {/* 하단 환경 정보 */}
        <div style={{ 
          padding: '16px', 
          background: 'rgba(0, 0, 0, 0.2)', 
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>연동 상태:</span>
            <span style={{ 
              color: settings.simulationMode ? 'var(--color-warning)' : 'var(--color-success)',
              fontWeight: 'bold'
            }}>
              {settings.simulationMode ? '시뮬레이션 모드' : '실제 연동 모드'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>로컬 호스트:</span>
            <span>127.0.0.1:3000</span>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main style={{ 
        flex: 1, 
        padding: '32px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px',
        maxHeight: '100vh',
        overflowY: 'auto'
      }}>
        {/* 상단바 */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid var(--card-border)',
          paddingBottom: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>
              {activeTab === 'dashboard' && '종합 모니터링 대시보드'}
              {activeTab === 'products' && '로컬 상품 관리 및 마켓 연동'}
              {activeTab === 'excel' && '엑셀 일괄 등록 관리'}
              {activeTab === 'settings' && '국내 쇼핑몰 API 자격증명'}
              {activeTab === 'logs' && '실시간 마켓 동기화 로그 콘솔'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              {activeTab === 'dashboard' && '로컬 상품의 등록 상태와 플랫폼별 연동 통계를 직관적으로 모니터링합니다.'}
              {activeTab === 'products' && '선택한 상품을 마켓별로 즉시 일괄 연동하거나 대량 정보를 손쉽게 편집합니다.'}
              {activeTab === 'excel' && '표준 엑셀 템플릿을 내려받고, 채워진 대량 파일을 업로드하여 로컬 시스템에 한 번에 적재합니다.'}
              {activeTab === 'settings' && '국내 주요 5대 쇼핑몰(네이버, 쿠팡, SSG, 롯데온, 카카오) API 연동을 설정합니다.'}
              {activeTab === 'logs' && '대량 연동 진행 시 실시간 통신 트랜잭션 패킷 로그와 결과를 터미널 방식으로 관제합니다.'}
            </p>
          </div>

          {/* 퀵 배너 */}
          {syncStatus.active && (
            <div className="glass-panel" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '8px 16px',
              borderColor: 'var(--color-primary)'
            }}>
              <RefreshCw size={14} className="progress-active" style={{ animation: 'spin 2s linear infinite' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>대량 연동 진행 중 ({syncStatus.percent}%)</span>
            </div>
          )}
        </header>

        {/* 탭 페이지 콘텐츠 */}
        <section style={{ flex: 1 }}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab} 
              syncStatus={syncStatus} 
            />
          )}
          {activeTab === 'products' && (
            <ProductList 
              onStartSync={handleStartSync} 
              syncActive={syncStatus.active} 
            />
          )}
          {activeTab === 'excel' && (
            <BulkManager 
              onImportSuccess={() => setActiveTab('products')} 
            />
          )}
          {activeTab === 'settings' && (
            <SettingsView 
              settings={settings} 
              onSettingsSaved={fetchSettings} 
            />
          )}
          {activeTab === 'logs' && (
            <SyncLogs 
              logs={globalLogs} 
              onClearLogs={() => setGlobalLogs([])} 
            />
          )}
        </section>

        {/* 하단 연동 HUD 플로팅 바 */}
        {syncStatus.active && (
          <div className="glass-panel" style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '400px',
            padding: '20px',
            borderLeft: '4px solid var(--color-primary)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999
          }}>
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} style={{ animation: 'spin 2s linear infinite' }} />
                <span style={{ fontWeight: 600 }}>대량 연동 진행 중...</span>
              </div>
              <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-display)' }}>{syncStatus.percent}%</span>
            </div>
            
            <div style={{ 
              width: '100%', 
              background: 'var(--bg-tertiary)', 
              height: '6px', 
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{ 
                width: `${syncStatus.percent}%`, 
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                height: '100%',
                transition: 'width 0.4s ease'
              }}></div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {syncStatus.message}
            </p>

            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.8rem', borderTop: '1px solid var(--card-border)', paddingTop: '8px' }}>
              <div>요청: <span style={{ fontWeight: 600 }}>{syncStatus.selectedCount}건</span></div>
              <div style={{ color: 'var(--color-success)' }}>성공: <span style={{ fontWeight: 600 }}>{syncStatus.completedCount}건</span></div>
              <div style={{ color: 'var(--color-error)' }}>실패: <span style={{ fontWeight: 600 }}>{syncStatus.errorsCount}건</span></div>
            </div>

            <button 
              onClick={() => setActiveTab('logs')} 
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              콘솔 상세 로그 보기
            </button>
          </div>
        )}
      </main>

      {/* spin 키프레임 인라인 스타일로 기입 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
