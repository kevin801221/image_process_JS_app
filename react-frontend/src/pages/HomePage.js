import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import DesignToolPanel from '../components/DesignTool/DesignToolPanel';
import ImagePreview from '../components/DesignTool/ImagePreview';
import UploadPanel from '../components/Common/UploadPanel';
import { FaImages } from 'react-icons/fa';

const HomePage = () => {
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [designOutput, setDesignOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setDesignOutput(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setDesignOutput(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleGenerateDesign = async (designParams) => {
    if (!uploadedImage) return;

    try {
      setLoading(true);
      setError(null);

      // Create form data
      const formData = new FormData();
      // Convert base64 to blob
      const base64Response = await fetch(uploadedImage);
      const blob = await base64Response.blob();
      formData.append('file', blob, 'image.jpg');
      
      // Add design parameters
      Object.keys(designParams).forEach(key => {
        formData.append(key, designParams[key]);
      });

      // Send request to backend
      const response = await axios.post('/api/design', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setDesignOutput(response.data.designUrl);
      } else {
        setError(response.data.message || 'Failed to generate design');
      }
    } catch (err) {
      setError('Error generating design. Please try again.');
      console.error('Error generating design:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setDesignOutput(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBatchUpload = () => {
    navigate('/batch-upload');
  };

  return (
    <div className="home-page">
      <div className="page-header">
        <h1 className="page-title">AI 商品圖設計室</h1>
        <button className="batch-upload-button" onClick={handleBatchUpload}>
          <FaImages /> 批量上傳
        </button>
      </div>
      
      <div className="design-container">
        <div className="upload-preview-container">
          {!uploadedImage ? (
            <UploadPanel 
              onUploadClick={handleUploadClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              acceptedTypes="image/*"
            />
          ) : (
            <ImagePreview 
              image={designOutput || uploadedImage} 
              onClear={handleClearImage}
              isLoading={loading}
            />
          )}
        </div>
        
        <DesignToolPanel 
          onGenerate={handleGenerateDesign}
          disabled={!uploadedImage || loading}
          isLoading={loading}
        />
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default HomePage;
