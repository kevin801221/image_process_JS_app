import React, { useState, useRef, useEffect } from 'react';
import './Cropper.css';
import imageProcessingService from '../../services/imageProcessingService';

const Cropper = ({ 
  originalImage, 
  onProcessedImage,
  isProcessing,
  setIsProcessing
}) => {
  const [cropMode, setCropMode] = useState('free'); // free, 1:1, 4:3, 16:9
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState('idle'); // idle, processing, done, error
  const [errorMessage, setErrorMessage] = useState('');
  const [originalImageFile, setOriginalImageFile] = useState(null);
  
  const canvasRef = useRef(null);
  const cropBoxRef = useRef(null);
  
  // 初始化畫布
  useEffect(() => {
    if (!originalImage) return;
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = originalImage;
    
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // 設置畫布尺寸
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 繪製原始圖像
      ctx.drawImage(img, 0, 0);
      
      // 初始化裁剪框為圖像中心的一半大小
      const initialWidth = Math.floor(img.width / 2);
      const initialHeight = Math.floor(img.height / 2);
      const initialX = Math.floor((img.width - initialWidth) / 2);
      const initialY = Math.floor((img.height - initialHeight) / 2);
      
      setCropData({
        x: initialX,
        y: initialY,
        width: initialWidth,
        height: initialHeight
      });
      
      // 將 base64 轉換為文件對象，用於 API 調用
      fetch(originalImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'image.png', { type: 'image/png' });
          setOriginalImageFile(file);
        })
        .catch(err => {
          console.error('Error converting image to file:', err);
        });
    };
  }, [originalImage]);
  
  // 更新裁剪框樣式
  useEffect(() => {
    if (!cropBoxRef.current) return;
    
    const cropBox = cropBoxRef.current;
    cropBox.style.left = `${cropData.x}px`;
    cropBox.style.top = `${cropData.y}px`;
    cropBox.style.width = `${cropData.width}px`;
    cropBox.style.height = `${cropData.height}px`;
  }, [cropData]);
  
  // 處理裁剪模式變更
  const handleCropModeChange = (mode) => {
    setCropMode(mode);
    
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // 根據選擇的模式計算新的裁剪框尺寸
    let newWidth, newHeight;
    
    switch (mode) {
      case '1:1':
        newWidth = Math.min(imgWidth, imgHeight);
        newHeight = newWidth;
        break;
      case '4:3':
        if (imgWidth / imgHeight > 4 / 3) {
          newHeight = imgHeight;
          newWidth = newHeight * (4 / 3);
        } else {
          newWidth = imgWidth;
          newHeight = newWidth * (3 / 4);
        }
        break;
      case '16:9':
        if (imgWidth / imgHeight > 16 / 9) {
          newHeight = imgHeight;
          newWidth = newHeight * (16 / 9);
        } else {
          newWidth = imgWidth;
          newHeight = newWidth * (9 / 16);
        }
        break;
      default: // 自由模式
        return; // 不改變當前裁剪框
    }
    
    // 確保裁剪框不超出圖像範圍
    newWidth = Math.min(newWidth, imgWidth);
    newHeight = Math.min(newHeight, imgHeight);
    
    // 將裁剪框置於圖像中心
    const newX = Math.floor((imgWidth - newWidth) / 2);
    const newY = Math.floor((imgHeight - newHeight) / 2);
    
    setCropData({
      x: newX,
      y: newY,
      width: Math.floor(newWidth),
      height: Math.floor(newHeight)
    });
  };
  
  // 處理裁剪框拖動開始
  const handleMouseDown = (e) => {
    if (!cropBoxRef.current) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    
    // 防止拖動時選中文字
    e.preventDefault();
  };
  
  // 處理裁剪框拖動
  const handleMouseMove = (e) => {
    if (!isDragging || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // 計算移動距離
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // 更新拖動起始位置
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    
    // 計算新位置
    let newX = cropData.x + deltaX;
    let newY = cropData.y + deltaY;
    
    // 確保裁剪框不超出圖像範圍
    newX = Math.max(0, Math.min(newX, imgWidth - cropData.width));
    newY = Math.max(0, Math.min(newY, imgHeight - cropData.height));
    
    setCropData(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
  };
  
  // 處理裁剪框拖動結束
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 應用裁剪
  const applyCrop = async () => {
    if (!originalImageFile || status === 'processing') return;
    
    setStatus('processing');
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      // 使用圖像處理服務裁剪圖像
      const result = await imageProcessingService.cropImage(originalImageFile, cropData);
      
      if (result.success) {
        setStatus('done');
        
        // 將處理後的圖像傳回父組件
        onProcessedImage(result.processedImage);
      } else {
        setStatus('error');
        setErrorMessage(result.message || '裁剪失敗');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      setStatus('error');
      setErrorMessage('處理圖像時發生錯誤');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 取消裁剪
  const cancelCrop = () => {
    // 重置裁剪框
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const initialWidth = Math.floor(imgWidth / 2);
    const initialHeight = Math.floor(imgHeight / 2);
    const initialX = Math.floor((imgWidth - initialWidth) / 2);
    const initialY = Math.floor((imgHeight - initialHeight) / 2);
    
    setCropData({
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: initialHeight
    });
    
    setCropMode('free');
  };
  
  // 智慧裁剪
  const smartCrop = async (aspectRatio) => {
    if (!originalImageFile || status === 'processing') return;
    
    setStatus('processing');
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      // 使用圖像處理服務進行智慧裁剪
      const result = await imageProcessingService.smartCrop(originalImageFile, aspectRatio);
      
      if (result.success) {
        setStatus('done');
        
        // 將處理後的圖像傳回父組件
        onProcessedImage(result.processedImage);
      } else {
        setStatus('error');
        setErrorMessage(result.message || '智慧裁剪失敗');
      }
    } catch (error) {
      console.error('Error smart cropping image:', error);
      setStatus('error');
      setErrorMessage('處理圖像時發生錯誤');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cropper">
      <div 
        className="canvas-container"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="crop-canvas"></canvas>
        <div 
          ref={cropBoxRef} 
          className="crop-box"
          onMouseDown={handleMouseDown}
        ></div>
      </div>
      
      <div className="crop-controls">
        <div className="crop-options">
          <button 
            className={`crop-option ${cropMode === 'free' ? 'active' : ''}`}
            onClick={() => handleCropModeChange('free')}
          >
            自由
          </button>
          <button 
            className={`crop-option ${cropMode === '1:1' ? 'active' : ''}`}
            onClick={() => handleCropModeChange('1:1')}
          >
            1:1
          </button>
          <button 
            className={`crop-option ${cropMode === '4:3' ? 'active' : ''}`}
            onClick={() => handleCropModeChange('4:3')}
          >
            4:3
          </button>
          <button 
            className={`crop-option ${cropMode === '16:9' ? 'active' : ''}`}
            onClick={() => handleCropModeChange('16:9')}
          >
            16:9
          </button>
        </div>
        
        <div className="crop-actions">
          <button 
            className="crop-action"
            onClick={applyCrop}
            disabled={status === 'processing'}
          >
            {status === 'processing' ? '處理中...' : '套用'}
          </button>
          <button 
            className="crop-action"
            onClick={cancelCrop}
            disabled={status === 'processing'}
          >
            取消
          </button>
        </div>
        
        <div className="smart-crop-actions">
          <h4>智慧裁剪</h4>
          <div className="smart-crop-options">
            <button 
              className="smart-crop-option"
              onClick={() => smartCrop(1)}
              disabled={status === 'processing'}
            >
              1:1
            </button>
            <button 
              className="smart-crop-option"
              onClick={() => smartCrop(4/3)}
              disabled={status === 'processing'}
            >
              4:3
            </button>
            <button 
              className="smart-crop-option"
              onClick={() => smartCrop(16/9)}
              disabled={status === 'processing'}
            >
              16:9
            </button>
          </div>
        </div>
        
        {status === 'error' && (
          <div className="error-message">
            {errorMessage || '裁剪失敗，請重試'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cropper;
