let deferredPrompt;
const installButton = document.getElementById('installButton');
const installPrompt = document.getElementById('installPrompt');
const dismissInstallPrompt = document.getElementById('dismissInstallPrompt');

const backgroundImageUrlInput = document.getElementById('backgroundImageUrl');
const applyBackgroundUrlButton = document.getElementById('applyBackgroundUrl');
const backgroundImageLocalInput = document.getElementById('backgroundImageLocal');

const searchEngineSelect = document.getElementById('searchEngine');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const imageSearchButton = document.getElementById('imageSearchButton');
const imageSearchResultsContainer = document.getElementById('imageSearchResults');

// 加载保存的背景
function loadSavedBackground() {
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) {
        document.body.style.backgroundImage = `url('${savedBackground}')`;
    }
}

// 保存背景到 localStorage
function saveBackground(imageUrl) {
    localStorage.setItem('backgroundImage', imageUrl);
}

// 应用背景图片 URL
applyBackgroundUrlButton.addEventListener('click', () => {
    const imageUrl = backgroundImageUrlInput.value.trim();
    if (imageUrl) {
        document.body.style.backgroundImage = `url('${imageUrl}')`;
        saveBackground(imageUrl);
        backgroundImageUrlInput.value = ''; // 清空输入框
    }
});

// 处理本地图片上传
backgroundImageLocalInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.body.style.backgroundImage = `url('${e.target.result}')`;
            saveBackground(e.target.result);
        };
        reader.readAsDataURL(file);
        backgroundImageLocalInput.value = ''; // 清空文件选择
    }
});

// 处理搜索
searchButton.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();
    const selectedEngine = searchEngineSelect.value;

    if (searchTerm) {
        let searchUrl = '';
        switch (selectedEngine) {
            case 'google':
                searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
                break;
            case 'bing':
                searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(searchTerm)}`;
                break;
            case 'baidu':
                searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(searchTerm)}`;
                break;
            // 添加更多搜索引擎的 URL 格式
        }
        if (searchUrl) {
            window.location.href = searchUrl;
        }
    }
});

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

