import axios from 'axios';

// 創建用於圖像處理的 axios 實例
const imageProcessingApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 設置較長的超時時間，因為圖像處理可能需要時間
});

// 圖像處理服務
const imageProcessingService = {
  // 剪裁圖像
  cropImage: async (imageFile, cropData) => {
    try {
      console.log('正在剪裁圖像...');
      
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('x', cropData.x);
      formData.append('y', cropData.y);
      formData.append('width', cropData.width);
      formData.append('height', cropData.height);
      
      const response = await imageProcessingApi.post('/image/crop', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('剪裁完成:', response.data);
      
      return {
        success: true,
        processedImage: response.data.processedImage,
      };
    } catch (error) {
      console.error('剪裁圖像時出錯:', error);
      
      // 如果後端服務不可用，在前端執行簡單的剪裁
      try {
        console.log('嘗試在前端執行剪裁...');
        const processedImage = await clientSideCrop(imageFile, cropData);
        
        return {
          success: true,
          processedImage: processedImage,
        };
      } catch (clientError) {
        console.error('前端剪裁失敗:', clientError);
        return {
          success: false,
          message: `剪裁圖像時出錯: ${error.message}`,
        };
      }
    }
  },
  
  // 智慧剪裁圖像
  smartCrop: async (imageFile, targetAspectRatio) => {
    try {
      console.log('正在進行智慧剪裁...');
      
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('aspectRatio', targetAspectRatio);
      
      const response = await imageProcessingApi.post('/image/smart-crop', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('智慧剪裁完成:', response.data);
      
      return {
        success: true,
        processedImage: response.data.processedImage,
      };
    } catch (error) {
      console.error('智慧剪裁時出錯:', error);
      
      // 如果後端服務不可用，執行簡單的中心剪裁
      try {
        console.log('嘗試在前端執行中心剪裁...');
        const processedImage = await clientSideCenterCrop(imageFile, targetAspectRatio);
        
        return {
          success: true,
          processedImage: processedImage,
        };
      } catch (clientError) {
        console.error('前端中心剪裁失敗:', clientError);
        return {
          success: false,
          message: `智慧剪裁時出錯: ${error.message}`,
        };
      }
    }
  },
  
  // 移除背景
  removeBackground: async (imageFile, options = {}) => {
    try {
      console.log('正在移除背景...');
      
      const formData = new FormData();
      formData.append('file', imageFile);
      
      // 添加可選參數
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const result = await imageProcessingApi.post('/image/remove-background', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('背景移除完成:', result.data);
      
      return {
        success: true,
        processedImage: result.data.processedImage,
      };
    } catch (error) {
      console.error('移除背景時出錯:', error);
      
      // 如果後端服務不可用，嘗試使用簡單的顏色閾值方法
      try {
        console.log('嘗試在前端執行簡單的背景移除...');
        // 使用已定義的 clientSideRemoveBackground 函數
        const processedImage = await clientSideRemoveBackground(imageFile, options);
        
        return {
          success: true,
          processedImage: processedImage,
        };
      } catch (clientError) {
        console.error('前端背景移除失敗:', clientError);
        return {
          success: false,
          message: `移除背景時出錯: ${error.message}`,
        };
      }
    }
  }
};

// 前端剪裁實現
const clientSideCrop = (imageFile, cropData) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 添加跨域支持
      
      img.onload = () => {
        // 創建 canvas 元素
        const canvas = document.createElement('canvas');
        canvas.width = cropData.width;
        canvas.height = cropData.height;
        const ctx = canvas.getContext('2d');
        
        // 繪製剪裁後的圖像
        ctx.drawImage(
          img,
          cropData.x, cropData.y, cropData.width, cropData.height,
          0, 0, cropData.width, cropData.height
        );
        
        // 轉換為 base64
        const croppedImageData = canvas.toDataURL('image/png');
        resolve(croppedImageData);
      };
      
      img.onerror = (error) => {
        console.error('圖像加載失敗:', error);
        reject(error);
      };
      
      // 如果是 File 對象，轉換為 URL
      if (imageFile instanceof File) {
        img.src = URL.createObjectURL(imageFile);
      } else {
        img.src = imageFile;
      }
    } catch (error) {
      console.error('剪裁過程中出錯:', error);
      reject(error);
    }
  });
};

