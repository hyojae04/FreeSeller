import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle, 
  AlertOctagon, 
  ChevronRight, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';

function BulkManager({ onImportSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef(null);

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // 엑셀 확장자 체크 (.xlsx, .xls)
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setErrorMsg('');
      } else {
        setErrorMsg('엑셀 파일(.xlsx, .xls) 형식만 업로드 가능합니다.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg('');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // 템플릿 다운로드 트리거
  const downloadTemplate = () => {
    window.open('/api/excel/template', '_blank');
  };

  // 파일 업로드 수행
  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErrorMsg('');
    setReport(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/excel/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '엑셀 업로드 중 오류가 발생했습니다.');
      }

      const data = await res.json();
      setReport(data);
      setSelectedFile(null); // 초기화
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* 엑셀 파일 업로드 컨트롤러 패널 */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>대량 등록 엑셀 업로드</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
          양식 규격에 알맞게 작성된 엑셀 파일을 업로드하면 상품이 로컬 데이터베이스에 즉시 추가됩니다.
        </p>

        {/* 드래그 앤 드롭 영역 */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          style={{
            border: dragActive ? '2px dashed var(--color-primary)' : '2px dashed var(--card-border)',
            background: dragActive ? 'rgba(79, 70, 229, 0.05)' : 'rgba(0, 0, 0, 0.15)',
            borderRadius: 'var(--border-radius-md)',
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: dragActive ? 'var(--glow-primary)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            position: 'relative'
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
          />

          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            background: 'var(--bg-tertiary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: selectedFile ? 'var(--color-success)' : 'var(--text-muted)'
          }}>
            {selectedFile ? <FileSpreadsheet size={28} /> : <Upload size={28} />}
          </div>

          <div>
            {selectedFile ? (
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            ) : (
              <>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  파일을 마우스로 끌어서 놓거나 클릭하여 탐색기 열기
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  지원 포맷: Microsoft Excel (.xlsx, .xls)
                </p>
              </>
            )}
          </div>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)', fontSize: '0.85rem', marginTop: '16px' }}>
            <AlertOctagon size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
          {selectedFile && (
            <button 
              onClick={() => setSelectedFile(null)}
              className="btn-glow" 
              style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--card-border)' }}
            >
              선택 파일 제거
            </button>
          )}

          <button 
            onClick={handleUploadSubmit}
            disabled={!selectedFile || uploading}
            className="btn-glow"
            style={{ 
              opacity: (!selectedFile || uploading) ? 0.6 : 1,
              cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1.5s linear infinite' }} /> 엑셀 대용량 등록 중...
              </>
            ) : '로컬 DB에 업로드 및 추가'}
          </button>
        </div>
      </div>

      {/* 가이드 배너 및 등록 결과 리포트 패널 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 양식 템플릿 배너 */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>표준 등록 엑셀 템플릿 다운로드</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px', lineHeight: 1.4 }}>
            등록을 성공시키기 위해 표준화된 헤더 명칭과 샘플 값이 기입된 기본 서식을 제공합니다. 먼저 이를 확인하세요.
          </p>

          <button 
            onClick={downloadTemplate}
            className="btn-glow" 
            style={{ 
              width: '100%',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)'
            }}
          >
            <FileSpreadsheet size={16} /> 기본 표준 엑셀 템플릿 받기 (.xlsx)
          </button>
        </div>

        {/* 등록 완료 결과 리포트 출력 */}
        {report && (
          <div className="glass-panel" style={{ padding: '24px', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <CheckCircle size={20} color="var(--color-success)" />
              <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>대량 상품 추가 리포트</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '16px', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>전체 로우</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{report.total}건</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>성공 건수</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{report.success}건</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>오류 건수</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: report.failures > 0 ? 'var(--color-error)' : 'inherit' }}>{report.failures}건</div>
              </div>
            </div>

            {/* 오류 상세가 있을 경우 출력 */}
            {report.errors.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-error)', display: 'block', marginBottom: '6px' }}>오류 행 리스트 (재교정 필요):</span>
                <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px', padding: '8px' }}>
                  {report.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', color: 'var(--color-error)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{err.rowIndex}행 - {err.productName}</span>
                      <span>{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={onImportSuccess}
              className="btn-glow" 
              style={{ width: '100%' }}
            >
              상품 목록에서 확인하기 <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default BulkManager;
