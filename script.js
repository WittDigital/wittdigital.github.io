/**
 * Witt3C Portfolio - Core Logic
 * 包含：開場動畫、多源數據監控、三位一體部落格輪播、日誌垂直捲動
 */

// --- 1. 全域變數與定時器 ---
let autoTimer; // 用於部落格自動輪播

// --- 2. 核心初始化 (DOM Ready) ---
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('main-sidebar');
    const grid = document.getElementById('portal-grid');
    const avatarImg = sidebar.querySelector('.avatar-img');

    // [開場門戶動畫邏輯]
    const startPortalAnimation = () => {
        sidebar.classList.add('initial-center');

        // 第一階段：中央停留
        setTimeout(() => {
            sidebar.classList.add('run-dissolve');

            // 第二階段：歸位動畫
            setTimeout(() => {
                sidebar.classList.remove('initial-center', 'run-dissolve');
                sidebar.classList.add('active-left', 'run-scan');
                
                // 第三階段：顯示右側網格並啟動數據抓取
                setTimeout(() => {
                    grid.classList.remove('contents-hidden');
                    grid.classList.add('contents-show');

                    // 啟動所有監控數據與輪播
                    fetchAllWeather();
                    fetchSteamStatus();
                    updateDiscordStatus(); 
                    updateLiveLocation();
                    
                    window.switchBlog('tech'); // 預設啟動科技組
                    startLogRoller();          // 啟動日誌捲動
                }, 800); 
                
            }, 1000);
        }, 2500);
    };

    // 確保圖片載入後再啟動
    if (avatarImg.complete) {
        startPortalAnimation();
    } else {
        avatarImg.addEventListener('load', startPortalAnimation);
        setTimeout(startPortalAnimation, 4000); // 防呆：最長 4 秒後強制啟動
    }

    // 設定定時刷新任務 (每 5 分鐘)
    setInterval(() => {
        fetchSteamStatus();
        updateDiscordStatus();
        updateLiveLocation(); 
    }, 300000);
});

// --- 3. 監控模組：位置、步數、電量 (OwnTracks + Google Fit) ---
async function updateLiveLocation() {
    const geoText = document.querySelector('#geo-status .status-text');
    const geoLed = document.querySelector('#geo-status .status-led');
    const stepText = document.querySelector('#step-status .status-text');
    const stepLed = document.querySelector('#step-status .status-led');
    const battItem = document.getElementById('battery-status');
    const battText = battItem ? battItem.querySelector('.status-text') : null;
    const battFill = document.getElementById('battery-fill');
    const battLed = document.getElementById('battery-led');
    const chargingBolt = document.getElementById('charging-bolt');
    
    const workerUrl = 'https://delicate-silence-d26f.witt3c-event.workers.dev'; 

    try {
        const response = await fetch(`${workerUrl}?t=${Date.now()}`);
        const data = await response.json();
        
        if (data.name) {
            // A. 位置更新
            if (geoText) {
                const parts = data.time.split(' '); 
                const dateNodes = parts[0].split('/'); 
                const mm = dateNodes[1].padStart(2, '0');
                const dd = dateNodes[2].padStart(2, '0');
                const ampm = parts[1].substring(0, 2);
                const hour = parts[1].substring(2).split(':')[0];
                geoText.innerHTML = `${data.name} <div style="font-size: 0.6rem; opacity: 0.4; margin-top: 2px;">更新時間 ${mm}/${dd} ${ampm} ${hour} 點</div>`;
            }
            if (geoLed) {
                geoLed.style.backgroundColor = '#00ff00';
                geoLed.style.boxShadow = '0 0 8px #00ff00';
            }

            // B. 步數更新
            if (stepText) {
                stepText.innerHTML = `${(data.steps || 0).toLocaleString()} <span style="font-size: 0.65rem; opacity: 0.5; display:block;">STEPS</span>`;
            }
            if (stepLed) {
                stepLed.style.backgroundColor = '#f39c12';
                stepLed.style.boxShadow = '0 0 8px #f39c12';
            }

            // C. 電量更新
            if (battText) {
                const level = data.batt || 0;
                const status = data.bs || 0;
                if (battFill) {
                    battFill.style.height = `${level}%`;
                    if (level <= 20) {
                        battFill.style.backgroundColor = '#ff4757';
                        if (battLed) battLed.className = 'status-led led-low-battery';
                    } else if (level <= 50) {
                        battFill.style.backgroundColor = '#f1c40f';
                        if (battLed) battLed.className = 'status-led led-online';
                    } else {
                        battFill.style.backgroundColor = '#2ecc71';
                        if (battLed) battLed.className = 'status-led led-online';
                    }
                }
                const chargingStatus = (status === 2) ? " <span style='color:#f1c40f; font-size:0.7rem; font-weight:bold;'>⚡充電中</span>" : "";
                if (chargingBolt) chargingBolt.style.display = (status === 2) ? 'block' : 'none';
                battText.innerHTML = `${level}%${chargingStatus}`;
            }
        }
    } catch (e) {
        console.error("監控中心數據同步失敗:", e);
        if (geoText) geoText.innerText = "衛星訊號中斷";
    }
}