// 前端中心剪裁實現
const clientSideCenterCrop = (imageFile, targetAspectRatio) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 添加跨域支持
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const imgWidth = img.width;
        const imgHeight = img.height;
        const imgAspectRatio = imgWidth / imgHeight;
        
        let cropWidth, cropHeight, x, y;
        
        if (imgAspectRatio > targetAspectRatio) {
          // 圖片較寬，裁剪寬度
          cropHeight = imgHeight;
          cropWidth = imgHeight * targetAspectRatio;
          x = (imgWidth - cropWidth) / 2;
          y = 0;
        } else {
          // 圖片較高，裁剪高度
          cropWidth = imgWidth;
          cropHeight = imgWidth / targetAspectRatio;
          x = 0;
          y = (imgHeight - cropHeight) / 2;
        }
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        ctx.drawImage(
          img,
          x, y, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );
        
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = (error) => {
        console.error('圖像加載失敗:', error);
        reject(error);
      };
      
      // 如果是 File 對象，轉換為 URL
      if (imageFile instanceof File) {
        img.src = URL.createObjectURL(imageFile);
      } else {
        img.src = imageFile;
      }
    } catch (error) {
      console.error('剪裁過程中出錯:', error);
      reject(error);
    }
  });
};

// 前端背景移除實現 (使用顏色閾值)
const clientSideRemoveBackground = (imageFile, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 添加跨域支持
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 繪製原始圖像
        ctx.drawImage(img, 0, 0);
        
        // 獲取圖像數據
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 檢測背景色 (假設背景是圖像邊緣的顏色)
        const edgePixels = [];
        
        // 獲取邊緣像素
        for (let x = 0; x < canvas.width; x++) {
          edgePixels.push(getPixelColor(data, x, 0, canvas.width));
          edgePixels.push(getPixelColor(data, x, canvas.height - 1, canvas.width));
        }
        
        for (let y = 0; y < canvas.height; y++) {
          edgePixels.push(getPixelColor(data, 0, y, canvas.width));
          edgePixels.push(getPixelColor(data, canvas.width - 1, y, canvas.width));
        }
        
        // 計算背景色的平均值
        const avgBackground = calculateAverageColor(edgePixels);
        
        // 設置閾值 (使用傳入的閾值或默認值)
        const threshold = options.threshold || 30;
        
        // 處理每個像素
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // 如果像素顏色接近背景色，則設為透明
          if (
            Math.abs(r - avgBackground.r) < threshold &&
            Math.abs(g - avgBackground.g) < threshold &&
            Math.abs(b - avgBackground.b) < threshold
          ) {
            data[i + 3] = 0; // 設置 alpha 為 0 (透明)
          }
        }
        
        // 將處理後的圖像繪製回畫布
        ctx.putImageData(imageData, 0, 0);
        
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = (error) => {
        console.error('圖像加載失敗:', error);
        reject(error);
      };
      
      // 如果是 File 對象，轉換為 URL
      if (imageFile instanceof File) {
        img.src = URL.createObjectURL(imageFile);
      } else {
        img.src = imageFile;
      }
    } catch (error) {
      console.error('背景移除過程中出錯:', error);
      reject(error);
    }
  });
};

// 輔助函數：獲取特定位置的像素顏色
const getPixelColor = (data, x, y, width) => {
  const index = (y * width + x) * 4;
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2]
  };
};

// 輔助函數：計算平均顏色
const calculateAverageColor = (colors) => {
  let r = 0, g = 0, b = 0;
  
  colors.forEach(color => {
    r += color.r;
    g += color.g;
    b += color.b;
  });
  
  return {
    r: Math.round(r / colors.length),
    g: Math.round(g / colors.length),
    b: Math.round(b / colors.length)
  };
};

export default imageProcessingService;
