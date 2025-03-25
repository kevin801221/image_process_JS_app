import axios from 'axios';

// Ollama API 基礎設置 - 直接連接到 Ollama 服務
const ollamaApi = axios.create({
  baseURL: 'http://localhost:11434/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 設置較長的超時時間，因為生成可能需要一些時間
});

// Ollama 服務
const ollamaService = {
  // 使用 Gemma3 模型生成文案
  generateProductCopy: async (productInfo) => {
    try {
      console.log('正在使用 Gemma3 生成文案...');
      
      const prompt = `
請為以下產品生成一段吸引人的商品描述文案：

產品名稱: ${productInfo.productName}
產品類型: ${productInfo.productType}
產品特點: ${productInfo.productFeatures || ''}

要求：
1. 文案應該突出產品的主要特點和優勢
2. 語言風格應該專業且有說服力
3. 適合在電商平台使用
4. 文案長度在100-200字之間
`;

      const response = await ollamaApi.post('/generate', {
        model: 'gemma3:12b',  // 使用完整的模型名稱
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40
        }
      });

      console.log('Gemma3 回應:', response.data);
      
      return {
        success: true,
        copy: response.data.response.trim()
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

export default ollamaService;
