const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API 代理
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      onError: (err, req, res) => {
        console.warn('API proxy error:', err);
        
        // 根據請求路徑返回模擬數據
        if (req.path.includes('/auth/user')) {
          res.json({
            success: true,
            user: {
              id: 1,
              username: '測試用戶',
              email: 'test@example.com',
              createdAt: '2025-01-01T00:00:00Z'
            }
          });
        } else if (req.path.includes('/auth/points')) {
          res.json({
            success: true,
            balance: 10.0
          });
        } else if (req.path.includes('/product-copy')) {
          // 添加文案生成的模擬響應
          res.json({
            success: true,
            copy: "這是一款優質的電子產品，採用先進技術製造，具有卓越的性能和耐用性。產品設計精美，操作簡便，是您日常生活和工作的理想選擇。我們提供完善的售後服務，確保您的使用體驗無憂無慮。立即選購，體驗科技帶來的便利與樂趣！"
          });
        } else if (req.path.includes('/image-understanding')) {
          // 添加圖片理解的模擬響應
          res.json({
            success: true,
            analysis: "圖片中顯示了一個色彩豐富的界面，似乎是一個應用程序或網站的截圖。畫面上有多個不同顏色的方塊或卡片，包括粉色、藍色、黃色和紫色等。這些顏色方塊排列在一個深色（可能是黑色）的背景上，形成了一個簡潔的用戶界面。\n\n這可能是一個設計工具、顏色選擇器或者多媒體應用的界面。整體設計風格現代簡約，採用了扁平化設計元素，色彩對比鮮明。",
            copy: "這是一個色彩豐富的用戶界面截圖，包含多個不同顏色的方塊或卡片，排列在深色背景上。"
          });
        } else if (req.path.includes('/settings')) {
          res.json({
            success: true,
            settings: {
              apiKey: 'sk-mock-key',
              model: 'gpt-3.5-turbo',
              temperature: 0.7,
              maxTokens: 2000
            }
          });
        } else {
          res.status(500).json({
            success: false,
            message: '無法連接到 API 服務器'
          });
        }
      }
    })
  );

  // Ollama API 代理
  app.use(
    '/ollama',
    createProxyMiddleware({
      target: 'http://localhost:11434',
      changeOrigin: true,
      pathRewrite: {
        '^/ollama': '/api', // 將 /ollama 重寫為 /api
      },
      onError: (err, req, res) => {
        console.warn('Ollama API proxy error:', err);
        
        // 返回模擬的 Ollama 響應
        if (req.path.includes('/generate')) {
          res.json({
            response: `這是一款優質的電子產品，採用最新科技打造，具備卓越性能和耐用品質。

產品設計簡約時尚，符合現代審美需求，同時操作界面直觀友好，即使是技術小白也能輕鬆上手。

它不僅能滿足您日常使用需求，更能在關鍵時刻提供可靠支持，是提升工作效率的得力助手。

我們提供完善的售後服務和技術支持，讓您購買無憂、使用無慮。

立即選購，體驗科技帶來的便捷生活！`,
            model: "gemma3",
            created_at: new Date().toISOString(),
            done: true,
            total_duration: 1250000000,
            load_duration: 150000000,
            prompt_eval_count: 25,
            prompt_eval_duration: 300000000,
            eval_count: 150,
            eval_duration: 800000000
          });
        } else {
          res.status(500).json({
            error: '無法連接到 Ollama 服務'
          });
        }
      }
    })
  );
};
