from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
import os
import json
import uuid
import base64
import io
from datetime import datetime
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from PIL import Image
from flask_cors import CORS
from dotenv import load_dotenv

# 加載環境變量
load_dotenv()

# 設置 Remove.bg API 密鑰
os.environ['REMOVE_BG_API_KEY'] = os.environ.get('REMOVE_BG_API_KEY', 'Khr1wiotNPuDyqQZxpzNKTsZ')

app = Flask(__name__, static_folder='static')
CORS(app)  # 啟用 CORS 支持

# 確保目錄存在
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
DESIGN_OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'design_output')
ANNOTATIONS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'annotations')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DESIGN_OUTPUT_FOLDER, exist_ok=True)
os.makedirs(ANNOTATIONS_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['DESIGN_OUTPUT_FOLDER'] = DESIGN_OUTPUT_FOLDER
app.config['ANNOTATIONS_FOLDER'] = ANNOTATIONS_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 限制上傳文件大小為 16MB

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """上傳圖片檔案"""
    print("收到上傳請求")
    
    if 'file' not in request.files:
        print("沒有找到文件")
        return jsonify({'success': False, 'message': '沒有找到文件'})
    
    file = request.files['file']
    
    if file.filename == '':
        print("未選擇文件")
        return jsonify({'success': False, 'message': '未選擇文件'})
    
    if file and allowed_file(file.filename):
        # 生成安全的文件名
        filename = secure_filename(file.filename)
        # 添加時間戳和 UUID 以確保唯一性
        unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # 保存文件
        file.save(file_path)
        
        # 返回文件 URL
        file_url = url_for('static', filename=f'uploads/{unique_filename}')
        
        print(f"文件已上傳: {file_url}")
        return jsonify({
            'success': True, 
            'message': '文件上傳成功',
            'file_url': file_url,
            'file_name': unique_filename
        })
    
    print("不允許的文件類型")
    return jsonify({'success': False, 'message': '不允許的文件類型'})

@app.route('/api/batch_process', methods=['POST'])
def batch_process():
    """批量處理多個圖像"""
    if 'files[]' not in request.files:
        return jsonify({'success': False, 'message': '沒有找到文件'})
    
    files = request.files.getlist('files[]')
    
    if not files or files[0].filename == '':
        return jsonify({'success': False, 'message': '未選擇文件'})
    
    # 獲取處理參數
    params = {}
    for key in request.form:
        params[key] = request.form[key]
    
    processed_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            # 處理每個文件
            filename = secure_filename(file.filename)
            unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            
            # 這裡添加圖像處理邏輯
            # 例如：調整大小、應用濾鏡等
            
            # 返回處理後的文件 URL
            file_url = url_for('static', filename=f'uploads/{unique_filename}')
            processed_files.append({
                'original_name': file.filename,
                'file_url': file_url,
                'file_name': unique_filename
            })
    
    if processed_files:
        return jsonify({
            'success': True,
            'message': f'成功處理 {len(processed_files)} 個文件',
            'files': processed_files
        })
    else:
        return jsonify({'success': False, 'message': '沒有文件被處理'})

@app.route('/api/knowledge-files', methods=['GET'])
def get_knowledge_files():
    """獲取知識庫文件列表"""
    knowledge_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'knowledge')
    os.makedirs(knowledge_folder, exist_ok=True)
    
    files = []
    for filename in os.listdir(knowledge_folder):
        file_path = os.path.join(knowledge_folder, filename)
        if os.path.isfile(file_path):
            # 獲取文件大小和創建時間
            file_stats = os.stat(file_path)
            file_size = file_stats.st_size
            file_created = datetime.fromtimestamp(file_stats.st_ctime).strftime('%Y-%m-%d %H:%M:%S')
            
            # 獲取文件類型
            file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            
            files.append({
                'id': filename,
                'name': filename,
                'size': file_size,
                'created': file_created,
                'type': file_ext,
                'url': url_for('static', filename=f'knowledge/{filename}')
            })
    
    return jsonify({'success': True, 'files': files})

