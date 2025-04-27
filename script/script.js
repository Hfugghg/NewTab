let deferredPrompt;
const installButton = document.getElementById('installButton');
const installPrompt = document.getElementById('installPrompt');
const dismissInstallPrompt = document.getElementById('dismissInstallPrompt');

// 侧边栏 设置面板相关
const settingsPanel = document.querySelector('.settings-panel');
const settingsToggle = document.querySelector('.settings-toggle');
const container = document.querySelector('.container');

console.log('settingsToggle element:', settingsToggle);

// 侧边栏 初始化设置面板状态
settingsPanel.classList.remove('expanded');
container.classList.remove('settings-expanded');

// 侧边栏 设置面板切换功能
settingsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = settingsPanel.classList.toggle('expanded');

    // 更新箭头图标方向
    const icon = settingsToggle.querySelector('i');
    icon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';

    // 根据侧边栏状态显示/隐藏按钮
    settingsToggle.style.display = isExpanded ? 'none' : 'flex';
});

// 侧边栏 点击设置面板外部时关闭面板
document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
        settingsPanel.classList.remove('expanded');
        // 重置箭头图标方向并显示按钮
        const icon = settingsToggle.querySelector('i');
        icon.style.transform = 'rotate(0deg)';
        settingsToggle.style.display = 'flex';
    }
});

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

// 添加主题切换动画
function toggleTheme() {
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');

    // 更新图标
    const icon = themeToggle.querySelector('i');
    if (isDark) {
        icon.className = 'fas fa-moon';
        icon.style.transform = 'rotate(0deg)';
    } else {
        icon.className = 'fas fa-sun';
        icon.style.transform = 'rotate(180deg)';
    }

    // 保存主题设置
    localStorage.setItem('theme', isDark ? 'light' : 'dark');

    // 添加过渡效果
    body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
        body.style.transition = '';
    }, 300);
}

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);

    // 设置初始图标
    const icon = themeToggle.querySelector('i');
    if (savedTheme === 'dark') {
        icon.className = 'fas fa-sun';
        icon.style.transform = 'rotate(180deg)';
    } else {
        icon.className = 'fas fa-moon';
        icon.style.transform = 'rotate(0deg)';
    }
}

// 添加点击事件监听
themeToggle.addEventListener('click', toggleTheme);

// 初始化主题
initTheme();

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
            const defaultWeather = await fetchWeatherWithLocation(DEFAULT_LOCATION);
            hideRetryButton();
            return defaultWeather;
        }

        console.log('开始获取位置信息...');

        // 设置超时和错误处理
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log('成功获取位置:', pos.coords);
                    // 直接使用经纬度获取天气
                    resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                },
                (error) => {
                    console.error('位置获取错误:', error);
                    let errorMessage = '无法获取位置信息';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = '请允许访问位置信息';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = '位置信息不可用';
                            break;
                        case error.TIMEOUT:
                            errorMessage = '获取位置超时';
                            break;
                    }
                    console.log('使用默认位置（北京）');
                    resolve({
                        latitude: 39.9042,
                        longitude: 116.4074
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });

        const weather = await fetchWeatherWithLocation(position);
        hideRetryButton();
        return weather;
    } catch (error) {
        console.error('获取天气信息失败:', error);
        temperature.textContent = '--°C';
        locationText.textContent = error.message || '无法获取天气信息';
        const weatherIcon = document.querySelector('.weather-info i');
        weatherIcon.className = 'fas fa-exclamation-triangle';
        showRetryButton();
        throw error;
    }
}

