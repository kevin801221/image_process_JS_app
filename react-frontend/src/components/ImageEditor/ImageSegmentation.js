import React, { useState, useEffect, useRef } from 'react';
import { FaMagic, FaUndo, FaRedo, FaEraser, FaPencilAlt, FaCheck, FaDownload, FaAdjust, FaCrop, FaCloud } from 'react-icons/fa';
import axios from 'axios';
import './ImageSegmentation.css';

const ImageSegmentation = ({ image, onSegmentationComplete }) => {
  const [mode, setMode] = useState('auto'); // 'auto' or 'manual' or 'edge' or 'api'
  const [threshold, setThreshold] = useState(30);
  const [brushSize, setBrushSize] = useState(20);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [segmentedImage, setSegmentedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [edgeDetectionLevel, setEdgeDetectionLevel] = useState(50);
  const [smoothingLevel, setSmoothingLevel] = useState(5);
  const [toolType, setToolType] = useState('brush'); // 'brush' or 'eraser'
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [apiKey, setApiKey] = useState('');
  
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const edgeCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  // 初始化畫布
  useEffect(() => {
    if (!image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      // 設置畫布大小與圖像相同
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 繪製原始圖像
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 初始化遮罩畫布
      const maskCanvas = maskCanvasRef.current;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      
      // 初始化邊緣檢測畫布
      const edgeCanvas = edgeCanvasRef.current;
      edgeCanvas.width = img.width;
      edgeCanvas.height = img.height;
      
      // 清空歷史記錄並添加初始狀態
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialState]);
      setHistoryIndex(0);
      
      // 設置預覽圖像
      setPreviewImage(canvas.toDataURL());
      
      // 如果處於邊緣檢測模式，立即執行邊緣檢測
      if (mode === 'edge') {
        detectEdges();
      }
    };
    img.src = image;
  }, [image, mode]);
  
  // 自動分割
  const performAutoSegmentation = async () => {
    if (!image || isProcessing) return;
    
    setIsProcessing(true);
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 創建 FormData 對象
      const formData = new FormData();
      
      // 將 base64 圖像轉換為 Blob
      const response = await fetch(image);
      const blob = await response.blob();
      formData.append('image', blob);
      formData.append('threshold', threshold);
      
      // 發送到後端 API
      const apiResponse = await axios.post('/api/segment-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result = apiResponse.data;
      
      if (result.success) {
        // 使用返回的分割圖像
        setSegmentedImage(result.segmented_image_url);
        setPreviewImage(result.segmented_image_url);
        
        // 如果有回調函數，則調用它
        if (onSegmentationComplete) {
          onSegmentationComplete(result.segmented_image_url);
        }
      } else {
        throw new Error(result.message || '分割失敗');
      }
    } catch (error) {
      console.error('分割過程中出錯:', error);
      setErrorMessage(`分割過程中出錯: ${error.message || '未知錯誤'}`);
      
      // 如果 API 失敗，使用本地模擬分割
      simulateSegmentation();
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  };
  
  // 使用 API 進行分割
  const performApiSegmentation = async () => {
    if (!image || isProcessing) return;
    
    if (!apiKey.trim()) {
      setErrorMessage('請輸入有效的 Remove.bg API 密鑰');
      return;
    }
    
    setIsProcessing(true);
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 創建 FormData 對象
      const formData = new FormData();
      
      // 將 base64 圖像轉換為 Blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // 將 Blob 轉換為 File 對象，並確保使用 .png 擴展名
      const imageFile = new File([blob], 'image.png', { type: 'image/png' });
      formData.append('image', imageFile);
      
      // 添加 API 密鑰
      formData.append('api_key', apiKey);
      
      // 發送到後端 API
      const apiResponse = await axios.post('/api/segment-image-api', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result = apiResponse.data;
      
      if (result.success) {
        // 使用返回的分割圖像
        setSegmentedImage(result.segmented_image_url);
        setPreviewImage(result.segmented_image_url);
        
        // 如果有回調函數，則調用它
        if (onSegmentationComplete) {
          onSegmentationComplete(result.segmented_image_url);
        }
      } else {
        throw new Error(result.message || 'API 分割失敗');
      }
    } catch (error) {
      console.error('API 分割過程中出錯:', error);
      setErrorMessage(`API 分割過程中出錯: ${error.message || '未知錯誤'}`);
      
      // 如果 API 失敗，使用本地模擬分割
      simulateSegmentation();
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  };
  
  // 模擬分割（僅用於演示或 API 失敗時的備用方案）
  const simulateSegmentation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 這只是一個簡單的模擬，實際應用中您需要實現真正的分割算法
    const segmentedDataURL = canvas.toDataURL();
    setSegmentedImage(segmentedDataURL);
    setPreviewImage(segmentedDataURL);
    
    if (onSegmentationComplete) {
      onSegmentationComplete(segmentedDataURL);
    }
  };
  
  // 邊緣檢測
  const detectEdges = () => {
    const canvas = canvasRef.current;
    const edgeCanvas = edgeCanvasRef.current;
    
    if (!canvas || !edgeCanvas) return;
    
    const ctx = canvas.getContext('2d');
    const edgeCtx = edgeCanvas.getContext('2d');
    
    // 獲取原始圖像數據
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 創建新的圖像數據用於邊緣
    const edgeData = edgeCtx.createImageData(canvas.width, canvas.height);
    const edgeDataArray = edgeData.data;
    
    // 簡單的 Sobel 邊緣檢測算法
    const width = canvas.width;
    const height = canvas.height;
    const threshold = edgeDetectionLevel * 2.55; // 將 0-100 的值轉換為 0-255
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // 計算水平和垂直梯度
        const gx = 
          -1 * data[((y-1) * width + (x-1)) * 4] +
          -2 * data[((y) * width + (x-1)) * 4] +
          -1 * data[((y+1) * width + (x-1)) * 4] +
          1 * data[((y-1) * width + (x+1)) * 4] +
          2 * data[((y) * width + (x+1)) * 4] +
          1 * data[((y+1) * width + (x+1)) * 4];
          
        const gy = 
          -1 * data[((y-1) * width + (x-1)) * 4] +
          -2 * data[((y-1) * width + (x)) * 4] +
          -1 * data[((y-1) * width + (x+1)) * 4] +
          1 * data[((y+1) * width + (x-1)) * 4] +
          2 * data[((y+1) * width + (x)) * 4] +
          1 * data[((y+1) * width + (x+1)) * 4];
          
        // 計算梯度幅度
        const g = Math.sqrt(gx * gx + gy * gy);
        
        // 應用閾值
        const value = g > threshold ? 255 : 0;
        
        // 設置邊緣圖像數據
        edgeDataArray[idx] = value;
        edgeDataArray[idx + 1] = value;
        edgeDataArray[idx + 2] = value;
        edgeDataArray[idx + 3] = value > 0 ? 255 : 0;
      }
    }
    
    // 應用平滑處理
    if (smoothingLevel > 0) {
      for (let i = 0; i < smoothingLevel; i++) {
        smoothEdges(edgeDataArray, width, height);
      }
    }
    
    // 將邊緣數據繪製到畫布上
    edgeCtx.putImageData(edgeData, 0, 0);
    
    // 更新預覽
    updatePreview();
  };
  
  // 平滑邊緣
  const smoothEdges = (data, width, height) => {
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // 計算 3x3 鄰域的平均值
        let sum = 0;
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
            sum += tempData[neighborIdx];
            count++;
          }
        }
        
        // 設置平滑後的值
        const avg = sum / count;
        data[idx] = avg;
        data[idx + 1] = avg;
        data[idx + 2] = avg;
        data[idx + 3] = avg > 0 ? 255 : 0;
      }
    }
  };
  
  // 手動繪製遮罩
  const startDrawing = (e) => {
    if (mode !== 'manual') return;
    
    isDrawing.current = true;
    
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // 計算滑鼠位置
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    lastPos.current = { x, y };
  };
  
  const draw = (e) => {
    if (!isDrawing.current || mode !== 'manual') return;
    
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // 計算滑鼠位置
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // 設置繪圖樣式
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    
    // 根據工具類型設置顏色
    if (toolType === 'brush') {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    } else if (toolType === 'eraser') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0)';
      ctx.globalCompositeOperation = 'destination-out';
    }
    
    // 繪製線條
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // 重置合成操作
    ctx.globalCompositeOperation = 'source-over';
    
    lastPos.current = { x, y };
    
    // 更新預覽
    updatePreview();
  };
  
  const stopDrawing = () => {
    if (isDrawing.current && mode === 'manual') {
      isDrawing.current = false;
      
      // 保存當前狀態到歷史記錄
      saveToHistory();
    }
  };
  
  // 更新預覽圖像
  const updatePreview = () => {
    const originalCanvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const edgeCanvas = edgeCanvasRef.current;
    
    if (!originalCanvas) return;
    
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = originalCanvas.width;
    previewCanvas.height = originalCanvas.height;
    
    const ctx = previewCanvas.getContext('2d');
    
    // 繪製原始圖像
    ctx.drawImage(originalCanvas, 0, 0);
    
    // 根據模式疊加不同的畫布
    if (mode === 'manual' && maskCanvas) {
      // 疊加手動繪製的遮罩
      ctx.drawImage(maskCanvas, 0, 0);
    } else if (mode === 'edge' && edgeCanvas) {
      // 疊加邊緣檢測結果
      ctx.globalCompositeOperation = 'lighten';
      ctx.drawImage(edgeCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    
    // 更新預覽
    setPreviewImage(previewCanvas.toDataURL());
  };
  
  // 保存到歷史記錄
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 刪除當前索引之後的所有歷史記錄
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // 撤銷
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.putImageData(history[newIndex], 0, 0);
      updatePreview();
    }
  };
  
  // 重做
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.putImageData(history[newIndex], 0, 0);
      updatePreview();
    }
  };
  
  // 清除遮罩
  const clearMask = () => {
    if (mode === 'manual') {
      const maskCanvas = maskCanvasRef.current;
      const ctx = maskCanvas.getContext('2d');
      
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    } else if (mode === 'edge') {
      const edgeCanvas = edgeCanvasRef.current;
      const ctx = edgeCanvas.getContext('2d');
      
      ctx.clearRect(0, 0, edgeCanvas.width, edgeCanvas.height);
    }
    
    updatePreview();
    saveToHistory();
  };
  
  // 應用分割
  const applySegmentation = () => {
    if (mode === 'auto') {
      performAutoSegmentation();
    } else if (mode === 'edge') {
      // 使用邊緣檢測結果進行分割
      const originalCanvas = canvasRef.current;
      const edgeCanvas = edgeCanvasRef.current;
      
      if (!originalCanvas || !edgeCanvas) return;
      
      // 創建結果畫布
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = originalCanvas.width;
      resultCanvas.height = originalCanvas.height;
      
      const ctx = resultCanvas.getContext('2d');
      
      // 繪製原始圖像
      ctx.drawImage(originalCanvas, 0, 0);
      
      // 獲取邊緣數據
      const edgeCtx = edgeCanvas.getContext('2d');
      const edgeData = edgeCtx.getImageData(0, 0, edgeCanvas.width, edgeCanvas.height);
      
      // 獲取原始圖像數據
      const originalCtx = originalCanvas.getContext('2d');
      const originalData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
      
      // 創建結果圖像數據
      const resultData = ctx.createImageData(originalCanvas.width, originalCanvas.height);
      
      // 應用邊緣作為蒙版
      for (let i = 0; i < edgeData.data.length; i += 4) {
        // 如果邊緣像素有值（白色）
        if (edgeData.data[i] > 0) {
          // 保留原始圖像像素
          resultData.data[i] = originalData.data[i];
          resultData.data[i + 1] = originalData.data[i + 1];
          resultData.data[i + 2] = originalData.data[i + 2];
          resultData.data[i + 3] = originalData.data[i + 3];
        } else {
          // 設置為透明
          resultData.data[i + 3] = 0;
        }
      }
      
      // 繪製結果
      ctx.putImageData(resultData, 0, 0);
      
      // 更新分割圖像
      const segmentedDataURL = resultCanvas.toDataURL();
      setSegmentedImage(segmentedDataURL);
      setPreviewImage(segmentedDataURL);
      
      if (onSegmentationComplete) {
        onSegmentationComplete(segmentedDataURL);
      }
    } else if (mode === 'api') {
      performApiSegmentation();
    } else {
      // 在手動模式下，使用遮罩進行分割
      const originalCanvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      
      if (!originalCanvas || !maskCanvas) return;
      
      // 創建結果畫布
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = originalCanvas.width;
      resultCanvas.height = originalCanvas.height;
      
      const ctx = resultCanvas.getContext('2d');
      
      // 繪製原始圖像
      ctx.drawImage(originalCanvas, 0, 0);
      
      // 獲取遮罩數據
      const maskCtx = maskCanvas.getContext('2d');
      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      
      // 獲取原始圖像數據
      const originalCtx = originalCanvas.getContext('2d');
      const originalData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
      
      // 創建結果圖像數據
      const resultData = ctx.createImageData(originalCanvas.width, originalCanvas.height);
      
      // 應用遮罩
      for (let i = 0; i < maskData.data.length; i += 4) {
        // 如果遮罩像素有顏色（不透明）
        if (maskData.data[i + 3] > 0) {
          // 保留原始圖像像素
          resultData.data[i] = originalData.data[i];
          resultData.data[i + 1] = originalData.data[i + 1];
          resultData.data[i + 2] = originalData.data[i + 2];
          resultData.data[i + 3] = originalData.data[i + 3];
        } else {
          // 設置為透明
          resultData.data[i + 3] = 0;
        }
      }
      
      // 繪製結果
      ctx.putImageData(resultData, 0, 0);
      
      // 更新分割圖像
      const segmentedDataURL = resultCanvas.toDataURL();
      setSegmentedImage(segmentedDataURL);
      setPreviewImage(segmentedDataURL);
      
      if (onSegmentationComplete) {
        onSegmentationComplete(segmentedDataURL);
      }
    }
  };
  
  // 下載分割後的圖像
  const downloadSegmentedImage = () => {
    if (!segmentedImage) return;
    
    const link = document.createElement('a');
    link.href = segmentedImage;
    link.download = `segmented_image_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 當模式變更時，更新預覽
  useEffect(() => {
    if (mode === 'edge' && image) {
      detectEdges();
    } else {
      updatePreview();
    }
  }, [mode, edgeDetectionLevel, smoothingLevel]);
  
  return (
    <div className="segmentation-container">
      <div className="segmentation-header">
        <h3 className="segmentation-title">商品圖像分割</h3>
      </div>
      
      <div className="segmentation-mode-selector">
        <div 
          className={`segmentation-mode-button ${mode === 'auto' ? 'active' : ''}`}
          onClick={() => setMode('auto')}
        >
          <FaMagic /> 自動分割
        </div>
        <div 
          className={`segmentation-mode-button ${mode === 'edge' ? 'active' : ''}`}
          onClick={() => setMode('edge')}
        >
          <FaAdjust /> 邊緣檢測
        </div>
        <div 
          className={`segmentation-mode-button ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
        >
          <FaPencilAlt /> 手動分割
        </div>
        <div 
          className={`segmentation-mode-button ${mode === 'api' ? 'active' : ''}`}
          onClick={() => setMode('api')}
        >
          <FaCloud /> API 分割
        </div>
      </div>
      
      {mode === 'auto' && (
        <div className="segmentation-controls">
          <div className="segmentation-row">
            <span className="segmentation-label">閾值</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={threshold} 
              onChange={(e) => setThreshold(parseInt(e.target.value))} 
              className="segmentation-slider" 
            />
            <span className="segmentation-value">{threshold}</span>
          </div>
        </div>
      )}
      
      {mode === 'api' && (
        <div className="segmentation-controls">
          <div className="api-description">
            <p>使用 Remove.bg API 進行專業級別的圖像分割。此模式將自動識別商品並去除背景，效果最佳。</p>
            <p className="api-note">注意：此功能需要有效的 API 密鑰。如果 API 調用失敗，系統將自動回退到本地分割方法。</p>
          </div>
          <div className="segmentation-row">
            <div className="segmentation-label">API 密鑰</div>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="輸入您的 Remove.bg API 密鑰"
              className="api-key-input"
            />
          </div>
          <div className="api-key-info">
            <p>您可以在 <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer">Remove.bg</a> 網站上註冊並獲取免費的 API 密鑰。</p>
          </div>
        </div>
      )}
      
      {mode === 'edge' && (
        <div className="segmentation-controls">
          <div className="segmentation-row">
            <span className="segmentation-label">邊緣敏感度</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={edgeDetectionLevel} 
              onChange={(e) => setEdgeDetectionLevel(parseInt(e.target.value))} 
              className="segmentation-slider" 
            />
            <span className="segmentation-value">{edgeDetectionLevel}</span>
          </div>
          
          <div className="segmentation-row">
            <span className="segmentation-label">平滑度</span>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={smoothingLevel} 
              onChange={(e) => setSmoothingLevel(parseInt(e.target.value))} 
              className="segmentation-slider" 
            />
            <span className="segmentation-value">{smoothingLevel}</span>
          </div>
        </div>
      )}
      
      {mode === 'manual' && (
        <div className="segmentation-controls">
          <div className="segmentation-tool-options">
            <div className="segmentation-tool-option">
              <input 
                type="radio" 
                id="brush" 
                name="tool" 
                checked={toolType === 'brush'} 
                onChange={() => setToolType('brush')} 
              />
              <label htmlFor="brush">畫筆</label>
            </div>
            <div className="segmentation-tool-option">
              <input 
                type="radio" 
                id="eraser" 
                name="tool" 
                checked={toolType === 'eraser'} 
                onChange={() => setToolType('eraser')} 
              />
              <label htmlFor="eraser">橡皮擦</label>
            </div>
          </div>
          
          <div className="brush-size-control">
            <span className="segmentation-label">畫筆大小</span>
            <input 
              type="range" 
              min="1" 
              max="50" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))} 
              className="brush-size-slider" 
            />
            <span className="segmentation-value">{brushSize}px</span>
          </div>
          
          <div className="segmentation-button-group">
            <button className="segmentation-button" onClick={undo} disabled={historyIndex <= 0}>
              <FaUndo /> 撤銷
            </button>
            <button className="segmentation-button" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <FaRedo /> 重做
            </button>
            <button className="segmentation-button" onClick={clearMask}>
              <FaEraser /> 清除
            </button>
          </div>
        </div>
      )}
      
      <div className="segmentation-preview">
        {isLoading ? (
          <div className="loading-indicator">處理中...</div>
        ) : previewImage ? (
          <img src={previewImage} alt="預覽" />
        ) : (
          <p>請上傳圖像以開始分割</p>
        )}
        
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
      </div>
      
      <div className="segmentation-button-group">
        <button 
          className="segmentation-button primary-button" 
          onClick={applySegmentation}
          disabled={isProcessing || !image}
        >
          {isProcessing ? '處理中...' : <><FaCheck /> 應用分割</>}
        </button>
        
        {segmentedImage && (
          <button 
            className="segmentation-button" 
            onClick={downloadSegmentedImage}
          >
            <FaDownload /> 下載
          </button>
        )}
      </div>
      
      {/* 隱藏的畫布 */}
      <div style={{ display: 'none' }}>
        <canvas ref={canvasRef}></canvas>
        <canvas 
          ref={maskCanvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
        ></canvas>
        <canvas ref={edgeCanvasRef}></canvas>
      </div>
    </div>
  );
};

export default ImageSegmentation;
