document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('main-sidebar');
    const grid = document.getElementById('portal-grid');
    const avatarImg = sidebar.querySelector('.avatar-img');

    const startPortalAnimation = () => {
        sidebar.classList.add('initial-center');

        // 第一階段：中央停留
        setTimeout(() => {
            sidebar.classList.add('run-dissolve');

            // 第二階段：歸位動畫
            setTimeout(() => {
                sidebar.classList.remove('initial-center');
                sidebar.classList.remove('run-dissolve');
                sidebar.classList.add('active-left');
                sidebar.classList.add('run-scan');
                
                // 第三階段：顯示右側網格並開始抓取資料
                setTimeout(() => {
                    grid.classList.remove('contents-hidden');
                    grid.classList.add('contents-show');

                    // 🌟 統一在此觸發所有數據串接
                    fetchAllWeather();
                    fetchSteamStatus();
                    updateDiscordStatus(); 
                    updateLiveLocation(); // 📍 新增位置感測啟動
                    updateLiveLocation();
                    updateLiveLocation();
                }, 800); 
                
            }, 1000);
        }, 2500);
    };

    if (avatarImg.complete) {
        startPortalAnimation();
    } else {
        avatarImg.addEventListener('load', startPortalAnimation);
        setTimeout(startPortalAnimation, 4000);
    }

    // 設定定時刷新任務
    setInterval(() => {
        fetchSteamStatus();
        updateDiscordStatus();
        updateLiveLocation(); // 每 5 分鐘同步位置 (與 Discord 同步頻率)
    }, 300000);
});

// --- 📍 OwnTracks 全自動位置感測 ---
async function updateLiveLocation() {
    const statusText = document.querySelector('#geo-status .status-text');
    const led = document.querySelector('#geo-status .status-led');
    const workerUrl = 'https://delicate-silence-d26f.witt3c-event.workers.dev'; 

    try {
        const response = await fetch(workerUrl);
        const data = await response.json();
        
        if (statusText && data.name) {
            // --- 🔧 硬派字串拆解法 ---
            // data.time 範例: "2026/3/24 下午11:02:36"
            const parts = data.time.split(' '); // 拆成 ["2026/3/24", "下午11:02:36"]
            const datePart = parts[0];          // "2026/3/24"
            const timePart = parts[1];          // "下午11:02:36"

            // 1. 處理 月/日 (補零)
            const dateNodes = datePart.split('/'); // ["2026", "3", "24"]
            const mm = dateNodes[1].padStart(2, '0');
            const dd = dateNodes[2].padStart(2, '0');

            // 2. 處理 下午/上午 與 小時
            const ampm = timePart.substring(0, 2); // "下午" 或 "上午"
            const fullTime = timePart.substring(2); // "11:02:36"
            const hour = fullTime.split(':')[0];    // "11"

            // 3. 組合最終格式：03/24 下午 11 點
            const formattedTime = `${mm}/${dd} ${ampm} ${hour} 點`;

            // 更新內容
            statusText.innerHTML = `
                ${data.name} 
                <div style="font-size: 0.65rem; opacity: 0.4; margin-top: 2px;">
                    更新時間 ${formattedTime}
                </div>
            `;
            
            if (led) {
                led.style.backgroundColor = '#00ff00'; 
                led.style.boxShadow = '0 0 8px #00ff00';
            }
        }
    } catch (error) {
        console.error("定位更新失敗:", error);
        if (statusText) statusText.innerText = "衛星訊號中斷";
        if (led) {
            led.style.backgroundColor = '#ff0000'; 
        }
    }
}

// --- 氣象串接 ---
async function fetchAllWeather() {
    const url = './weather.json'; 
    const container = document.getElementById('weather-mini-grid');
    if (!container) return;

    const targetCities = ['臺北市', '桃園市', '臺中市', '嘉義市', '臺南市', '高雄市', '臺東縣', '花蓮縣'];

    try {
        const response = await fetch(url);
        const data = await response.json();
        const allLocations = data.records.location;
        container.innerHTML = ''; 

        targetCities.forEach(target => {
            const loc = allLocations.find(l => l.locationName === target);
            if (loc) {
                const weatherDesc = loc.weatherElement[0].time[0].parameter.parameterName;
                const temp = loc.weatherElement[2].time[0].parameter.parameterName;
                let iconClass = 'fa-sun';
                if (weatherDesc.includes('雨')) iconClass = 'fa-cloud-showers-heavy';
                else if (weatherDesc.includes('雲')) iconClass = 'fa-cloud-sun';

                const div = document.createElement('div');
                div.className = 'mini-weather-item';
                div.innerHTML = `
                    <span class="mini-city-name">${loc.locationName}</span>
                    <span class="mini-city-temp">${temp}°C</span>
                    <i class="fas ${iconClass} mini-city-icon"></i>
                `;
                container.appendChild(div);
            }
        });
    } catch (e) { console.error('天氣更新失敗', e); }
}

// --- Steam 狀態 ---
async function fetchSteamStatus() {
    const steamUrl = './steam_status.json'; 
    const avatar = document.getElementById('steam-avatar');
    const led = document.getElementById('steam-led');
    const text = document.getElementById('steam-text');
    if (!avatar || !led || !text) return;

    try {
        const response = await fetch(`${steamUrl}?t=${Date.now()}`);
        const data = await response.json();
        const player = data.response.players[0];

        avatar.src = player.avatarfull;
        if (player.personastate > 0) {
            led.className = 'status-led led-online';
            text.innerText = player.gameextrainfo ? `🎮 ${player.gameextrainfo}` : "線上";
        } else {
            led.className = 'status-led led-offline';
            text.innerText = "離線";
        }
    } catch (e) { console.log("Steam 讀取中..."); }
}