async function fetchWeatherWithLocation(position) {
    try {
        // 显示正在加载的状态
        const tempElement = document.querySelector('.temperature');
        const locationElement = document.querySelector('.location');

        tempElement.textContent = '加载中...';
        locationElement.textContent = '正在获取天气...';

        console.log('开始获取天气信息...');

        // 使用 Open-Meteo API
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${position.latitude}&longitude=${position.longitude}&current_weather=true`);

        if (!response.ok) {
            throw new Error(`天气服务暂时不可用: ${response.status}`);
        }

        const data = await response.json();

        // 更新天气信息
        tempElement.textContent = `${Math.round(data.current_weather.temperature)}°C`;
        locationElement.textContent = '当前位置';

        const weatherIcon = document.querySelector('.weather-info i');
        const weatherCode = data.current_weather.weathercode;

        // 根据天气代码设置图标
        // 天气代码说明：https://open-meteo.com/en/docs
        if (weatherCode >= 95) {
            weatherIcon.className = 'fas fa-bolt';
        } else if (weatherCode >= 80) {
            weatherIcon.className = 'fas fa-cloud-showers-heavy';
        } else if (weatherCode >= 70) {
            weatherIcon.className = 'fas fa-snowflake';
        } else if (weatherCode >= 60) {
            weatherIcon.className = 'fas fa-cloud-rain';
        } else if (weatherCode >= 50) {
            weatherIcon.className = 'fas fa-smog';
        } else if (weatherCode >= 40) {
            weatherIcon.className = 'fas fa-cloud';
        } else if (weatherCode >= 30) {
            weatherIcon.className = 'fas fa-cloud';
        } else if (weatherCode >= 20) {
            weatherIcon.className = 'fas fa-cloud';
        } else if (weatherCode >= 10) {
            weatherIcon.className = 'fas fa-cloud';
        } else {
            weatherIcon.className = 'fas fa-sun';
        }

        return {
            temperature: data.current_weather.temperature,
            condition: getWeatherDescription(weatherCode)
        };
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

function getWeatherDescription(code) {
    const descriptions = {
        0: '晴朗',
        1: '基本晴朗',
        2: '部分多云',
        3: '多云',
        45: '雾',
        48: '雾凇',
        51: '小雨',
        53: '中雨',
        55: '大雨',
        61: '小雨',
        63: '中雨',
        65: '大雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        77: '冰雹',
        80: '小雨',
        81: '中雨',
        82: '大雨',
        85: '小雪',
        86: '大雪',
        95: '雷雨',
        96: '雷雨带冰雹',
        99: '强雷雨带冰雹'
    };
    return descriptions[code] || '未知天气';
}

// 修改重试按钮的创建和样式
const weatherWidget = document.querySelector('.weather-widget');
const retryButton = document.createElement('button');
retryButton.className = 'weather-retry-button';
retryButton.textContent = '重试';
retryButton.style.display = 'none'; // 默认隐藏
weatherWidget.appendChild(retryButton);

retryButton.addEventListener('click', () => {
    retryButton.style.display = 'none'; // 点击重试时先隐藏按钮
    getWeather();
});

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

// 侧边栏 设置控制
const opacitySlider = document.getElementById('opacitySlider');
const blurSlider = document.getElementById('blurSlider');
const defaultLocationInput = document.getElementById('defaultLocation');
const saveLocationButton = document.getElementById('saveLocation');

// 侧边栏 加载保存的设置
function loadSettings() {
    const savedOpacity = localStorage.getItem('containerOpacity');
    const savedBlur = localStorage.getItem('blurAmount');
    const savedLocation = localStorage.getItem('defaultLocation');

    if (savedOpacity) {
        document.documentElement.style.setProperty('--container-opacity', savedOpacity);
        document.getElementById('opacitySlider').value = savedOpacity;
    }

    if (savedBlur) {
        document.documentElement.style.setProperty('--blur-amount', `${savedBlur}px`);
        document.getElementById('blurSlider').value = savedBlur;
    }

    if (savedLocation) {
        document.getElementById('defaultLocation').value = savedLocation;
    }
}

// 添加透明度和模糊度滑块的事件监听器
opacitySlider.addEventListener('input', (e) => {
    const value = e.target.value;
    document.documentElement.style.setProperty('--container-opacity', value);
    localStorage.setItem('containerOpacity', value);
});

blurSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    document.documentElement.style.setProperty('--blur-amount', `${value}px`);
    localStorage.setItem('blurAmount', value);
});

// 初始化设置
loadSettings();

// 添加显示/隐藏重试按钮的辅助函数
function showRetryButton() {
    const retryButton = document.querySelector('.weather-retry-button');
    if (retryButton) {
        retryButton.style.display = 'block';
    }
}

function hideRetryButton() {
    const retryButton = document.querySelector('.weather-retry-button');
    if (retryButton) {
        retryButton.style.display = 'none';
    }
}
