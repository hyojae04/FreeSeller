import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  HelpCircle, 
  AlertCircle, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Terminal,
  Server
} from 'lucide-react';

function SettingsView({ settings: initialSettings, onSettingsSaved }) {
  const [formData, setFormData] = useState({
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
    simulationMode: true
  });

  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({
    naver: { status: 'idle', message: '' },
    coupang: { status: 'idle', message: '' },
    ssg: { status: 'idle', message: '' },
    lotte: { status: 'idle', message: '' },
    kakao: { status: 'idle', message: '' }
  });

  const [showKeys, setShowKeys] = useState({
    cAccess: false,
    cSecret: false,
    nClient: false,
    nSecret: false,
    ssgKey: false,
    lotteKey: false,
    kakaoKey: false
  });

  useEffect(() => {
    if (initialSettings) {
      setFormData(prev => ({
        ...prev,
        ...initialSettings
      }));
    }
  }, [initialSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const updated = await res.json();
      onSettingsSaved(updated);
      alert('5대 쇼핑몰 API 연동 설정 정보가 영구 저장되었습니다.');
    } catch (err) {
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (platform) => {
    setTestResults(prev => ({
      ...prev,
      [platform]: { status: 'testing', message: '접속 핑 신호 송수신 중...' }
    }));

    try {
      const res = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          credentials: formData
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResults(prev => ({
          ...prev,
          [platform]: { status: 'success', message: data.message }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [platform]: { status: 'error', message: data.message || '인증 정보 오류' }
        }));
      }
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [platform]: { status: 'error', message: `연결 오류: ${err.message}` }
      }));
    }
  };

  const toggleKeyVisibility = (keyName) => {
    setShowKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* 설정 폼 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 시뮬레이션 모드 카드 */}
        <div className="glass-panel" style={{ padding: '20px 24px', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} color="var(--color-warning)" /> 시뮬레이션(Mock) 테스트 모드
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px', maxWidth: '350px', lineHeight: 1.4 }}>
                실제 API 인증키 없이 상품 대량 등록 및 5대 쇼핑몰 연동 시뮬레이션과 로그를 테스트하려면 이 모드를 켜주세요.
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '30px' }}>
              <input 
                type="checkbox" 
                name="simulationMode"
                checked={formData.simulationMode}
                onChange={handleChange}
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: formData.simulationMode ? 'var(--color-primary)' : '#4b5563',
                transition: '.4s', borderRadius: '34px',
                boxShadow: formData.simulationMode ? 'var(--glow-primary)' : 'none'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '22px', width: '22px', left: '4px', bottom: '4px',
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                  transform: formData.simulationMode ? 'translateX(26px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>
        </div>

        {/* 네이버 */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-naver)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              네이버 스마트스토어 API 설정
            </h3>
            <button 
              type="button"
              onClick={() => handleTestConnection('naver')}
              className="btn-glow" 
              style={{ background: 'rgba(45, 180, 0, 0.12)', border: '1px solid rgba(45, 180, 0, 0.3)', color: 'var(--color-naver)', padding: '5px 10px', fontSize: '0.72rem' }}
            >
              연결 테스트
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>스토어 상점 ID</label>
                <input type="text" name="naverStoreId" value={formData.naverStoreId} onChange={handleChange} className="form-input" placeholder="스토어 번호" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Client ID</label>
                <div style={{ position: 'relative' }}>
                  <input type={showKeys.nClient ? 'text' : 'password'} name="naverClientId" value={formData.naverClientId} onChange={handleChange} className="form-input" placeholder="Client ID" />
                  <button type="button" onClick={() => toggleKeyVisibility('nClient')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showKeys.nClient ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Client Secret</label>
              <div style={{ position: 'relative' }}>
                <input type={showKeys.nSecret ? 'text' : 'password'} name="naverClientSecret" value={formData.naverClientSecret} onChange={handleChange} className="form-input" placeholder="Client Secret" />
                <button type="button" onClick={() => toggleKeyVisibility('nSecret')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showKeys.nSecret ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </div>
            {testResults.naver.status !== 'idle' && (
              <div style={{ padding: '10px', borderRadius: '4px', fontSize: '0.78rem', background: testResults.naver.status === 'testing' ? 'rgba(99,102,241,0.1)' : testResults.naver.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${testResults.naver.status === 'testing' ? 'var(--color-primary)' : testResults.naver.status === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`, color: testResults.naver.status === 'testing' ? '#fff' : testResults.naver.status === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                {testResults.naver.message}
              </div>
            )}
          </div>
        </div>

        {/* 쿠팡 */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-coupang)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              쿠팡 WING API 설정
            </h3>
            <button 
              type="button"
              onClick={() => handleTestConnection('coupang')}
              className="btn-glow" 
              style={{ background: 'rgba(255, 95, 0, 0.12)', border: '1px solid rgba(255, 95, 0, 0.3)', color: 'var(--color-coupang)', padding: '5px 10px', fontSize: '0.72rem' }}
            >
              연결 테스트
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>업체 코드 (Vendor ID)</label>
              <input type="text" name="coupangVendorId" value={formData.coupangVendorId} onChange={handleChange} className="form-input" placeholder="예: A00123456" />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Access Key</label>
              <div style={{ position: 'relative' }}>
                <input type={showKeys.cAccess ? 'text' : 'password'} name="coupangAccessKey" value={formData.coupangAccessKey} onChange={handleChange} className="form-input" placeholder="Access Key" />
                <button type="button" onClick={() => toggleKeyVisibility('cAccess')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showKeys.cAccess ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Secret Key</label>
              <div style={{ position: 'relative' }}>
                <input type={showKeys.cSecret ? 'text' : 'password'} name="coupangSecretKey" value={formData.coupangSecretKey} onChange={handleChange} className="form-input" placeholder="Secret Key" />
                <button type="button" onClick={() => toggleKeyVisibility('cSecret')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showKeys.cSecret ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </div>
            {testResults.coupang.status !== 'idle' && (
              <div style={{ padding: '10px', borderRadius: '4px', fontSize: '0.78rem', background: testResults.coupang.status === 'testing' ? 'rgba(99,102,241,0.1)' : testResults.coupang.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${testResults.coupang.status === 'testing' ? 'var(--color-primary)' : testResults.coupang.status === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`, color: testResults.coupang.status === 'testing' ? '#fff' : testResults.coupang.status === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                {testResults.coupang.message}
              </div>
            )}
          </div>
        </div>

        {/* SSG.COM */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#eab308', display: 'flex', alignItems: 'center', gap: '10px' }}>
              SSG.COM API 설정
            </h3>
            <button 
              type="button"
              onClick={() => handleTestConnection('ssg')}
              className="btn-glow" 
              style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#eab308', padding: '5px 10px', fontSize: '0.72rem' }}
            >
              연결 테스트
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>API 사용자 ID (Partner ID)</label>
              <input type="text" name="ssgPartnerId" value={formData.ssgPartnerId} onChange={handleChange} className="form-input" placeholder="쓱 파트너 ID" />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>API 인증키 (API Key)</label>
              <div style={{ position: 'relative' }}>
                <input type={showKeys.ssgKey ? 'text' : 'password'} name="ssgApiKey" value={formData.ssgApiKey} onChange={handleChange} className="form-input" placeholder="SSG API Key" />
                <button type="button" onClick={() => toggleKeyVisibility('ssgKey')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showKeys.ssgKey ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </div>
            {testResults.ssg.status !== 'idle' && (
              <div style={{ padding: '10px', borderRadius: '4px', fontSize: '0.78rem', background: testResults.ssg.status === 'testing' ? 'rgba(99,102,241,0.1)' : testResults.ssg.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${testResults.ssg.status === 'testing' ? 'var(--color-primary)' : testResults.ssg.status === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`, color: testResults.ssg.status === 'testing' ? '#fff' : testResults.ssg.status === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                {testResults.ssg.message}
              </div>
            )}
          </div>
        </div>

        {/* 롯데온 */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e11d48', display: 'flex', alignItems: 'center', gap: '10px' }}>
              롯데온(Lotte On) API 설정
            </h3>
            <button 
              type="button"
              onClick={() => handleTestConnection('lotte')}
              className="btn-glow" 
              style={{ background: 'rgba(225, 29, 72, 0.12)', border: '1px solid rgba(225, 29, 72, 0.3)', color: '#e11d48', padding: '5px 10px', fontSize: '0.72rem' }}
            >
              연결 테스트
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>거래처 번호 (Vendor No)</label>
              <input type="text" name="lotteVendorNo" value={formData.lotteVendorNo} onChange={handleChange} className="form-input" placeholder="롯데온 기본정보 거래처번호" />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OpenAPI Key (API Key)</label>
              <div style={{ position: 'relative' }}>
                <input type={showKeys.lotteKey ? 'text' : 'password'} name="lotteApiKey" value={formData.lotteApiKey} onChange={handleChange} className="form-input" placeholder="Lotteon OpenAPI Key" />
                <button type="button" onClick={() => toggleKeyVisibility('lotteKey')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showKeys.lotteKey ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </div>
            {testResults.lotte.status !== 'idle' && (
              <div style={{ padding: '10px', borderRadius: '4px', fontSize: '0.78rem', background: testResults.lotte.status === 'testing' ? 'rgba(99,102,241,0.1)' : testResults.lotte.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${testResults.lotte.status === 'testing' ? 'var(--color-primary)' : testResults.lotte.status === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`, color: testResults.lotte.status === 'testing' ? '#fff' : testResults.lotte.status === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                {testResults.lotte.message}
              </div>
            )}
          </div>
        </div>

        {/* 카카오 */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#facc15', display: 'flex', alignItems: 'center', gap: '10px' }}>
              카카오 톡스토어 API 설정
            </h3>
            <button 
              type="button"
              onClick={() => handleTestConnection('kakao')}
              className="btn-glow" 
              style={{ background: 'rgba(250, 204, 21, 0.12)', border: '1px solid rgba(250, 204, 21, 0.3)', color: '#facc15', padding: '5px 10px', fontSize: '0.72rem' }}
            >
              연결 테스트
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>API 인증키 (API Key)</label>
              <div style={{ position: 'relative' }}>
                <input type={showKeys.kakaoKey ? 'text' : 'password'} name="kakaoApiKey" value={formData.kakaoApiKey} onChange={handleChange} className="form-input" placeholder="Kakao API Key" />
                <button type="button" onClick={() => toggleKeyVisibility('kakaoKey')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>{showKeys.kakaoKey ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </div>
            {testResults.kakao.status !== 'idle' && (
              <div style={{ padding: '10px', borderRadius: '4px', fontSize: '0.78rem', background: testResults.kakao.status === 'testing' ? 'rgba(99,102,241,0.1)' : testResults.kakao.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${testResults.kakao.status === 'testing' ? 'var(--color-primary)' : testResults.kakao.status === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`, color: testResults.kakao.status === 'testing' ? '#fff' : testResults.kakao.status === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                {testResults.kakao.message}
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-glow" 
          style={{ width: '100%', height: '50px' }}
        >
          {loading ? '인증 정보 저장 중...' : '5대 쇼핑몰 API 연동 설정 일괄 저장'}
        </button>
      </div>

      {/* 도움 가이드 도움말 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <HelpCircle size={18} color="var(--color-primary)" /> 신규 마켓 API 발급 안내
          </h4>
          
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '14px', lineHeight: 1.5 }}>
            <div>
              <strong style={{ color: '#eab308' }}>SSG.COM (쓱닷컴)</strong>
              <ol style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li>[SSG 파트너 오피스 po.ssgadm.com] 접속</li>
                <li>`판매자 정보 관리` &gt; `API 관리` 이동</li>
                <li>`사용자 ID` 복사 및 `API 인증키` 신규 생성</li>
              </ol>
            </div>

            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '10px' }}>
              <strong style={{ color: '#e11d48' }}>롯데온 (LOTTE ON)</strong>
              <ol style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li>[롯데온 스토어센터 store.lotteon.com] 접속</li>
                <li>`판매자 정보` &gt; `OpenAPI 관리` 이동</li>
                <li>`API KEY` 생성 및 대행/자체개발에 '자체개발' 선택</li>
                <li>`기본정보관리`에서 `거래처 번호` 확인 기입</li>
              </ol>
            </div>

            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '10px' }}>
              <strong style={{ color: '#facc15' }}>카카오 톡스토어</strong>
              <ol style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li>[카카오쇼핑 판매자센터 shopping-sell.kakao.com] 접속</li>
                <li>채널 정보설정의 `판매채널 정보` 이동</li>
                <li>API인증 서비스 및 대행사 신청 후 `인증키` 발급</li>
              </ol>
            </div>

            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '10px', color: 'var(--color-warning)' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> IP 등록 필수 마켓</strong>
              <p style={{ marginTop: '2px' }}>
                네이버 및 롯데온, SSG의 경우 API 키 발급 화면에서 반드시 본인의 **로컬 공인 IP 주소**를 허용 IP 란에 등록해야 정상적인 데이터 전송이 가능합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '12px', alignItems: 'start', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <AlertCircle size={20} color="var(--color-error)" style={{ flexShrink: 0 }} />
          <div>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>보안 주의사항</h5>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              본 프로그램은 로컬 호스트(PC) 내부의 파일 DB에 암호화 키를 안전히 기록합니다. 타 서버로 발급받으신 클라이언트 시크릿 및 서명키를 공유하지 않으니 안전하게 사용하셔도 무방합니다.
            </p>
          </div>
        </div>
      </div>
      
    </form>
  );
}

export default SettingsView;
