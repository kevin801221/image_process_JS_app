import axios from 'axios';

// Ollama API 基礎設置 - 直接連接到 Ollama 服務
const ollamaApi = axios.create({
  baseURL: 'http://localhost:11434/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 設置較長的超時時間，因為圖片分析可能需要一些時間
});

// 將圖片轉換為 base64 字符串
const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // 移除 data:image/jpeg;base64, 前綴
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Ollama 圖片理解服務
const ollamaImageService = {
  // 使用 Gemma3 模型分析圖片
  analyzeImage: async (file) => {
    try {
      console.log('正在使用 Gemma3 分析圖片...');
      
      // 將圖片轉換為 base64
      const base64Image = await imageToBase64(file);
      
      // 構建提示詞
      const prompt = `
請分析這張圖片，並提供以下信息：
1. 圖片中包含的主要物體或人物
2. 圖片的場景描述
3. 圖片中可能的顏色主題
4. 圖片的整體風格或氛圍

請用中文回答，並盡可能詳細地描述圖片內容。
`;

      // 使用 llava 模型進行圖片分析（這是一個多模態模型，可以處理圖片）
      const response = await ollamaApi.post('/generate', {
        model: 'llava:13b',  // 使用 llava 模型進行圖片分析
        prompt: prompt,
        images: [base64Image],
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40
        }
      });

      console.log('Llava 回應:', response.data);
      
      // 解析回應
      const analysis = response.data.response.trim();
      
      // 生成簡短的圖片描述作為副本
      const copy = analysis.split('\n').slice(0, 2).join('\n');
      
      return {
        success: true,
        analysis: analysis,
        copy: copy
      };
    } catch (error) {
      console.error('Ollama API error:', error);
      
      // 如果連接失敗，返回錯誤信息
      return {
        success: false,
        message: `連接 Ollama API 時出錯: ${error.message}`,
      };
    }
  }
};

export default ollamaImageService;
