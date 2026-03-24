document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('main-sidebar');
    const grid = document.getElementById('portal-grid');
    const avatarImg = sidebar.querySelector('.avatar-img');

    const startPortalAnimation = () => {
        // 1. 確保初始狀態：Logo 出現在中央
        sidebar.classList.add('initial-center');

        // 第一階段：Logo 在中央停留 2.5 秒 (2500ms)
        setTimeout(() => {
            // 2. 啟動溶解動畫：Logo 開始變模糊並淡出
            sidebar.classList.add('run-dissolve');

            // ⚠️ 關鍵修正：給溶解動畫一點呼吸時間 (1秒)
            setTimeout(() => {
                // 3. 歸位：移除中央狀態，切換至左側
                sidebar.classList.remove('initial-center');
                sidebar.classList.remove('run-dissolve'); // 移除溶解，準備在左側顯現
                
                sidebar.classList.add('active-left');
                sidebar.classList.add('run-scan');
                
                // 4. 顯示右側網格：再等一下下才讓右邊出來，視覺才不會亂
                setTimeout(() => {
                    grid.classList.remove('contents-hidden');
                    grid.classList.add('contents-show');

                    fetchAllWeather();
                    fetchSteamStatus();
                }, 800); 
                
            }, 1000); // 這裡控制 Logo 溶解多久後「瞬移」到左邊
        }, 2500); // 你要求的 2.5 秒停留
    };

    // 圖片載入監聽 (保持原樣)
    if (avatarImg.complete) {
        startPortalAnimation();
    } else {
        avatarImg.addEventListener('load', startPortalAnimation);
        setTimeout(startPortalAnimation, 4000); // 保險時間拉長一點
    }
});



async function fetchAllWeather() {
    const url = './weather.json'; 
    const container = document.getElementById('weather-mini-grid');
    if (!container) return;

    // 🌟 定義你要顯示的縣市順序
    const targetCities = ['臺北市', '桃園市', '臺中市', '嘉義市', '臺南市', '高雄市', '臺東縣', '花蓮縣'];

    try {
        const response = await fetch(url);
        const data = await response.json();
        const allLocations = data.records.location;

        container.innerHTML = ''; 

        // 依照我們定義的 targetCities 順序來渲染
        targetCities.forEach(target => {
            const loc = allLocations.find(l => l.locationName === target);
            if (loc) {
                const cityName = loc.locationName;
                const weatherDesc = loc.weatherElement[0].time[0].parameter.parameterName;
                const temp = loc.weatherElement[2].time[0].parameter.parameterName;
                
                let iconClass = 'fa-sun';
                if (weatherDesc.includes('雨')) iconClass = 'fa-cloud-showers-heavy';
                else if (weatherDesc.includes('雲')) iconClass = 'fa-cloud-sun';

                const div = document.createElement('div');
                div.className = 'mini-weather-item';
                div.innerHTML = `
                    <span class="mini-city-name">${cityName}</span>
                    <span class="mini-city-temp">${temp}°C</span>
                    <i class="fas ${iconClass} mini-city-icon"></i>
                `;
                container.appendChild(div);
            }
        });
    } catch (e) {
        console.error('天氣更新失敗', e);
    }
}




async function fetchSteamStatus() {
    const steamUrl = './steam_status.json'; 
    const avatarImg = document.getElementById('steam-avatar');
    const statusLed = document.getElementById('steam-led');
    const statusText = document.getElementById('steam-text');

    if (!avatarImg || !statusLed || !statusText) return;

    try {
        // 加上時間戳防止瀏覽器快取舊資料
        const response = await fetch(`${steamUrl}?t=${new Date().getTime()}`);
        const data = await response.json();
        const player = data.response.players[0];

        // 1. 更新頭像
        avatarImg.src = player.avatarfull;

        // 2. 判斷狀態與顯示文字
        // personastate: 0:離線, 1:線上, 2:忙碌, 3:離開...
        if (player.personastate > 0) {
            statusLed.className = 'status-led led-online';
            
            // 如果正在遊戲中，會多出 gameextrainfo 欄位
            if (player.gameextrainfo) {
                statusText.innerText = `🎮 ${player.gameextrainfo}`;
            } else {
                statusText.innerText = "線上";
            }
        } else {
            statusLed.className = 'status-led led-offline';
            statusText.innerText = "離線";
        }
    } catch (e) {
        console.log("Steam 數據尚未就緒或讀取失敗");
    }
}

// 記得在頁面讀取時執行它
document.addEventListener('DOMContentLoaded', () => {
    fetchSteamStatus();
    // 每 30 秒自動刷新一次網頁上的顯示內容
    setInterval(fetchSteamStatus, 30000); 
});




async function updateDiscordStatus() {
    const SERVER_ID = "1330733636219043961";
    const TARGET_NAME = "小維"; // 這是你在 Widget 上的名稱
    
    const container = document.getElementById("discord-status");
    if (!container) return;
    
    const statusLed = container.querySelector(".status-led");
    const statusText = container.querySelector(".status-text");
    const avatarImg = document.getElementById("discord-avatar");

    // 🌟 1. 啟動「偵測中」儀式感
    statusLed.className = 'status-led'; // 移除所有燈號顏色
    statusText.innerHTML = '連線偵測中<span class="loading-dots"></span>';
    statusText.style.opacity = "0.7";

    try {
        // 🌟 2. 執行你的 2.5 秒人工延遲（讓使用者覺得系統在努力穿透防火牆）
        const [response] = await Promise.all([
            fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json?t=${Date.now()}`),
            new Promise(resolve => setTimeout(resolve, 2500))
        ]);

        const data = await response.json();
        // 在成員清單中撈出「小維」
        const me = data.members.find(m => m.username === TARGET_NAME || m.id === "2");

        statusText.style.opacity = "1";

        // 🌟 3. 判定結果並亮燈
        if (me && me.status === "online") {
            statusLed.className = 'status-led led-online'; // 綠色跳動燈
            statusText.innerText = "目前在線";
            // 如果 Widget 有提供個人頭像，就同步更新
            if (me.avatar_url) avatarImg.src = me.avatar_url;
        } else {
            statusLed.className = 'status-led led-offline'; // 灰色靜止燈
            statusText.innerText = "目前離線";
        }
    } catch (error) {
        console.error("Discord Widget Error:", error);
        statusText.innerText = "連線超時";
        statusLed.className = 'status-led led-offline';
    }
}

// 頁面加載後啟動，並每 5 分鐘巡邏一次
document.addEventListener('DOMContentLoaded', () => {
    updateDiscordStatus();
    setInterval(updateDiscordStatus, 300000); 
});