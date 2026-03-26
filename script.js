document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('main-sidebar');
    const grid = document.getElementById('portal-grid');
    const avatarImg = sidebar.querySelector('.avatar-img');

    // --- 1. 開場門戶動畫邏輯 ---
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
                
                // 第三階段：顯示右側網格並啟動數據抓取
                setTimeout(() => {
                    grid.classList.remove('contents-hidden');
                    grid.classList.add('contents-show');

                    // 🌟 啟動所有監控數據
                    fetchAllWeather();
                    fetchSteamStatus();
                    updateDiscordStatus(); 
                    updateLiveLocation();
                    
                    // 🌟 自動啟動部落格第一組輪播
                    switchBlog('tech'); 
                    startLogRoller();
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

    // 設定定時刷新任務 (每 5 分鐘)
    setInterval(() => {
        fetchSteamStatus();
        updateDiscordStatus();
        updateLiveLocation(); 
    }, 300000);
});

// --- 2. 📍 全能監控中心：位置 + 步數 + 電量 (OwnTracks + Google Fit) ---
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
                const formattedTime = `${mm}/${dd} ${ampm} ${hour} 點`;

                geoText.innerHTML = `${data.name} <div style="font-size: 0.6rem; opacity: 0.4; margin-top: 2px;">更新時間 ${formattedTime}</div>`;
            }
            if (geoLed) {
                geoLed.style.backgroundColor = '#00ff00';
                geoLed.style.boxShadow = '0 0 8px #00ff00';
            }

            // B. 步數更新
            if (stepText) {
                const stepCount = (data.steps || 0).toLocaleString();
                stepText.innerHTML = `${stepCount} <span style="font-size: 0.65rem; opacity: 0.5; display:block;">STEPS</span>`;
            }
            if (stepLed) {
                stepLed.style.backgroundColor = '#f39c12';
                stepLed.style.boxShadow = '0 0 8px #f39c12';
            }

            // C. 手機電量更新
            if (battText) {
                const level = (data.batt !== undefined) ? data.batt : 0;
                const status = (data.bs !== undefined) ? data.bs : 0;

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

                let statusSuffix = "";
                if (status === 2) {
                    statusSuffix = " <span style='color:#f1c40f; font-size:0.7rem; font-weight:bold;'>⚡充電中</span>";
                    if (chargingBolt) chargingBolt.style.display = 'block';
                } else {
                    if (chargingBolt) chargingBolt.style.display = 'none';
                }
                battText.innerHTML = `${level}%${statusSuffix}`;
            }
        }
    } catch (error) {
        console.error("監控中心數據同步失敗:", error);
        if (geoText) geoText.innerText = "衛星訊號中斷";
    }
}

// --- 3. 氣象串接 ---
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
                div.innerHTML = `<span class="mini-city-name">${loc.locationName}</span><span class="mini-city-temp">${temp}°C</span><i class="fas ${iconClass} mini-city-icon"></i>`;
                container.appendChild(div);
            }
        });
    } catch (e) { console.error('天氣更新失敗', e); }
}

// --- 4. Steam 狀態 ---
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

// --- 5. Discord 偵測 ---
async function updateDiscordStatus() {
    const SERVER_ID = "1330733636219043961";
    const TARGET_NAME = "小維"; 
    const container = document.getElementById("discord-status");
    if (!container) return;
    const led = container.querySelector(".status-led");
    const text = container.querySelector(".status-text");
    const avatar = document.getElementById("discord-avatar");

    try {
        const response = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json?t=${Date.now()}`);
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


// --- 6. 🌟 三位一體：分類切換與自動文章輪播 ---
let autoTimer; 

// 顯式掛載到 window，確保 HTML 的 onclick 絕對找得到它
window.switchBlog = function(type, btnElement = null) {
    if (autoTimer) clearInterval(autoTimer);

    // 1. 處理按鈕狀態切換
    document.querySelectorAll('.t-btn').forEach(btn => btn.classList.remove('active'));
    
    // 如果傳入的是 event 而不是元素，這裡做個轉向處理
    let realBtn = (btnElement instanceof HTMLElement) ? btnElement : null;
    
    // 如果沒有抓到實體按鈕，則根據 type 搜尋
    if (!realBtn) {
        realBtn = document.querySelector(`.t-btn[onclick*="'${type}'"]`);
    }
    
    if (realBtn) realBtn.classList.add('active');

    // 2. 切換文章組別
    document.querySelectorAll('.blog-group').forEach(group => {
        group.classList.remove('active');
        group.style.display = 'none'; // 確保徹底隱藏
    });

    const activeGroup = document.getElementById('group-' + type);
    if (!activeGroup) return;
    
    activeGroup.classList.add('active');
    activeGroup.style.display = 'flex'; // 確保顯示

    // 3. 重置輪播
    const items = activeGroup.querySelectorAll('.sub-item');
    if (items.length === 0) return;

    let currentIndex = 0;
    items.forEach(item => item.classList.remove('active'));
    items[0].classList.add('active');

    // 4. 重新啟動定時器
    autoTimer = setInterval(() => {
        items[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % items.length;
        items[currentIndex].classList.add('active');
    }, 2000); 
};

// --- 7. 🌟 實時日誌：自動垂直滾動輪播 ---
function startLogRoller() {
    const list = document.getElementById('log-list');
    if (!list) {
        console.warn("Log滾動失敗：找不到 #log-list 元素");
        return;
    }

    const items = list.querySelectorAll('.activity-item');
    console.log("偵測到日誌條數：", items.length); // 除錯用，確認有沒有抓到資料

    // 如果項目不足以填滿視窗（視窗顯示3條），則不啟動滾動
    if (items.length <= 3) return; 

    let index = 0;
    const itemHeight = 46; // 38px(height) + 8px(gap)

    setInterval(() => {
        index++;
        
        // 修正循環邏輯：
        // 假設有 5 條，顯示 3 條，index 最大應為 2 (5-3)
        if (index > items.length - 3) { 
            index = 0; 
        }

        const offset = index * itemHeight;
        list.style.transform = `translateY(-${offset}px)`;
    }, 3500); // 稍微加長一點時間，讓用戶閱讀
}