imageSearchButton.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        fetch(`/api/image_search?query=${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                // 假设接口返回的 data 是一个包含图片 URL 数组的对象，例如 { images: ['url1', 'url2', ...] }
                imageSearchResultsContainer.innerHTML = ''; // 清空之前的搜索结果
                if (data && data.images && data.images.length > 0) {
                    data.images.forEach(imageUrl => {
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.style.maxWidth = '200px';
                        img.style.margin = '10px';
                        imageSearchResultsContainer.appendChild(img);
                    });
                } else {
                    imageSearchResultsContainer.innerText = '未找到相关图片。';
                }
            })
            .catch(error => {
                console.error('搜图请求失败:', error);
                imageSearchResultsContainer.innerText = '搜图失败，请稍后重试。';
            });
    }
});

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!localStorage.getItem('pwaInstallPromptShown')) {
        installPrompt.style.display = 'block';
        localStorage.setItem('pwaInstallPromptShown', 'true');
    }
});

installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        installPrompt.style.display = 'none';
        console.log(`User response to the install prompt: ${outcome}`);
    }
});

dismissInstallPrompt.addEventListener('click', () => {
    installPrompt.style.display = 'none';
    // localStorage.setItem('pwaInstallPromptShown', 'dismissed');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    installPrompt.style.display = 'none';
});

// 初始化加载保存的背景
loadSavedBackground();

// 主题切换
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
});

// 初始化主题
const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme);
themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

// 天气功能
const weatherInfo = document.querySelector('.weather-info');
const temperature = document.querySelector('.temperature');
const locationText = document.querySelector('.location');

// 默认位置（北京）
const DEFAULT_LOCATION = '北京';

async function getWeather() {
    try {
        // 先检查浏览器是否支持地理位置
        if (!navigator.geolocation) {
            console.log('浏览器不支持地理位置，使用默认位置');
            return await fetchWeatherWithLocation(DEFAULT_LOCATION);
        }

        console.log('开始获取位置信息...');

        // 设置超时和错误处理
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log('成功获取位置:', pos.coords);
                    // 使用逆地理编码获取城市名称
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
                        .then(response => response.json())
                        .then(data => {
                            const city = data.address.city || data.address.town || data.address.village || DEFAULT_LOCATION;
                            resolve(city);
                        })
                        .catch(() => resolve(DEFAULT_LOCATION));
                },
                (error) => {
                    console.error('位置获取错误:', error);
                    console.log('使用默认位置（北京）');
                    resolve(DEFAULT_LOCATION);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });

        return await fetchWeatherWithLocation(position);
    } catch (error) {
        console.error('获取天气信息失败:', error);
        temperature.textContent = '--°C';
        locationText.textContent = error.message || '无法获取天气信息';
        const weatherIcon = document.querySelector('.weather-info i');
        weatherIcon.className = 'fas fa-exclamation-triangle';
    }
}

async function fetchWeatherWithLocation(location) {
    try {
        // 显示正在加载的状态
        const tempElement = document.querySelector('.temperature');
        const locationElement = document.querySelector('.location');

        tempElement.textContent = '加载中...';
        locationElement.textContent = '正在获取天气...';

        console.log('开始获取天气信息...');
        const searchEngine = searchEngineSelect.value;
        let searchUrl = '';

        // 根据选择的搜索引擎构建搜索URL
        switch (searchEngine) {
            case 'google':
                searchUrl = `https://www.google.com/search?q=${encodeURIComponent(location + '天气')}`;
                break;
            case 'bing':
                searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(location + '天气')}`;
                break;
            case 'baidu':
                searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(location + '天气')}`;
                break;
        }

        // 直接获取搜索结果页面
        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/html',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`天气服务暂时不可用: ${response.status}`);
        }

        const html = await response.text();
        console.log('获取到搜索结果页面');

        // 解析搜索结果页面
        let tempValue = '';
        let weatherCondition = '';

        if (searchEngine === 'baidu') {
            // 解析百度天气结果
            const tempMatch = html.match(/<span class="op_weather_temp">([^<]+)<\/span>/);
            const conditionMatch = html.match(/<span class="op_weather_condition">([^<]+)<\/span>/);

            if (tempMatch) tempValue = tempMatch[1];
            if (conditionMatch) weatherCondition = conditionMatch[1];
        } else if (searchEngine === 'google') {
            // 解析Google天气结果
            const tempMatch = html.match(/<span class="wob_t">([^<]+)<\/span>/);
            const conditionMatch = html.match(/<span class="wob_dc">([^<]+)<\/span>/);

            if (tempMatch) tempValue = tempMatch[1];
            if (conditionMatch) weatherCondition = conditionMatch[1];
        } else if (searchEngine === 'bing') {
            // 解析Bing天气结果
            const tempMatch = html.match(/<div class="wtr_currTemp">([^<]+)<\/div>/);
            const conditionMatch = html.match(/<div class="wtr_currCond">([^<]+)<\/div>/);

            if (tempMatch) tempValue = tempMatch[1];
            if (conditionMatch) weatherCondition = conditionMatch[1];
        }

        if (!tempValue || !weatherCondition) {
            throw new Error('无法解析天气数据');
        }

        tempElement.textContent = tempValue;
        locationElement.textContent = location;

        const weatherIcon = document.querySelector('.weather-info i');
        const conditionLower = weatherCondition.toLowerCase();

        // 根据天气状况设置图标
        if (conditionLower.includes('雷') || conditionLower.includes('闪电')) {
            weatherIcon.className = 'fas fa-bolt';
        } else if (conditionLower.includes('雨')) {
            weatherIcon.className = 'fas fa-cloud-rain';
        } else if (conditionLower.includes('雪')) {
            weatherIcon.className = 'fas fa-snowflake';
        } else if (conditionLower.includes('雾') || conditionLower.includes('霾')) {
            weatherIcon.className = 'fas fa-smog';
        } else if (conditionLower.includes('晴')) {
            weatherIcon.className = 'fas fa-sun';
        } else if (conditionLower.includes('云') || conditionLower.includes('阴')) {
            weatherIcon.className = 'fas fa-cloud';
        } else {
            weatherIcon.className = 'fas fa-question';
        }

        return { temperature: tempValue, condition: weatherCondition };
    } catch (error) {
        console.error('获取天气信息失败:', error);
        const tempElement = document.querySelector('.temperature');
        const locationElement = document.querySelector('.location');

        tempElement.textContent = '--°C';
        locationElement.textContent = error.message || '无法获取天气信息';
        const weatherIcon = document.querySelector('.weather-info i');
        weatherIcon.className = 'fas fa-exclamation-triangle';
        throw error;
    }
}

