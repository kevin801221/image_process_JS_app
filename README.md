# Casper 圖像處理應用程序

這是一個結合 Flask 後端和 React 前端的圖像處理應用程序，提供多種圖像處理功能，包括商品圖設計、知識庫管理、產品文案生成和圖片理解等。

## 項目結構

```
Casper_imageProcessing_APP/
├── app.py                # Flask 後端主應用程序
├── image_env/            # Python 虛擬環境
├── react-frontend/       # React 前端應用
│   ├── public/           # 靜態公共文件
│   ├── src/              # React 源代碼
│   └── package.json      # 前端依賴配置
├── static/               # 靜態資源
└── templates/            # Flask 模板
```

## 快速開始

請參閱 [前端安裝指南](./react-frontend/README.md) 獲取詳細的安裝和運行說明。

### 基本步驟

1. 克隆倉庫
2. 設置 Python 虛擬環境並安裝後端依賴
3. 安裝前端 Node.js 依賴
4. 啟動後端 Flask 服務器
5. 啟動前端 React 開發服務器

## 功能特點

- **商品圖設計**: 上傳圖片並應用設計參數生成商品圖
- **批量處理**: 一次處理多張圖片
- **知識庫管理**: 上傳和管理知識庫文件，並進行查詢
- **產品文案生成**: 基於輸入生成產品描述文案
- **圖片理解**: 分析上傳的圖片並生成描述
- **設置管理**: 管理應用程序設置和 API 密鑰

## 技術棧

### 後端
- Flask (Python)
- OpenCV
- NumPy
- Pillow

### 前端
- React
- React Router
- Axios
- Styled Components
- React Icons

## 專案設置

### 前置需求

- Python 3.7+
- Node.js 14+
- npm 或 yarn

### 安裝步驟

1. 克隆專案
```bash
git clone https://github.com/yourusername/Casper_imageProcessing_APP.git
cd Casper_imageProcessing_APP
```

2. 設置後端
```bash
# 安裝 Python 依賴
pip install flask flask-cors pillow opencv-python python-dotenv requests

# 創建必要的目錄
mkdir -p static/uploads static/design_output
```

3. 設置前端
```bash
cd react-frontend
npm install
```

4. 運行應用
```bash
# 在一個終端中運行後端
python app.py

# 在另一個終端中運行前端
cd react-frontend
npm start
```

## 常見問題解決方案

### 路徑問題

如果您在克隆專案後遇到以下錯誤：

```
ERROR in ./src/components/ImageEditor/BackgroundRemover.js
Module not found: Error: Can't resolve '../../services/imageProcessingService'

ERROR in ./src/pages/ImageEditorPage.js
Module not found: Error: Can't resolve '../components/ImageEditor/Cropper'

ERROR in ./src/pages/ImageEditorPage.js
Module not found: Error: Can't resolve '../components/ImageEditor/DrawingTool'
```

請確保以下目錄和文件存在：

1. `react-frontend/src/services/imageProcessingService.js`
2. `react-frontend/src/components/ImageEditor/Cropper.js`
3. `react-frontend/src/components/ImageEditor/DrawingTool.js`

您可以運行提供的檢查腳本來驗證專案結構：

```bash
node setup_check.js
```

### 缺少文件

如果缺少某些文件，請運行以下命令來創建必要的目錄結構：

```bash
mkdir -p react-frontend/src/services
mkdir -p react-frontend/src/components/ImageEditor
mkdir -p react-frontend/src/pages
```

然後確保所有必要的組件文件都存在於正確的位置。

### API 密鑰設置

如果您想使用 Remove.bg API 進行專業級圖像分割，請在 `.env` 文件中設置您的 API 密鑰：

```
REMOVE_BG_API_KEY=your_api_key_here
```

或者在前端界面中直接輸入您的 API 密鑰。

## 部署說明

當您準備將更改推送到 GitHub 時，請使用以下命令：

```bash
git add .
git commit -m "您的提交訊息"
git push -f react-web react-rebuild-performance:main
```

這將把您的更改從 Casper_imageProcessing_APP 倉庫的 react-rebuild-performance 分支強制推送到 React_imageProcessing_Web 倉庫的 main 分支。

## 許可

[MIT](https://choosealicense.com/licenses/mit/)

## 聯絡方式

如有任何問題，請聯絡專案維護者。
