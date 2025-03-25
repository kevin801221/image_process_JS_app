import React, { useState, useEffect, useRef } from 'react';
import './ImageRotator.css';

const ImageRotator = ({ originalImage, onProcessedImage }) => {
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  
  // 初始化畫布
  useEffect(() => {
    if (!originalImage) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 添加跨域支持
    img.src = originalImage;
    imageRef.current = img;
    
    img.onload = () => {
      applyTransformations();
    };
  }, [originalImage]);
  
  // 應用變換
  const applyTransformations = (shouldUpdateParent = false) => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    // 根據旋轉角度調整畫布大小
    if (rotation % 180 === 0) {
      canvas.width = img.width;
      canvas.height = img.height;
    } else {
      canvas.width = img.height;
      canvas.height = img.width;
    }
    
    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 移動到畫布中心
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // 旋轉
    ctx.rotate((rotation * Math.PI) / 180);
    
    // 翻轉
    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
    
    // 繪製圖片
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    
    // 恢復畫布狀態
    ctx.restore();
    
    // 將處理後的圖片傳回父組件，但只有在明確要求時才執行
    if (shouldUpdateParent && onProcessedImage) {
      onProcessedImage(canvas.toDataURL('image/png'));
    }
  };
  
  // 處理旋轉
  const handleRotate = (degrees) => {
    const newRotation = (rotation + degrees) % 360;
    setRotation(newRotation);
  };
  
  // 處理翻轉
  const handleFlip = (direction) => {
    if (direction === 'horizontal') {
      setFlipHorizontal(!flipHorizontal);
    } else if (direction === 'vertical') {
      setFlipVertical(!flipVertical);
    }
  };
  
  // 當變換參數改變時應用變換，但不更新父組件
  useEffect(() => {
    if (imageRef.current) {
      applyTransformations(false); // 只在本地應用變換，不更新父組件
    }
  }, [rotation, flipHorizontal, flipVertical]);

  // 應用變換並更新父組件
  const applyChanges = () => {
    applyTransformations(true); // 應用變換並更新父組件
  };
  
  return (
    <div className="image-rotator">
      <div className="rotation-controls">
        <div className="rotation-buttons">
          <button className="action-button" onClick={() => handleRotate(-90)}>
            向左旋轉 90°
          </button>
          <button className="action-button" onClick={() => handleRotate(90)}>
            向右旋轉 90°
          </button>
          <button className="action-button" onClick={() => handleFlip('horizontal')}>
            水平翻轉
          </button>
          <button className="action-button" onClick={() => handleFlip('vertical')}>
            垂直翻轉
          </button>
        </div>
        
        <div className="rotation-slider">
          <label>精確旋轉: {rotation}°</label>
          <input 
            type="range" 
            min="0" 
            max="359" 
            value={rotation} 
            onChange={(e) => setRotation(parseInt(e.target.value))} 
          />
        </div>

        <button className="apply-button" onClick={applyChanges}>
          應用變換
        </button>
      </div>
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="rotator-canvas"
        />
      </div>
    </div>
  );
};

export default ImageRotator;
