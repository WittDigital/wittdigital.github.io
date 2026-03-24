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

                    // 🌟 統一在這裡觸發所有串接任務
                    fetchAllWeather();
                    fetchSteamStatus();
                    updateDiscordStatus(); // 呼叫偵測函式
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

    // 設定定時刷新 (每 5 分鐘)
    setInterval(() => {
        fetchSteamStatus();
        updateDiscordStatus();
    }, 300000);
});

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

// --- Discord 偵測 (導入你的 2.5s 儀式感邏輯) ---
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
            new Promise(resolve => setTimeout(resolve, 2500))
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

// --- 📍 OwnTracks 全自動位置感測 ---
async function updateLiveLocation() {
    // 1. 定位到你原本 HTML 中的文字顯示區塊
    const statusText = document.querySelector('#geo-status .status-text');
    const led = document.querySelector('#geo-status .status-led');
    
    // 2. 你的 Cloudflare Worker 網址
    const workerUrl = 'https://你的Worker名稱.workers.dev'; 

    try {
        const response = await fetch(workerUrl);
        const data = await response.json();
        
        if (statusText && data.name) {
            // 3. 更新內容：上方顯示地點，下方顯示小字時間
            // 使用 innerHTML 來插入換行和縮小時間文字
            statusText.innerHTML = `
                ${data.name} 
                <div style="font-size: 0.65rem; opacity: 0.4; margin-top: 2px;">
                    Updated: ${data.time.split(' ')[1]} // 只取時間部分
                </div>
            `;
            
            // 4. 讓 LED 燈亮起（代表通訊正常）
            if (led) {
                led.style.backgroundColor = '#00ff00'; // 綠燈
                led.style.boxShadow = '0 0 5px #00ff00';
            }
        }
    } catch (error) {
        console.error("定位更新失敗:", error);
        if (statusText) statusText.innerText = "衛星訊號中斷";
        if (led) {
            led.style.backgroundColor = '#ff0000'; // 紅燈
            led.style.boxShadow = '0 0 5px #ff0000';
        }
    }
}

// 網頁載入後執行
document.addEventListener('DOMContentLoaded', () => {
    updateLiveLocation();
    
    // 每 10 分鐘自動對時一次
    setInterval(updateLiveLocation, 600000);
});