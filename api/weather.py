from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import re

app = Flask(__name__)

def parse_baidu_weather(html):
    soup = BeautifulSoup(html, 'html.parser')
    # 百度天气数据通常在 class 为 'weather' 的 div 中
    weather_div = soup.find('div', class_='weather')
    if not weather_div:
        return None
    
    # 提取温度和天气状况
    temperature = weather_div.find('span', class_='temperature')
    condition = weather_div.find('span', class_='condition')
    
    if not temperature or not condition:
        return None
        
    return {
        'temperature': temperature.text.strip(),
        'condition': condition.text.strip()
    }

def parse_google_weather(html):
    soup = BeautifulSoup(html, 'html.parser')
    # Google 天气数据通常在特定的 div 中
    weather_div = soup.find('div', class_='wob_tci')
    if not weather_div:
        return None
    
    # 提取温度和天气状况
    temperature = soup.find('span', class_='wob_t')
    condition = weather_div.get('aria-label', '')
    
    if not temperature or not condition:
        return None
        
    return {
        'temperature': f"{temperature.text.strip()}°C",
        'condition': condition
    }

def parse_bing_weather(html):
    soup = BeautifulSoup(html, 'html.parser')
    # Bing 天气数据通常在特定的 div 中
    weather_div = soup.find('div', class_='wtr_currTemp')
    if not weather_div:
        return None
    
    # 提取温度和天气状况
    temperature = weather_div.find('span', class_='wtr_currTemp')
    condition = weather_div.find('div', class_='wtr_currCond')
    
    if not temperature or not condition:
        return None
        
    return {
        'temperature': temperature.text.strip(),
        'condition': condition.text.strip()
    }

@app.route('/api/weather')
def get_weather():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'URL parameter is required'}), 400
    
    try:
        # 设置请求头，模拟浏览器访问
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # 根据搜索引擎选择不同的解析方法
        if 'baidu.com' in url:
            weather_data = parse_baidu_weather(response.text)
        elif 'google.com' in url:
            weather_data = parse_google_weather(response.text)
        elif 'bing.com' in url:
            weather_data = parse_bing_weather(response.text)
        else:
            return jsonify({'error': 'Unsupported search engine'}), 400
            
        if not weather_data:
            return jsonify({'error': 'Failed to parse weather data'}), 500
            
        return jsonify(weather_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 