import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaImage, FaRedo, FaSave, FaDownload, FaUndo, FaArrowLeft, FaTrash, FaCut, FaPencilAlt, FaFillDrip, FaFile } from 'react-icons/fa';
import './BatchUploadPage.css';
import useFileUpload from '../hooks/useFileUpload';
import imageProcessingService from '../services/imageProcessingService';

const BatchUploadPage = () => {
  const navigate = useNavigate();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRemoveBackground, setAutoRemoveBackground] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [points, setPoints] = useState(250); // 假設的點數
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [backgroundOptions, setBackgroundOptions] = useState([
    { id: 'transparent', name: '透明背景', color: 'transparent' },
    { id: 'white', name: '白色背景', color: '#ffffff' },
    { id: 'black', name: '黑色背景', color: '#000000' },
    { id: 'red', name: '紅色背景', color: '#ff6b6b' },
    { id: 'blue', name: '藍色背景', color: '#4dabf7' },
    { id: 'green', name: '綠色背景', color: '#69db7c' },
  ]);
  const [selectedBackground, setSelectedBackground] = useState('transparent');
  
  // 歷史操作記錄，用於復原和重做功能
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 文件輸入引用
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // 處理文件拖放
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesSelected(files);
    }
  };
  
  // 處理文件選擇
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelected(files);
    }
  };
  
  // 觸發文件選擇器
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 處理選擇的文件
  function handleFilesSelected(files) {
    if (!files || files.length === 0) return;
    
    const newImages = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      status: 'uploaded',
      selected: false
    }));

    setUploadedImages(prev => [...prev, ...newImages]);

    // 如果啟用了自動去背，則開始處理
    if (autoRemoveBackground) {
      processImages(newImages);
    }
  }

  // 批量處理圖像
  async function processImages(images) {
    setLoading(true);
    setError(null);

    try {
      // 保存當前狀態到歷史記錄
      saveToHistory([...uploadedImages], [...processedImages]);
      
      // 更新所有圖像狀態為處理中
      const updatedUploadedImages = uploadedImages.map(img => {
        const isInBatch = images.some(batchImg => batchImg.id === img.id);
        return isInBatch ? { ...img, status: 'processing' } : img;
      });
      
      setUploadedImages(updatedUploadedImages);
      
      // 獲取要處理的文件
      const filesToProcess = images.map(img => img.file);
      
      // 添加 API key 參數
      const options = {
        api_key: 'G9H4NwTL3LosAwfFmn4GVLC3'
      };
      
      // 使用批量處理服務
      const result = await imageProcessingService.batchRemoveBackground(filesToProcess, options);
      
      let updatedProcessedImages = [...processedImages];
      let finalUploadedImages = [...updatedUploadedImages];
      
      if (result.success && result.processedFiles) {
        // 處理結果
        const processed = [];
        const processedFiles = result.processedFiles;
        
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const processedFile = processedFiles[i] || null;
          
          if (processedFile && processedFile.processed_url) {
            processed.push({
              id: image.id,
              originalUrl: processedFile.original_url || image.url,
              processedUrl: processedFile.processed_url,
              name: image.name,
              isBackgroundRemoved: processedFile.is_background_removed || false
            });
            
            // 更新狀態為已處理
            finalUploadedImages = finalUploadedImages.map(img => 
              img.id === image.id ? { ...img, status: 'processed' } : img
            );
          } else {
            // 更新狀態為錯誤
            finalUploadedImages = finalUploadedImages.map(img => 
              img.id === image.id ? { 
                ...img, 
                status: 'error', 
                error: processedFile?.error || '處理失敗' 
              } : img
            );
          }
        }
        
        updatedProcessedImages = [...updatedProcessedImages, ...processed];
        setProcessedImages(updatedProcessedImages);
        setUploadedImages(finalUploadedImages);
      } else {
        // 更新所有圖像狀態為錯誤
        finalUploadedImages = finalUploadedImages.map(img => {
          const isInBatch = images.some(batchImg => batchImg.id === img.id);
          return isInBatch ? { ...img, status: 'error', error: result.message || '批量處理失敗' } : img;
        });
        
        setUploadedImages(finalUploadedImages);
        setError(result.message || '批量處理圖像時發生錯誤，請重試');
      }
    } catch (err) {
      console.error('處理圖像時出錯:', err);
      setError('批量處理圖像時發生錯誤，請重試');
      
      // 更新所有圖像狀態為錯誤
      const finalUploadedImages = uploadedImages.map(img => {
        const isInBatch = images.some(batchImg => batchImg.id === img.id);
        return isInBatch ? { ...img, status: 'error', error: '處理失敗' } : img;
      });
      
      setUploadedImages(finalUploadedImages);
    } finally {
      setLoading(false);
    }
  }

  // 處理自動去背開關
  const handleAutoRemoveBackgroundToggle = () => {
    setAutoRemoveBackground(!autoRemoveBackground);
  };

  // 處理圖像選擇
  const handleImageSelect = (id) => {
    setUploadedImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, selected: !img.selected } : img
      )
    );

    // 更新選中的圖像列表
    setSelectedImages(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        return prev.filter(imgId => imgId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 刪除選中的圖像
  const handleDeleteSelected = () => {
    if (selectedImages.length === 0) return;
    
    // 保存當前狀態到歷史記錄
    saveToHistory([...uploadedImages], [...processedImages]);

    setUploadedImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
    setProcessedImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
    setSelectedImages([]);
  };

  // 處理單個圖像刪除
  const handleDeleteImage = (id) => {
    // 保存當前狀態到歷史記錄
    saveToHistory([...uploadedImages], [...processedImages]);
    
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    setProcessedImages(prev => prev.filter(img => img.id !== id));
    
    // 如果該圖像在選中列表中，也移除它
    if (selectedImages.includes(id)) {
      setSelectedImages(prev => prev.filter(imgId => imgId !== id));
    }
  };

  // 處理單個圖像去背
  const handleRemoveBackground = async (id) => {
    const image = uploadedImages.find(img => img.id === id);
    if (!image) return;
    
    // 保存當前狀態到歷史記錄
    saveToHistory([...uploadedImages], [...processedImages]);

    setUploadedImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, status: 'processing' } : img
      )
    );

    try {
      // 添加 API key 參數
      const options = {
        api_key: 'G9H4NwTL3LosAwfFmn4GVLC3'
      };
      
      const result = await imageProcessingService.removeBackground(image.file, options);

      if (result.success) {
        // 更新處理後的圖像
        setProcessedImages(prev => {
          const exists = prev.find(img => img.id === id);
          if (exists) {
            return prev.map(img => 
              img.id === id ? { 
                ...img, 
                processedUrl: result.processedImage,
                isBackgroundRemoved: true
              } : img
            );
          } else {
            return [...prev, {
              id,
              originalUrl: image.url,
              processedUrl: result.processedImage,
              name: image.name,
              isBackgroundRemoved: true
            }];
          }
        });

        // 更新狀態為已處理
        setUploadedImages(prev => 
          prev.map(img => 
            img.id === id ? { ...img, status: 'processed' } : img
          )
        );
      } else {
        // 更新狀態為錯誤
        setUploadedImages(prev => 
          prev.map(img => 
            img.id === id ? { ...img, status: 'error', error: result.message } : img
          )
        );
      }
    } catch (err) {
      console.error('處理圖像時出錯:', err);
      // 更新狀態為錯誤
      setUploadedImages(prev => 
        prev.map(img => 
          img.id === id ? { ...img, status: 'error', error: '處理圖像時出錯' } : img
        )
      );
    }
  };
  
  // 處理編輯單個圖片
  const handleEditImage = (id) => {
    // 導航到圖像編輯器頁面，並傳遞圖像 ID
    navigate(`/image-editor?id=${id}`);
  };
  
  // 處理背景替換
  const handleChangeBackground = (bgId) => {
    setSelectedBackground(bgId);
    
    // 如果有選中的圖像，則只更新選中的圖像背景
    if (selectedImages.length > 0) {
      applyBackgroundToSelected(bgId);
    }
  };
  
  // 將背景應用到選中的圖像
  const applyBackgroundToSelected = (bgId) => {
    const bgOption = backgroundOptions.find(bg => bg.id === bgId);
    if (!bgOption) return;
    
    // 更新選中圖像的背景
    setProcessedImages(prev => 
      prev.map(img => {
        if (selectedImages.includes(img.id) && img.isBackgroundRemoved) {
          // 創建一個新的 URL 參數，包含背景顏色
          const url = new URL(img.processedUrl);
          url.searchParams.set('bg', bgOption.color.replace('#', ''));
          
          return {
            ...img,
            processedUrl: url.toString(),
            currentBackground: bgId
          };
        }
        return img;
      })
    );
  };
  
  // 將背景應用到所有已去背的圖像
  const applyBackgroundToAll = (bgId) => {
    const bgOption = backgroundOptions.find(bg => bg.id === bgId);
    if (!bgOption) return;
    
    // 更新所有已去背圖像的背景
    setProcessedImages(prev => 
      prev.map(img => {
        if (img.isBackgroundRemoved) {
          // 創建一個新的 URL 參數，包含背景顏色
          const url = new URL(img.processedUrl);
          url.searchParams.set('bg', bgOption.color.replace('#', ''));
          
          return {
            ...img,
            processedUrl: url.toString(),
            currentBackground: bgId
          };
        }
        return img;
      })
    );
  };

  // 處理返回到主頁
  const handleExitBatchMode = () => {
    navigate('/');
  };
  
  // 處理檔案選單
  const handleFileMenuClick = () => {
    setShowFileDropdown(!showFileDropdown);
  };
  
  // 處理儲存功能
  const handleSave = () => {
    // 儲存到「我的」頁面的邏輯
    alert('圖片已儲存到「我的」頁面');
    setShowFileDropdown(false);
  };
  
  // 處理下載功能
  const handleDownloadClick = () => {
    setShowDownloadOptions(true);
    setShowFileDropdown(false);
  };
  
  // 處理下載特定格式
  const handleDownloadFormat = (format) => {
    // 下載選中的圖片或所有圖片
    const imagesToDownload = selectedImages.length > 0 ? 
      processedImages.filter(img => selectedImages.includes(img.id)) : 
      processedImages;
      
    if (imagesToDownload.length === 0) {
      alert('請先選擇要下載的圖片');
      return;
    }
    
    // 實際下載邏輯
    imagesToDownload.forEach(img => {
      const link = document.createElement('a');
      link.href = img.processedUrl || img.originalUrl;
      link.download = `${img.name.split('.')[0]}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    
    setShowDownloadOptions(false);
  };
  
  // 處理復原功能
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousState = history[historyIndex - 1];
      setProcessedImages(previousState.processedImages);
      setUploadedImages(previousState.uploadedImages);
    }
  };
  
  // 處理重做功能
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextState = history[historyIndex + 1];
      setProcessedImages(nextState.processedImages);
      setUploadedImages(nextState.uploadedImages);
    }
  };
  
  // 保存操作到歷史記錄
  const saveToHistory = (uploadedImgs, processedImgs) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      uploadedImages: [...uploadedImgs],
      processedImages: [...processedImgs]
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // 處理前往儲值
  const handleRecharge = () => {
    alert('前往儲值頁面');
  };
  
  // 處理查看 Point 紀錄
  const handleViewPointHistory = () => {
    alert('查看 Point 紀錄');
  };
  
  // 處理導航到其他頁面
  const handleNavigate = (path) => {
    navigate(path);
  };

  // 渲染上傳區域
  const renderUploadArea = () => (
    <div 
      className={`batch-upload-area ${isDragging ? 'dragover' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleUploadClick}
    >
      <div className="upload-icon">
        <FaImage />
      </div>
      <div className="upload-text">拖放多張圖片到此處或點擊上傳</div>
      <div className="upload-subtext">支持 JPG、JPEG、PNG 格式</div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        multiple 
        style={{ display: 'none' }} 
      />
    </div>
  );

  // 渲染圖像網格
  const renderImageGrid = () => (
    <div className="image-grid">
      {uploadedImages.map(image => {
        const processedImage = processedImages.find(img => img.id === image.id);
        const isProcessed = image.status === 'processed';
        const isBackgroundRemoved = processedImage?.isBackgroundRemoved;
        
        return (
          <div key={image.id} className={`image-item ${image.selected ? 'selected' : ''}`}>
            <div className="image-checkbox" onClick={() => handleImageSelect(image.id)}>
              <div className={`checkbox ${image.selected ? 'checked' : ''}`}></div>
            </div>
            
            <div className="image-preview">
              <img 
                src={processedImage?.processedUrl || image.url} 
                alt={image.name} 
              />
              
              {image.status === 'processing' && (
                <div className="processing-overlay">
                  <div className="spinner"></div>
                  <div>處理中...</div>
                </div>
              )}
              
              {isProcessed && isBackgroundRemoved && (
                <div className="background-removed-badge">已去背</div>
              )}
            </div>
            
            <div className="image-actions">
              <button className="action-button" onClick={() => handleDeleteImage(image.id)} title="刪除">
                <FaTrash />
              </button>
              <button 
                className="action-button" 
                onClick={() => handleRemoveBackground(image.id)} 
                disabled={image.status === 'processing'}
                title="去背"
              >
                <FaCut />
              </button>
              {isProcessed && isBackgroundRemoved && (
                <button 
                  className="action-button" 
                  onClick={() => applyBackgroundToSelected(selectedBackground)}
                  disabled={image.status === 'processing'}
                  title="替換背景"
                >
                  <FaFillDrip />
                </button>
              )}
              <button className="action-button" title="編輯">
                <FaPencilAlt />
              </button>
            </div>
            
            <div className="image-name">{image.name}</div>
            
            {image.status === 'error' && (
              <div className="image-error">{image.error || '處理失敗'}</div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="batch-upload-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">AI 商品圖設計室</h1>
          <div className="header-actions">
            <div className="dropdown-menu">
              <button className="menu-button" onClick={handleFileMenuClick}>
                <FaFile /> 檔案
              </button>
              {showFileDropdown && (
                <div className="dropdown-content">
                  <button onClick={handleSave}>儲存</button>
                  <button onClick={handleDownloadClick}>下載</button>
                </div>
              )}
              {showDownloadOptions && (
                <div className="download-options">
                  <div className="download-header">
                    <h3>選擇下載格式</h3>
                    <button className="close-button" onClick={() => setShowDownloadOptions(false)}>×</button>
                  </div>
                  <div className="download-formats">
                    <button onClick={() => handleDownloadFormat('JPG')}>JPG</button>
                    <button onClick={() => handleDownloadFormat('PNG')}>PNG</button>
                    <button onClick={() => handleDownloadFormat('PDF')}>PDF</button>
                  </div>
                </div>
              )}
            </div>
            <button 
              className="action-button" 
              title="復原" 
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <FaUndo />
            </button>
            <button 
              className="action-button" 
              title="重做" 
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <FaRedo />
            </button>
          </div>
        </div>
        
        <div className="header-right">
          <div className="points-display">
            可用 Point 數：{points}
          </div>
          <button className="primary-button" onClick={handleRecharge}>前往儲值</button>
          <button className="secondary-button" onClick={handleViewPointHistory}>查看 Point 紀錄</button>
        </div>
      </div>
      
      <div className="batch-content">
        <div className="batch-header">
          <button className="exit-batch-button" onClick={handleExitBatchMode}>
            <FaArrowLeft /> 退出批量模式
          </button>
          
          {selectedImages.length > 0 && (
            <button className="delete-selected-button" onClick={handleDeleteSelected}>
              <FaTrash /> 刪除 ({selectedImages.length})
            </button>
          )}
        </div>
        
        <div className="batch-controls">
          <div className="auto-bg-toggle">
            <label className="toggle-label">
              <span>自動去背</span>
              <div className={`toggle-switch ${autoRemoveBackground ? 'active' : ''}`} onClick={handleAutoRemoveBackgroundToggle}>
                <div className="toggle-slider"></div>
              </div>
            </label>
          </div>
          
          {uploadedImages.length > 0 && processedImages.some(img => img.isBackgroundRemoved) && (
            <div className="background-options">
              <h3 className="section-title">背景選項</h3>
              <div className="background-colors">
                {backgroundOptions.map(bg => (
                  <div 
                    key={bg.id}
                    className={`background-color-option ${selectedBackground === bg.id ? 'selected' : ''}`}
                    style={{ backgroundColor: bg.color === 'transparent' ? 'transparent' : bg.color }}
                    onClick={() => handleChangeBackground(bg.id)}
                    title={bg.name}
                  >
                    {bg.color === 'transparent' && <div className="transparent-pattern"></div>}
                  </div>
                ))}
              </div>
              <div className="background-actions">
                <button 
                  className="apply-bg-button" 
                  onClick={() => applyBackgroundToAll(selectedBackground)}
                >
                  套用至所有圖片
                </button>
                {selectedImages.length > 0 && (
                  <button 
                    className="apply-bg-button" 
                    onClick={() => applyBackgroundToSelected(selectedBackground)}
                  >
                    套用至選中圖片 ({selectedImages.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {uploadedImages.length === 0 ? (
          renderUploadArea()
        ) : (
          <div className="batch-images-container">
            {renderImageGrid()}
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default BatchUploadPage;
