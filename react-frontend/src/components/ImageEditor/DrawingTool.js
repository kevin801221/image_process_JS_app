import React, { useState, useEffect, useRef } from 'react';
import './DrawingTool.css';

const DrawingTool = ({ originalImage, onProcessedImage }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState([]);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  
  // 初始化畫布
  useEffect(() => {
    if (!originalImage) return;
    
    const img = new Image();
    img.src = originalImage;
    imageRef.current = img;
    
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // 設置畫布大小與圖片一致
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 清空畫布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 繪製原始圖片
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 繪製已保存的線條
      drawSavedLines();
    };
  }, [originalImage]);
  
  // 繪製已保存的線條
  const drawSavedLines = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    
    // 繪製原始圖片
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    // 繪製所有已保存的線條
    lines.forEach(line => {
      if (line.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  };
  
  // 開始繪製
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setIsDrawing(true);
    setCurrentLine([{ x, y }]);
  };
  
  // 繪製中
  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setCurrentLine(prev => [...prev, { x, y }]);
    
    // 繪製當前線條
    ctx.beginPath();
    ctx.moveTo(currentLine[currentLine.length - 1].x, currentLine[currentLine.length - 1].y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  
  // 結束繪製
  const endDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    // 保存當前線條
    if (currentLine.length > 1) {
      setLines(prev => [...prev, {
        points: currentLine,
        color: brushColor,
        size: brushSize
      }]);
      
      // 將處理後的圖片傳回父組件
      if (canvasRef.current && onProcessedImage) {
        onProcessedImage(canvasRef.current.toDataURL('image/png'));
      }
    }
    
    setCurrentLine([]);
  };
  
  // 清除所有繪製
  const clearCanvas = () => {
    setLines([]);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製原始圖片
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      
      // 將原始圖片傳回父組件
      if (onProcessedImage) {
        onProcessedImage(originalImage);
      }
    }
  };
  
  // 撤銷上一步
  const undoLastLine = () => {
    if (lines.length === 0) return;
    
    const newLines = [...lines];
    newLines.pop();
    setLines(newLines);
    
    // 重新繪製
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 設置臨時線條數組並繪製
    const tempLines = [...newLines];
    
    // 繪製原始圖片
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    }
    
    // 繪製所有線條
    tempLines.forEach(line => {
      if (line.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
    
    // 將處理後的圖片傳回父組件
    if (canvas && onProcessedImage) {
      onProcessedImage(canvas.toDataURL('image/png'));
    }
  };
  
  return (
    <div className="drawing-tool">
      <div className="drawing-controls">
        <div className="brush-settings">
          <div className="brush-color">
            <label>筆刷顏色</label>
            <input 
              type="color" 
              value={brushColor} 
              onChange={(e) => setBrushColor(e.target.value)} 
            />
          </div>
          <div className="brush-size">
            <label>筆刷大小: {brushSize}px</label>
            <input 
              type="range" 
              min="1" 
              max="50" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))} 
            />
          </div>
        </div>
        <div className="drawing-actions">
          <button className="action-button" onClick={undoLastLine}>撤銷</button>
          <button className="action-button" onClick={clearCanvas}>清除</button>
        </div>
      </div>
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
        />
      </div>
    </div>
  );
};

export default DrawingTool;
