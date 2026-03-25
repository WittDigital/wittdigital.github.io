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

async function updateLiveLocation() {
    const geoText = document.querySelector('#geo-status .status-text');
    const stepText = document.querySelector('#step-status .status-text'); // 確保 HTML ID 是 step-status
    const geoLed = document.querySelector('#geo-status .status-led');
    const stepLed = document.querySelector('#step-status .status-led');
    
    const workerUrl = 'https://delicate-silence-d26f.witt3c-event.workers.dev'; 

    try {
        const response = await fetch(workerUrl);
        const data = await response.json();
        
        if (data.name) {
            // 1. 更新位置
            // 這裡處理 "下午11:02:36" 抓取中間的時間部分
            const timeStr = data.time.split(' ')[1] || ""; 
            geoText.innerHTML = `${data.name} <div style="font-size: 0.65rem; opacity: 0.4; margin-top:2px;">更新時間 ${timeStr}</div>`;
            
            // 2. 更新步數
            if (stepText) {
                const stepCount = (data.steps || 0).toLocaleString();
                stepText.innerHTML = `${stepCount} <span style="font-size: 0.7rem; opacity: 0.5;">STEPS</span>`;
            }

            // 3. 點亮燈號
            [geoLed, stepLed].forEach(led => {
                if (led) {
                    led.style.backgroundColor = '#00ff00';
                    led.style.boxShadow = '0 0 8px #00ff00';
                }
            });
        }
    } catch (error) {
        console.error("位置/步數更新失敗:", error);
        if (geoText) geoText.innerText = "感應器離線";
    }
}