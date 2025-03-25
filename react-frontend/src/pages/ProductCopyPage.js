import React, { useState } from 'react';
import { FaCopy, FaRedo, FaSave } from 'react-icons/fa';
import { productCopyApi } from '../services/api';
import ollamaService from '../services/ollamaService';
import './ProductCopyPage.css';

const ProductCopyPage = () => {
  const [formData, setFormData] = useState({
    productName: '',
    productType: '',
    targetAudience: '',
    keyFeatures: '',
    tone: 'professional',
    length: 'medium'
  });
  
  const [generatedCopy, setGeneratedCopy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.productName || !formData.productType) {
      setError('請填寫產品名稱和類型');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 使用 Ollama 的 Gemma3 模型生成文案
      const response = await ollamaService.generateProductCopy(formData);
      
      if (response.success) {
        setGeneratedCopy(response.copy);
      } else {
        setError(response.message || '生成文案失敗');
      }
    } catch (err) {
      setError('生成文案過程中發生錯誤');
      console.error('Error generating copy:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 使用 Ollama 的 Gemma3 模型重新生成文案
      const response = await ollamaService.generateProductCopy(formData);
      
      if (response.success) {
        setGeneratedCopy(response.copy);
      } else {
        setError(response.message || '重新生成文案失敗');
      }
    } catch (err) {
      setError('重新生成文案過程中發生錯誤');
      console.error('Error regenerating copy:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedCopy) return;
    
    navigator.clipboard.writeText(generatedCopy)
      .then(() => {
        alert('已複製到剪貼簿');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('複製失敗');
      });
  };

  const handleOpenSaveDialog = () => {
    if (!generatedCopy) return;
    setShowSaveDialog(true);
  };

  const handleCloseSaveDialog = () => {
    setShowSaveDialog(false);
    setTemplateName('');
  };

  const handleSaveTemplate = async () => {
    if (!generatedCopy || !templateName) return;
    
    try {
      // In a real app, you would save this to your backend
      // For now, we'll just save to localStorage
      const templates = JSON.parse(localStorage.getItem('copyTemplates') || '[]');
      
      const newTemplate = {
        id: Date.now().toString(),
        name: templateName,
        content: generatedCopy,
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

  return (
    <div className="product-copy-page">
      <h1 className="page-title">商品文案生成</h1>
      
      <div className="product-copy-container">
        <div className="form-container">
          <h2>產品資訊</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="productName">產品名稱 *</label>
              <input 
                type="text" 
                id="productName" 
                name="productName" 
                value={formData.productName}
                onChange={handleInputChange}
                placeholder="例如：超輕量運動鞋"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="productType">產品類型 *</label>
              <input 
                type="text" 
                id="productType" 
                name="productType" 
                value={formData.productType}
                onChange={handleInputChange}
                placeholder="例如：運動鞋、電子產品、家居用品"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="targetAudience">目標受眾</label>
              <input 
                type="text" 
                id="targetAudience" 
                name="targetAudience" 
                value={formData.targetAudience}
                onChange={handleInputChange}
                placeholder="例如：年輕運動愛好者、上班族、家庭主婦"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="keyFeatures">產品特點</label>
              <textarea 
                id="keyFeatures" 
                name="keyFeatures" 
                value={formData.keyFeatures}
                onChange={handleInputChange}
                placeholder="列出產品的主要特點和優勢，每行一個"
                rows="5"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tone">文案風格</label>
              <select 
                id="tone" 
                name="tone" 
                value={formData.tone}
                onChange={handleInputChange}
              >
                <option value="professional">專業正式</option>
                <option value="casual">輕鬆隨意</option>
                <option value="enthusiastic">熱情洋溢</option>
                <option value="humorous">幽默風趣</option>
                <option value="luxury">高端奢華</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="length">文案長度</label>
              <select 
                id="length" 
                name="length" 
                value={formData.length}
                onChange={handleInputChange}
              >
                <option value="short">簡短 (50-100字)</option>
                <option value="medium">中等 (100-200字)</option>
                <option value="long">詳細 (200-300字)</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="generate-button"
              disabled={loading}
            >
              {loading ? '生成中...' : '生成文案'}
            </button>
          </form>
        </div>
        
        <div className="result-container">
          <h2>生成結果</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <div>生成文案中...</div>
            </div>
          ) : generatedCopy ? (
            <div className="copy-result">
              <div className="copy-content">{generatedCopy}</div>
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
            <div className="placeholder-message">
              填寫產品資訊並點擊「生成文案」按鈕以獲取結果
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

export default ProductCopyPage;
