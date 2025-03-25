const fs = require('fs');
const path = require('path');

// 檢查目錄是否存在，如果不存在則創建
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`創建目錄: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

// 檢查文件是否存在
function checkFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`警告: 文件不存在 ${filePath}`);
    return false;
  }
  return true;
}

// 主要檢查函數
function runSetupCheck() {
  console.log('開始檢查專案結構...');
  
  // 檢查後端目錄和文件
  ensureDirectoryExists('./static');
  ensureDirectoryExists('./static/uploads');
  ensureDirectoryExists('./static/design_output');
  
  // 檢查前端目錄和文件
  const frontendSrcPath = './react-frontend/src';
  ensureDirectoryExists(`${frontendSrcPath}/components/ImageEditor`);
  ensureDirectoryExists(`${frontendSrcPath}/pages`);
  ensureDirectoryExists(`${frontendSrcPath}/services`);
  
  // 檢查關鍵文件
  const criticalFiles = [
    './app.py',
    `${frontendSrcPath}/services/imageProcessingService.js`,
    `${frontendSrcPath}/components/ImageEditor/Cropper.js`,
    `${frontendSrcPath}/components/ImageEditor/DrawingTool.js`,
    `${frontendSrcPath}/components/ImageEditor/BackgroundRemover.js`,
    `${frontendSrcPath}/components/ImageEditor/ImageSegmentation.js`,
    `${frontendSrcPath}/pages/ImageEditorPage.js`
  ];
  
  let allFilesExist = true;
  criticalFiles.forEach(file => {
    if (!checkFileExists(file)) {
      allFilesExist = false;
    }
  });
  
  if (allFilesExist) {
    console.log('所有關鍵文件都存在！');
  } else {
    console.log('警告: 某些關鍵文件缺失，可能會導致應用程序無法正常運行。');
  }
  
  console.log('檢查完成！');
}

// 運行檢查
runSetupCheck();