@app.route('/api/upload-knowledge-file', methods=['POST'])
def upload_knowledge_file():
    """上傳知識庫檔案"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '沒有找到文件'})
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'message': '未選擇文件'})
    
    # 檢查文件類型（這裡可以根據需要擴展允許的文件類型）
    allowed_extensions = {'txt', 'pdf', 'doc', 'docx', 'csv', 'xls', 'xlsx'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'success': False, 'message': '不允許的文件類型'})
    
    # 確保知識庫目錄存在
    knowledge_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'knowledge')
    os.makedirs(knowledge_folder, exist_ok=True)
    
    # 生成安全的文件名
    filename = secure_filename(file.filename)
    # 添加時間戳以確保唯一性
    unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
    file_path = os.path.join(knowledge_folder, unique_filename)
    
    # 保存文件
    file.save(file_path)
    
    # 獲取文件大小和創建時間
    file_stats = os.stat(file_path)
    file_size = file_stats.st_size
    file_created = datetime.fromtimestamp(file_stats.st_ctime).strftime('%Y-%m-%d %H:%M:%S')
    
    # 獲取文件類型
    file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    return jsonify({
        'success': True,
        'message': '文件上傳成功',
        'file': {
            'id': unique_filename,
            'name': unique_filename,
            'size': file_size,
            'created': file_created,
            'type': file_ext,
            'url': url_for('static', filename=f'knowledge/{unique_filename}')
        }
    })

@app.route('/api/knowledge-file/<file_id>', methods=['DELETE'])
def delete_knowledge_file(file_id):
    """刪除知識庫文件"""
    knowledge_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'knowledge')
    file_path = os.path.join(knowledge_folder, file_id)
    
    if os.path.exists(file_path) and os.path.isfile(file_path):
        try:
            os.remove(file_path)
            return jsonify({'success': True, 'message': '文件已刪除'})
        except Exception as e:
            return jsonify({'success': False, 'message': f'刪除文件時出錯: {str(e)}'})
    else:
        return jsonify({'success': False, 'message': '文件不存在'})

@app.route('/api/segment-image', methods=['POST'])
def segment_image():
    """分割圖像，將商品與背景分離"""
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': '沒有找到圖像文件'})
    
    file = request.files['image']
    threshold = int(request.form.get('threshold', 30))
    
    if file.filename == '':
        return jsonify({'success': False, 'message': '沒有選擇文件'})
    
    if file and allowed_file(file.filename):
        # 生成唯一的文件名
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        try:
            # 使用 OpenCV 進行圖像分割
            img = cv2.imread(file_path)
            # 轉換為 RGBA 格式
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # 使用 GrabCut 算法進行分割
            mask = np.zeros(img.shape[:2], np.uint8)
            bgd_model = np.zeros((1, 65), np.float64)
            fgd_model = np.zeros((1, 65), np.float64)
            
            # 設置矩形區域 (假設商品在圖像中央)
            height, width = img.shape[:2]
            margin = int(min(height, width) * (100 - threshold) / 200)  # 根據閾值調整邊距
            rect = (margin, margin, width - 2*margin, height - 2*margin)
            
            # 執行 GrabCut 算法
            cv2.grabCut(img, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
            
            # 創建蒙版
            mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
            
            # 應用蒙版到原始圖像
            img_rgba = np.zeros((height, width, 4), dtype=np.uint8)
            img_rgba[:, :, 0:3] = img_rgb
            img_rgba[:, :, 3] = mask2 * 255
            
            # 保存分割後的圖像
            segmented_filename = f"segmented_{unique_filename}"
            segmented_path = os.path.join(app.config['DESIGN_OUTPUT_FOLDER'], segmented_filename)
            
            # 使用 PIL 保存 RGBA 圖像
            pil_img = Image.fromarray(img_rgba)
            pil_img.save(segmented_path, format="PNG")
            
            # 返回分割後的圖像 URL
            segmented_url = url_for('static', filename=f'design_output/{segmented_filename}', _external=True)
            
            return jsonify({
                'success': True, 
                'segmented_image_url': segmented_url,
                'message': '圖像分割成功'
            })
            
        except Exception as e:
            print(f"分割圖像時出錯: {str(e)}")
            return jsonify({'success': False, 'message': f'分割圖像時出錯: {str(e)}'})
    
    return jsonify({'success': False, 'message': '不支持的文件類型'})

@app.route('/api/segment-image-api', methods=['POST'])
def segment_image_api():
    """使用 Remove.bg API 分割圖像，將商品與背景分離"""
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': '沒有找到圖像文件'})
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'success': False, 'message': '沒有選擇文件'})
    
    # 從請求中獲取 API 密鑰，如果沒有提供，則使用環境變量中的密鑰
    api_key = request.form.get('api_key') or os.environ.get('REMOVE_BG_API_KEY', '')
    
    if not api_key:
        return jsonify({'success': False, 'message': '缺少 API 密鑰'})
    
    try:
        # 保存原始圖像
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # 確保文件是有效的圖像文件
        try:
            img = Image.open(file_path)
            # 將圖像轉換為 PNG 格式，這是 Remove.bg API 最支持的格式
            png_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{uuid.uuid4().hex}_converted.png")
            img.save(png_path, format='PNG')
            
            # 使用 Remove.bg API 進行圖像分割
            import requests
            
            # 讀取轉換後的 PNG 圖像文件
            with open(png_path, 'rb') as img_file:
                img_data = img_file.read()
            
            # 發送請求到 Remove.bg API
            response = requests.post(
                'https://api.remove.bg/v1.0/removebg',
                files={'image_file': ('image.png', img_data, 'image/png')},
                data={'size': 'auto'},
                headers={'X-Api-Key': api_key},
            )
            
            if response.status_code == 200:
                # 保存處理後的圖像
                segmented_filename = f"segmented_api_{unique_filename}"
                segmented_path = os.path.join(app.config['DESIGN_OUTPUT_FOLDER'], segmented_filename)
                
                with open(segmented_path, 'wb') as out:
                    out.write(response.content)
                
                # 返回分割後的圖像 URL
                segmented_url = url_for('static', filename=f'design_output/{segmented_filename}', _external=True)
                
                # 清理臨時文件
                if os.path.exists(png_path):
                    os.remove(png_path)
                
                return jsonify({
                    'success': True, 
                    'segmented_image_url': segmented_url,
                    'message': '圖像分割成功'
                })
            else:
                print(f"Remove.bg API 返回錯誤: {response.status_code}, {response.text}")
                # 如果 API 調用失敗，回退到本地分割方法
                return segment_image()
                
        except Exception as e:
            print(f"處理圖像時出錯: {str(e)}")
            # 如果處理圖像出錯，回退到本地分割方法
            return segment_image()
            
    except Exception as e:
        print(f"API 分割圖像時出錯: {str(e)}")
        # 如果 API 調用出錯，回退到本地分割方法
        return segment_image()

if __name__ == '__main__':
    app.run(debug=True, port=5001)