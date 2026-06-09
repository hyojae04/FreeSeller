import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Trash2, 
  Filter, 
  FileText,
  Download
} from 'lucide-react';

function SyncLogs({ logs, onClearLogs }) {
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [dbLogs, setDbLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const terminalEndRef = useRef(null);

  // 데이터베이스 백엔드 히스토리 로그 불러오기
  const fetchDbLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/logs');
      const data = await res.json();
      setDbLogs(data);
    } catch (err) {
      console.error('서버 로그 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbLogs();
  }, [logs]); // 신규 실시간 로그가 들어올 때 마다 디비 로그 싱크

  // 터미널 스크롤 하단 고정
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, dbLogs]);

  // 실시간 로그 + DB 로그 병합 및 필터링
  // 실시간 로그는 현재 탭을 보고 있지 않아도 쌓이며, 컴포넌트 렌더링 시 디비 전체 로그와 함께 보기 좋게 배치
  const getCombinedLogs = () => {
    // 실시간으로 쌓인 임시 로그
    const liveItems = logs.map(l => ({
      id: l.id,
      timestamp: new Date().toISOString(), // 정렬용
      platform: l.platform,
      type: l.type,
      message: `[LIVE] ${l.message}`,
      isLive: true
    }));

    // 전체 DB 로그 (포맷 변환)
    const dbItems = dbLogs.map(l => ({
      id: l.id,
      timestamp: l.timestamp,
      platform: l.platform,
      type: l.type,
      message: l.message,
      details: l.details,
      isLive: false
    }));

    // 두 로그 합치고 시간순 정렬 (최근이 아래로 가게 정렬 - 터미널형)
    const combined = [...dbItems, ...liveItems].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // 중복 제거 (실시간 로그가 DB에 기록되는 경우 중복 제거)
    const unique = [];
    const seenMessages = new Set();
    
    combined.forEach(item => {
      const uniqueKey = `${item.platform}_${item.type}_${item.message.replace('[LIVE] ', '')}`;
      if (!seenMessages.has(uniqueKey)) {
        seenMessages.add(uniqueKey);
        unique.push(item);
      }
    });

    if (platformFilter === 'ALL') return unique;
    return unique.filter(l => l.platform === platformFilter);
  };

  const filteredLogs = getCombinedLogs();

  // 백엔드 전체 로그 비우기
  const handleClearLogs = async () => {
    if (!confirm('로컬 파일에 저장된 모든 연동 로그 히스토리를 삭제하시겠습니까?')) return;
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      onClearLogs(); // 클라이언트 상태 비우기
      setDbLogs([]);
    } catch (err) {
      alert('로그 청소 실패');
    }
  };

  // 로그 파일로 다운로드 내보내기 (.txt)
  const exportLogsToFile = () => {
    if (filteredLogs.length === 0) return;
    const textContent = filteredLogs.map(l => 
      `[${new Date(l.timestamp).toLocaleString()}] [${l.platform}] [${l.type}] ${l.message} ${l.details ? '\n상세패킷: ' + l.details : ''}`
    ).join('\n\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sabangnet_sync_logs_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 200px)' }}>
      
      {/* 터미널 제어 필터 툴바 */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span>플랫폼 필터:</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'COUPANG', 'NAVER', 'SYSTEM'].map(plat => (
              <button
                key={plat}
                onClick={() => setPlatformFilter(plat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: platformFilter === plat ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: platformFilter === plat ? '#fff' : 'var(--text-muted)',
                  transition: 'background 0.2s'
                }}
              >
                {plat === 'ALL' ? '전체 로그' : plat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* 로그 다운로드 */}
          <button 
            onClick={exportLogsToFile}
            disabled={filteredLogs.length === 0}
            className="btn-glow" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid var(--card-border)',
              padding: '8px 16px',
              fontSize: '0.8rem',
              opacity: filteredLogs.length === 0 ? 0.5 : 1
            }}
          >
            <Download size={14} /> 로그 파일 내보내기
          </button>

          {/* 로그 클리어 */}
          <button 
            onClick={handleClearLogs}
            className="btn-glow" 
            style={{ 
              background: 'linear-gradient(135deg, var(--color-error) 0%, #991b1b 100%)',
              padding: '8px 16px',
              fontSize: '0.8rem'
            }}
          >
            <Trash2 size={14} /> 콘솔 청소
          </button>
        </div>
      </div>

      {/* 터미널 출력 보드 */}
      <div style={{ 
        flex: 1, 
        background: '#040711', 
        border: '1px solid #1e293b', 
        borderRadius: 'var(--border-radius-md)',
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8)'
      }}>
        {/* 터미널 상단 띠 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)', fontSize: '0.75rem', fontFamily: 'monospace', borderBottom: '1px solid #0f172a', paddingBottom: '8px', marginBottom: '8px' }}>
          <Terminal size={14} />
          <span>SABANGNET_LOCAL_SYNC_TERM // ACTIVE SESSIONS: {filteredLogs.filter(l=>l.isLive).length}</span>
        </div>

        {loading && filteredLogs.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', items: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
            로그 버퍼 읽는 중...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-dark)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            &gt;_ 대기중... 쇼핑몰 연동 명령을 수행하면 실시간 통신 패킷 흐름이 이곳에 노출됩니다.
          </div>
        ) : (
          filteredLogs.map((log) => {
            // 플랫폼별 전구색 지정
            let platColor = '#a855f7'; // SYSTEM
            if (log.platform === 'NAVER') platColor = 'var(--color-naver)';
            if (log.platform === 'COUPANG') platColor = 'var(--color-coupang)';

            // 타입별 메세지 전구색 지정
            let textStyle = { color: '#e2e8f0' }; // INFO
            if (log.type === 'SUCCESS') textStyle = { color: 'var(--color-success)', fontWeight: 'bold' };
            if (log.type === 'ERROR') textStyle = { color: 'var(--color-error)', fontWeight: 'bold' };
            if (log.type === 'WARN') textStyle = { color: 'var(--color-warning)' };

            return (
              <div key={log.id} style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.85rem', 
                lineHeight: 1.5,
                borderBottom: '1px solid rgba(255,255,255,0.01)',
                paddingBottom: '4px' 
              }}>
                {/* 타임스탬프 */}
                <span style={{ color: 'var(--text-dark)', marginRight: '8px' }}>
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>

                {/* 플랫폼 구분 */}
                <span style={{ color: platColor, marginRight: '8px', fontWeight: 'bold' }}>
                  [{log.platform}]
                </span>

                {/* 메세지 본문 */}
                <span style={textStyle}>{log.message}</span>

                {/* 상세 JSON 정보가 있을 경우 확장 드롭다운처럼 패킷 덤프 노출 */}
                {log.details && (
                  <pre style={{ 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid rgba(255,255,255,0.04)', 
                    borderRadius: '4px', 
                    padding: '12px', 
                    marginTop: '6px', 
                    fontSize: '0.75rem', 
                    color: '#94a3b8',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {log.details}
                  </pre>
                )}
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}

export default SyncLogs;
