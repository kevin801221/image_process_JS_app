import React, { useState, useRef } from 'react';
import { FaCopy, FaRedo, FaSave } from 'react-icons/fa';
import useFileUpload from '../hooks/useFileUpload';
import { imageUnderstandingApi } from '../services/api';
import ollamaImageService from '../services/ollamaImageService';
import './ImageUnderstandingPage.css';

const ImageUnderstandingPage = () => {
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [copy, setCopy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleFileSelected = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setAnalysis(null);
        setCopy(null);
        analyzeImage(file);
      };
      reader.readAsDataURL(file);
    } else {
      setError('請選擇有效的圖片文件');
    }
  };

  const { 
    fileInputRef, 
    isDragging, 
    inputProps, 
    dropzoneProps 
  } = useFileUpload({ 
    onFileSelected: handleFileSelected, 
    acceptedTypes: 'image/*' 
  });

  const analyzeImage = async (file) => {
    try {
      setLoading(true);
      setError(null);
      
      // 使用 Ollama 的 Llava 模型分析圖片
      const response = await ollamaImageService.analyzeImage(file);
      
      if (response.success) {
        setAnalysis(response.analysis);
        setCopy(response.copy);
      } else {
        setError(response.message || '圖片分析失敗');
      }
    } catch (err) {
      setError('圖片分析過程中發生錯誤');
      console.error('Error analyzing image:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setAnalysis(null);
    setCopy(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyToClipboard = () => {
    if (!copy) return;
    
    navigator.clipboard.writeText(copy)
      .then(() => {
        alert('已複製到剪貼簿');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('複製失敗');
      });
  };

  const handleRegenerate = () => {
    if (!image) return;
    
    // Convert base64 back to file
    const fetchImage = async () => {
      try {
        const res = await fetch(image);
        const blob = await res.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        analyzeImage(file);
      } catch (err) {
        setError('重新生成時發生錯誤');
        console.error('Error regenerating analysis:', err);
      }
    };
    
    fetchImage();
  };

  const handleOpenSaveDialog = () => {
    if (!copy) return;
    setShowSaveDialog(true);
  };

  const handleCloseSaveDialog = () => {
    setShowSaveDialog(false);
    setTemplateName('');
  };

  const handleSaveTemplate = async () => {
    if (!copy || !templateName) return;
    
    try {
      // In a real app, you would save this to your backend
      // For now, we'll just save to localStorage
      const templates = JSON.parse(localStorage.getItem('copyTemplates') || '[]');
      
      const newTemplate = {
        id: Date.now().toString(),
        name: templateName,
        content: copy,
        date: new Date().toISOString()
      };
      
      templates.push(newTemplate);
      localStorage.setItem('copyTemplates', JSON.stringify(templates));
      
      alert('模板已保存');
      handleCloseSaveDialog();
    } catch (err) {
      console.error('Error saving template:', err);
      alert('保存模板失敗');
    }
  };

  const formatAnalysisResult = (analysis) => {
    if (!analysis) return null;
    
    return (
      <div className="analysis-formatted">
        <h3>圖片內容分析</h3>
        <p>{analysis.description}</p>
        
        {analysis.objects && analysis.objects.length > 0 && (
          <>
            <h3>識別的物體</h3>
            <ul>
              {analysis.objects.map((obj, index) => (
                <li key={index}>{obj.name} - 置信度: {(obj.confidence * 100).toFixed(1)}%</li>
              ))}
            </ul>
          </>
        )}
        
        {analysis.tags && analysis.tags.length > 0 && (
          <>
            <h3>圖片標籤</h3>
            <div className="tags-container">
              {analysis.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="image-understanding-page">
      <h1 className="page-title">圖片理解</h1>
      
      <div className="image-understanding-container">
        <div className="upload-analysis-container">
          <div className="upload-container">
            {!image ? (
              <div 
                className={`upload-area ${isDragging ? 'dragover' : ''}`}
                {...dropzoneProps}
              >
                <div id="upload-placeholder">
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                    </svg>
                  </div>
                  <div className="upload-text">拖放圖片到此處或點擊上傳</div>
                </div>
                <input {...inputProps} />
              </div>
            ) : (
              <div className="preview-container">
                <img src={image} alt="Preview" className="preview-image" />
                <button className="clear-button" onClick={handleClear}>
                  ×
                </button>
              </div>
            )}
          </div>
          
          <div className="analysis-container">
            {loading ? (
              <div className="analysis-loading">
                <div className="spinner"></div>
                <div>分析中...</div>
              </div>
            ) : !image ? (
              <div className="analysis-placeholder">
                <div>上傳圖片以獲取分析結果</div>
              </div>
            ) : error ? (
              <div className="analysis-error">
                <div>{error}</div>
              </div>
            ) : analysis ? (
              <div className="analysis-content">
                {formatAnalysisResult(analysis)}
              </div>
            ) : (
              <div className="analysis-placeholder">
                <div>等待分析結果...</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="copy-container">
          {!image ? (
            <div className="copy-placeholder">
              <div>上傳圖片以生成文案</div>
            </div>
          ) : loading ? (
            <div className="copy-loading">
              <div className="spinner"></div>
              <div>生成文案中...</div>
            </div>
          ) : copy ? (
            <div className="copy-content">
              <h3>生成的文案</h3>
              <div className="copy-text">{copy}</div>
              <div className="copy-actions">
                <button className="action-button" onClick={handleCopyToClipboard}>
                  <FaCopy /> 複製
                </button>
                <button className="action-button" onClick={handleRegenerate}>
                  <FaRedo /> 重新生成
                </button>
                <button className="action-button" onClick={handleOpenSaveDialog}>
                  <FaSave /> 保存為模板
                </button>
              </div>
            </div>
          ) : (
            <div className="copy-placeholder">
              <div>等待文案生成...</div>
            </div>
          )}
        </div>
      </div>
      
      {showSaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <div className="dialog-header">
              <h3>保存為模板</h3>
              <button className="close-dialog" onClick={handleCloseSaveDialog}>×</button>
            </div>
            <div className="dialog-body">
              <div className="form-group">
                <label htmlFor="template-name">模板名稱</label>
                <input 
                  type="text" 
                  id="template-name" 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="輸入模板名稱"
                />
              </div>
            </div>
            <div className="dialog-footer">
              <button className="cancel-btn" onClick={handleCloseSaveDialog}>取消</button>
              <button 
                className="save-btn" 
                onClick={handleSaveTemplate}
                disabled={!templateName}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUnderstandingPage;
