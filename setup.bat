@echo off
echo 開始設置 Casper 圖像處理應用...

REM 創建必要的目錄
echo 創建必要的目錄...
mkdir static\uploads 2>nul
mkdir static\design_output 2>nul
mkdir react-frontend\src\services 2>nul
mkdir react-frontend\src\components\ImageEditor 2>nul
mkdir react-frontend\src\pages 2>nul

REM 檢查關鍵文件是否存在
echo 檢查關鍵文件...

REM 檢查後端文件
if not exist app.py (
  echo 錯誤: app.py 不存在
  exit /b 1
)

REM 檢查前端關鍵文件
set MISSING_FILES=0

if not exist react-frontend\src\services\imageProcessingService.js (
  echo 警告: react-frontend\src\services\imageProcessingService.js 不存在
  set /a MISSING_FILES+=1
)

if not exist react-frontend\src\components\ImageEditor\Cropper.js (
  echo 警告: react-frontend\src\components\ImageEditor\Cropper.js 不存在
  set /a MISSING_FILES+=1
)

if not exist react-frontend\src\components\ImageEditor\DrawingTool.js (
  echo 警告: react-frontend\src\components\ImageEditor\DrawingTool.js 不存在
  set /a MISSING_FILES+=1
)

if not exist react-frontend\src\components\ImageEditor\BackgroundRemover.js (
  echo 警告: react-frontend\src\components\ImageEditor\BackgroundRemover.js 不存在
  set /a MISSING_FILES+=1
)

if not exist react-frontend\src\components\ImageEditor\ImageSegmentation.js (
  echo 警告: react-frontend\src\components\ImageEditor\ImageSegmentation.js 不存在
  set /a MISSING_FILES+=1
)

if not exist react-frontend\src\pages\ImageEditorPage.js (
  echo 警告: react-frontend\src\pages\ImageEditorPage.js 不存在
  set /a MISSING_FILES+=1
)

if %MISSING_FILES% GTR 0 (
  echo 發現 %MISSING_FILES% 個缺失的文件。請確保 GitHub 倉庫包含所有必要的文件。
) else (
  echo 所有關鍵文件都存在！
)

REM 安裝依賴
echo 安裝 Python 依賴...
pip install flask flask-cors pillow opencv-python python-dotenv requests

echo 安裝 Node.js 依賴...
cd react-frontend && npm install

echo 設置完成！
echo 運行後端: python app.py
echo 運行前端: cd react-frontend ^&^& npm start
