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
    const API_KEY = 'CWA-D54F73C4-001F-4F3B-88D9-BAA24CB1DD47';
    const targetUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${API_KEY}`;
    
    // 🌟 使用 allOrigins 代理伺服器
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        const json = await response.json();
        
        // 注意：allOrigins 會把原始資料放在 json.contents 裡面，且是字串格式
        const data = JSON.parse(json.contents);
        const locations = data.records.location;

        const container = document.getElementById('weather-grid-container');
        container.innerHTML = ''; 

        locations.forEach(loc => {
            const cityName = loc.locationName;
            const weatherDesc = loc.weatherElement[0].time[0].parameter.parameterName;
            const minTemp = loc.weatherElement[2].time[0].parameter.parameterName;
            const maxTemp = loc.weatherElement[4].time[0].parameter.parameterName;
            
            let iconClass = 'fas fa-sun';
            if (weatherDesc.includes('雨')) iconClass = 'fas fa-cloud-showers-heavy';
            else if (weatherDesc.includes('雲')) iconClass = 'fas fa-cloud-sun';

            const card = document.createElement('div');
            card.className = 'portal-card weather-item';
            card.innerHTML = `
                <i class="${iconClass}"></i>
                <div class="weather-info">
                    <div class="city-name">${cityName}</div>
                    <div class="city-desc">${weatherDesc}</div>
                    <div class="city-temp">${minTemp}° ~ ${maxTemp}°C</div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('全台天氣讀取失敗', error);
        document.getElementById('weather-grid-container').innerHTML = '設備連線中斷，請稍後再試。';
    }
}