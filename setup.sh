#!/bin/bash

# 顯示彩色輸出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}開始設置 Casper 圖像處理應用...${NC}"

# 創建必要的目錄
echo -e "${YELLOW}創建必要的目錄...${NC}"
mkdir -p static/uploads
mkdir -p static/design_output
mkdir -p react-frontend/src/services
mkdir -p react-frontend/src/components/ImageEditor
mkdir -p react-frontend/src/pages

# 檢查關鍵文件是否存在
echo -e "${YELLOW}檢查關鍵文件...${NC}"

# 檢查後端文件
if [ ! -f "app.py" ]; then
  echo -e "${RED}錯誤: app.py 不存在${NC}"
  exit 1
fi

# 檢查前端關鍵文件
FRONTEND_FILES=(
  "react-frontend/src/services/imageProcessingService.js"
  "react-frontend/src/components/ImageEditor/Cropper.js"
  "react-frontend/src/components/ImageEditor/DrawingTool.js"
  "react-frontend/src/components/ImageEditor/BackgroundRemover.js"
  "react-frontend/src/components/ImageEditor/ImageSegmentation.js"
  "react-frontend/src/pages/ImageEditorPage.js"
)

MISSING_FILES=0
for file in "${FRONTEND_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}警告: $file 不存在${NC}"
    MISSING_FILES=$((MISSING_FILES+1))
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  echo -e "${RED}發現 $MISSING_FILES 個缺失的文件。請確保 GitHub 倉庫包含所有必要的文件。${NC}"
else
  echo -e "${GREEN}所有關鍵文件都存在！${NC}"
fi

# 安裝依賴
echo -e "${YELLOW}安裝 Python 依賴...${NC}"
pip install flask flask-cors pillow opencv-python python-dotenv requests

echo -e "${YELLOW}安裝 Node.js 依賴...${NC}"
cd react-frontend && npm install

echo -e "${GREEN}設置完成！${NC}"
echo -e "${GREEN}運行後端: python app.py${NC}"
echo -e "${GREEN}運行前端: cd react-frontend && npm start${NC}"