// --- 4. 第三方串接模組：氣象、Steam、Discord ---
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
                let iconClass = weatherDesc.includes('雨') ? 'fa-cloud-showers-heavy' : (weatherDesc.includes('雲') ? 'fa-cloud-sun' : 'fa-sun');
                const div = document.createElement('div');
                div.className = 'mini-weather-item';
                div.innerHTML = `<span class="mini-city-name">${loc.locationName}</span><span class="mini-city-temp">${temp}°C</span><i class="fas ${iconClass} mini-city-icon"></i>`;
                container.appendChild(div);
            }
        });
    } catch (e) { console.error('天氣更新失敗', e); }
}

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

async function updateDiscordStatus() {
    const SERVER_ID = "1330733636219043961";
    const container = document.getElementById("discord-status");
    if (!container) return;
    const led = container.querySelector(".status-led");
    const text = container.querySelector(".status-text");
    const avatar = document.getElementById("discord-avatar");

    try {
        const response = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json?t=${Date.now()}`);
        const data = await response.json();
        const me = data.members.find(m => m.username === "小維" || m.id === "393579380674134016");

        if (me && me.status === "online") {
            led.className = 'status-led led-online';
            text.innerText = "目前在線";
            if (me.avatar_url) avatar.src = me.avatar_url;
        } else {
            led.className = 'status-led led-offline';
            text.innerText = "目前離線";
        }
    } catch (error) { text.innerText = "連線受阻"; led.className = 'status-led led-offline'; }
}

// --- 5. UI 交互：部落格分類切換與日誌捲動 ---
window.switchBlog = function(type, btnElement = null) {
    if (autoTimer) clearInterval(autoTimer);

    // 1. 按鈕狀態切換
    document.querySelectorAll('.t-btn').forEach(btn => btn.classList.remove('active'));
    let realBtn = (btnElement instanceof HTMLElement) ? btnElement : document.querySelector(`.t-btn[onclick*="'${type}'"]`);
    if (realBtn) realBtn.classList.add('active');

    // 2. 切換文章組別
    document.querySelectorAll('.blog-group').forEach(group => {
        group.classList.remove('active');
        group.style.display = 'none';
    });
    const activeGroup = document.getElementById('group-' + type);
    if (!activeGroup) return;
    activeGroup.classList.add('active');
    activeGroup.style.display = 'flex';

    // 3. 自動輪播邏輯
    const items = activeGroup.querySelectorAll('.sub-item');
    if (items.length === 0) return;
    let currentIndex = 0;
    items.forEach(item => item.classList.remove('active'));
    items[0].classList.add('active');

    autoTimer = setInterval(() => {
        items[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % items.length;
        items[currentIndex].classList.add('active');
    }, 2000); 
};

function startLogRoller() {
    const list = document.getElementById('log-list');
    if (!list) return;
    const items = list.querySelectorAll('.activity-item');
    if (items.length <= 3) return;

    let index = 0;
    const itemHeight = 46; // 38px + 8px gap

    setInterval(() => {
        index++;
        if (index > items.length - 3) index = 0; 
        list.style.transform = `translateY(-${index * itemHeight}px)`;
    }, 3000);
}

// --- 8. 🌟 搞笑圖片後備機制 (防止圖片離家出走) ---
document.addEventListener('DOMContentLoaded', () => {
    // 📢 設定你的搞笑後備圖片路徑
    const runawayImgPath = 'assets/images/img-runaway.png'; 

    // 🕵️‍♂️ 抓取頁面上所有需要監控的圖片 (側邊欄頭貼 + 監控儀表板頭貼)
    const monitorImages = document.querySelectorAll('.avatar-img, .monitor-avatar');

    monitorImages.forEach(img => {
        // 🛑 當圖片載入失敗 (onerror) 時觸發
        img.onerror = function() {
            console.warn(`🛑 報告！圖片 [${this.src.split('/').pop()}] 真的離家出走了...`);
            
            // 1. 替換成搞笑圖
            this.src = runawayImgPath;
            
            // 2. 移除原本的圓形或特定樣式，確保搞笑圖顯示完整 (選填)
            this.style.borderRadius = '8px'; 
            this.style.objectFit = 'contain'; // 確保搞笑圖不被裁切
            this.style.background = 'rgba(255,0,0,0.1)'; // 加一點淡淡的紅色警告背景

            // 3. 修改 alt 說明，增加幽默感
            this.alt = '哇哇！這張圖片離家出走了，可能是去修水管了吧？';
            
            // 4. 如果是 Steam 或 Discord，順便把文字改掉 (選填，更有整體感)
            const parentItem = this.closest('.monitor-item');
            if (parentItem) {
                const statusText = parentItem.querySelector('.status-text');
                if (statusText) statusText.innerText = '圖片去旅行了 🧳';
            }
        };
    });
});