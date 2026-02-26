import requests
import json

# 設置 Google API 密鑰
API_KEY = "AIzaSyDmpASzQ8ZM6g5gst9RiFhxp8HXLigXISA"

print("正在使用 Gemini 2.5 Flash Lite 模型...")

try:
    # 使用 Google 官方 REST API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"
    
    headers = {
        "Content-Type": "application/json",
    }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": "Hi, what is the meaning of life?"
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "topP": 0.95,
            "topK": 40,
            "maxOutputTokens": 1024,
        }
    }
    
    print("正在發送請求到 Google Gemini API...")
    
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    
    print(f"響應狀態碼: {response.status_code}")
    
    result = response.json()
    
    if response.status_code == 200:
        # 提取回復内容
        if 'candidates' in result and len(result['candidates']) > 0:
            content = result['candidates'][0]['content']
            if 'parts' in content and len(content['parts']) > 0:
                text = content['parts'][0]['text']
                print(f"\n模型回復成功！")
                print(f"\n回復内容:")
                print(text)
            else:
                print("錯誤：無法提取回復内容")
        else:
            print("錯誤：API 未返回候選項")
    else:
        print(f"\nAPI 錯誤:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
except Exception as e:
    print(f"\n發生錯誤: {e}")
    import traceback
    traceback.print_exc()