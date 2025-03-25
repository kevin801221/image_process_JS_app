import React, { useEffect, useRef, useCallback } from 'react';
import './ImageCanvas.css';

const ImageCanvas = ({ 
  image, 
  filterParams, 
  selectedFilter, 
  selectedLayout,
  cornerRadius,
  transparency
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Set canvas dimensions to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply filters
    ctx.filter = `
      brightness(${100 + filterParams.brightness}%) 
      contrast(${100 + filterParams.contrast}%) 
      saturate(${100 + filterParams.saturation}%)
      opacity(${100 - transparency}%)
    `;

    // Apply selected filter
    if (selectedFilter === '北歐') {
      ctx.filter += ' sepia(30%) hue-rotate(180deg)';
    } else if (selectedFilter === '懷舊') {
      ctx.filter += ' sepia(70%)';
    }

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Reset filter
    ctx.filter = 'none';
  }, [filterParams, selectedFilter, transparency]);

  useEffect(() => {
    if (!image) return;

    // Load the image
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 添加跨域支持
    img.src = image;
    imageRef.current = img;

    img.onload = () => {
      renderCanvas();
    };
  }, [image, renderCanvas]);

  useEffect(() => {
    if (imageRef.current) {
      renderCanvas();
    }
  }, [filterParams, selectedFilter, selectedLayout, cornerRadius, transparency, renderCanvas]);

  return (
    <canvas 
      ref={canvasRef} 
      className="image-canvas"
      style={{ 
        borderRadius: `${cornerRadius}px`,
      }}
    />
  );
};

export default ImageCanvas;