// 添加重试按钮
const weatherWidget = document.querySelector('.weather-widget');
const retryButton = document.createElement('button');
retryButton.textContent = '重试';
retryButton.style.marginTop = '10px';
retryButton.style.padding = '5px 10px';
retryButton.style.cursor = 'pointer';
retryButton.addEventListener('click', getWeather);
weatherWidget.appendChild(retryButton);

// 初始加载天气
getWeather();

// 快速访问链接
const linksGrid = document.querySelector('.links-grid');
const defaultLinks = [
    { name: 'GitHub', url: 'https://github.com', icon: 'fab fa-github' },
    { name: 'YouTube', url: 'https://youtube.com', icon: 'fab fa-youtube' },
    { name: 'Twitter', url: 'https://twitter.com', icon: 'fab fa-twitter' }
];

function loadLinks() {
    const savedLinks = JSON.parse(localStorage.getItem('quickLinks')) || defaultLinks;
    linksGrid.innerHTML = '';

    savedLinks.forEach(link => {
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.innerHTML = `
            <i class="${link.icon}"></i>
            <span>${link.name}</span>
        `;
        linkItem.addEventListener('click', () => window.open(link.url, '_blank'));
        linksGrid.appendChild(linkItem);
    });

    // 添加"添加"按钮
    const addButton = document.createElement('div');
    addButton.className = 'link-item';
    addButton.innerHTML = `
        <i class="fas fa-plus"></i>
        <span>添加</span>
    `;
    addButton.addEventListener('click', addNewLink);
    linksGrid.appendChild(addButton);
}

function addNewLink() {
    const name = prompt('输入网站名称:');
    if (!name) return;

    const url = prompt('输入网站URL:');
    if (!url) return;

    const icon = prompt('输入图标类名 (例如: fab fa-github):');
    if (!icon) return;

    const savedLinks = JSON.parse(localStorage.getItem('quickLinks')) || defaultLinks;
    savedLinks.push({ name, url, icon });
    localStorage.setItem('quickLinks', JSON.stringify(savedLinks));
    loadLinks();
}

loadLinks();

// 待办事项功能
const todoInput = document.getElementById('todoInput');
const addTodoButton = document.getElementById('addTodo');
const todoList = document.getElementById('todoList');

function loadTodos() {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    todoList.innerHTML = '';

    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = todo.completed ? 'completed' : '';
        li.innerHTML = `
            <span>${todo.text}</span>
            <div>
                <button class="complete-btn" data-index="${index}">
                    <i class="fas fa-check"></i>
                </button>
                <button class="delete-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        todoList.appendChild(li);
    });

    // 添加事件监听器
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', toggleTodo);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteTodo);
    });
}

function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    todos.push({ text, completed: false });
    localStorage.setItem('todos', JSON.stringify(todos));

    todoInput.value = '';
    loadTodos();
}

function toggleTodo(e) {
    const index = e.target.closest('button').dataset.index;
    const todos = JSON.parse(localStorage.getItem('todos'));
    todos[index].completed = !todos[index].completed;
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
}

function deleteTodo(e) {
    const index = e.target.closest('button').dataset.index;
    const todos = JSON.parse(localStorage.getItem('todos'));
    todos.splice(index, 1);
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
}

addTodoButton.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

loadTodos();

function setBackground(imageUrl) {
    document.body.style.backgroundImage = `url(${imageUrl})`;
    localStorage.setItem('backgroundImage', imageUrl);
}

const searchEngines = {
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
    baidu: 'https://www.baidu.com/s?wd='
};

function performSearch(query, isImageSearch = false) {
    const engine = searchEngineSelect.value; // 使用正确的变量名
    let searchUrl = searchEngines[engine];

    if (isImageSearch) {
        if (engine === 'google') {
            searchUrl = 'https://www.google.com/search?tbm=isch&q=';
        } else if (engine === 'bing') {
            searchUrl = 'https://www.bing.com/images/search?q=';
        } else if (engine === 'baidu') {
            searchUrl = 'https://image.baidu.com/search/index?tn=baiduimage&word=';
        }
    }

    window.open(searchUrl + encodeURIComponent(query), '_blank');
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPrompt.style.display = 'block';
});