// --- Discord 偵測 ---
async function updateDiscordStatus() {
    const SERVER_ID = "1330733636219043961";
    const TARGET_NAME = "小維"; 
    const container = document.getElementById("discord-status");
    if (!container) return;
    
    const led = container.querySelector(".status-led");
    const text = container.querySelector(".status-text");
    const avatar = document.getElementById("discord-avatar");

    led.className = 'status-led'; 
    text.innerHTML = '偵測中<span class="loading-dots"></span>';

    try {
        const [response] = await Promise.all([
            fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json?t=${Date.now()}`),
            new Promise(resolve => setTimeout(resolve, 2500)) // 保持 2.5s 儀式感
        ]);

        const data = await response.json();
        const me = data.members.find(m => m.username === TARGET_NAME || m.id === "393579380674134016");

        if (me && me.status === "online") {
            led.className = 'status-led led-online';
            text.innerText = "目前在線";
            if (me.avatar_url) avatar.src = me.avatar_url;
        } else {
            led.className = 'status-led led-offline';
            text.innerText = "目前離線";
        }
    } catch (error) {
        text.innerText = "連線受阻";
        led.className = 'status-led led-offline';
    }
}

// --- 📍 OwnTracks + Google Fit 數據串接 ---
async function updateLiveLocation() {
    const geoText = document.querySelector('#geo-status .status-text');
    const stepText = document.querySelector('#step-status .status-text');
    const geoLed = document.querySelector('#geo-status .status-led');
    const stepLed = document.querySelector('#step-status .status-led');
    
    const workerUrl = 'https://delicate-silence-d26f.witt3c-event.workers.dev'; 

    try {
        const response = await fetch(`${workerUrl}?t=${Date.now()}`);
        const data = await response.json();
        
        if (data.name) {
            // 1. 更新位置：顯示 "嘉義市 西區"，下方顯示微縮時間
            // 從 "2026/3/25 下午1:49:46" 抓取時間部分
            const timePart = data.time.split(' ')[1] || ""; 
            geoText.innerHTML = `
                ${data.name} 
                <div style="font-size: 0.6rem; opacity: 0.4; margin-top:2px;">
                    ${timePart}
                </div>
            `;
            
            // 2. 更新步數：加上千分位與單位
            if (stepText) {
                const stepCount = (data.steps || 0).toLocaleString();
                stepText.innerHTML = `
                    ${stepCount} 
                    <span style="font-size: 0.65rem; opacity: 0.5; display:block;">STEPS</span>
                `;
            }

            // 3. 點亮燈號 (成功獲取數據)
            if (geoLed) {
                geoLed.className = 'status-led led-location';
                geoLed.style.backgroundColor = '#00ff00';
                geoLed.style.boxShadow = '0 0 8px #00ff00';
            }
            if (stepLed) {
                stepLed.className = 'status-led led-steps';
                // 步數可以給它一個橘黃色的呼吸燈效果
                stepLed.style.backgroundColor = '#f39c12';
                stepLed.style.boxShadow = '0 0 8px #f39c12';
            }
        }
    } catch (error) {
        console.error("數據更新失敗:", error);
        if (geoText) geoText.innerText = "感應器離線";
        if (stepText) stepText.innerText = "NO DATA";
    }
}

async function updateLiveLocation() {
    // 取得 DOM 元素
    const battItem = document.getElementById('battery-status');
    const battText = battItem ? battItem.querySelector('.status-text') : null;
    const battFill = document.getElementById('battery-fill');
    const battLed = document.getElementById('battery-led');
    const chargingBolt = document.getElementById('charging-bolt');
    
    // 你的 Worker 網址
    const workerUrl = 'https://delicate-silence-d26f.witt3c-event.workers.dev'; 

    try {
        const response = await fetch(`${workerUrl}?t=${Date.now()}`);
        const data = await response.json();
        
        if (data.name) {
            // --- 📍 更新位置與時間 (保留你原有的邏輯) ---
            const locText = document.querySelector('#location-status .status-text');
            if (locText) locText.innerHTML = `${data.name}<br><small>${data.time}</small>`;

            // --- 🔋 更新手機電量與充電狀態 ---
            if (battText) {
                const level = (data.batt !== undefined) ? data.batt : 0;
                const status = (data.bs !== undefined) ? data.bs : 0; // 2 為正在充電

                // 1. 更新電池填滿高度與顏色分階
                if (battFill) {
                    battFill.style.height = `${level}%`;
                    
                    if (level <= 20) {
                        battFill.style.backgroundColor = '#ff4757'; // 低電量紅
                        if (battLed) battLed.className = 'status-led led-low-battery';
                    } else if (level <= 50) {
                        battFill.style.backgroundColor = '#f1c40f'; // 中電量黃
                        if (battLed) battLed.className = 'status-led led-online';
                    } else {
                        battFill.style.backgroundColor = '#2ecc71'; // 高電量綠
                        if (battLed) battLed.className = 'status-led led-online';
                    }
                }

                // 2. 判斷充電中狀態 (bs === 2)
                let statusSuffix = "";
                if (status === 2) {
                    statusSuffix = " <span style='color:#f1c40f; font-size:0.7rem; font-weight:bold;'>⚡充電中</span>";
                    if (chargingBolt) chargingBolt.style.display = 'block';
                } else {
                    if (chargingBolt) chargingBolt.style.display = 'none';
                }

                // 3. 渲染文字內容
                battText.innerHTML = `${level}%${statusSuffix}`;
            }
        }
    } catch (error) {
        console.error("監控數據抓取失敗:", error);
        if (battText) battText.innerText = "連線中斷";
    }
}