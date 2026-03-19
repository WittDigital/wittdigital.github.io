/**
 * 維特 Discord Bot 專用腳本
 * 整合：捲動動畫、導覽列效果、人工延遲偵測系統
 */

// --- 1. 捲動顯現動畫 ---
function reveal() {
    const reveals = document.querySelectorAll(".reveal");
    for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 100;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}

// --- 2. 導覽列捲動效果 ---
function handleNavbarScroll() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    if (window.scrollY > 50) {
        navbar.style.padding = "1rem 5%";
        navbar.style.background = "rgba(5, 5, 5, 0.8)";
    } else {
        navbar.style.padding = "1.5rem 5%";
        navbar.style.background = "rgba(5, 5, 5, 0.5)";
    }
}

// --- 3. Bot 狀態偵測功能 (含人工延遲與動態效果) ---
async function updateBotStatus() {
    const SERVER_ID = '1330733636219043961';
    const TARGET_BOT_NAME = '維特witt 助手'; 
    
    const badge = document.getElementById('bot-status-badge');
    if (!badge) return;
    const statusText = badge.querySelector('.status-text');

    // [啟動動態效果]：進入偵測狀態
    badge.classList.remove('online', 'offline');
    statusText.innerHTML = '連線偵測中<span class="loading-dots"></span>';
    statusText.classList.add('detecting');

    try {
        // [人工延遲]：API 抓取與 2.5 秒延遲同時並行
        const [response] = await Promise.all([
            fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json?t=${Date.now()}`),
            new Promise(resolve => setTimeout(resolve, 2500)) 
        ]);

        const data = await response.json();
        const bot = data.members.find(m => m.username === TARGET_BOT_NAME);

        // 結束偵測狀態
        statusText.classList.remove('detecting');

        if (bot && bot.status !== 'offline') {
            badge.classList.add('online');
            statusText.innerText = '系統運作中';
        } else {
            badge.classList.add('offline');
            statusText.innerText = '服務離線中';
        }
    } catch (error) {
        console.error("偵測出錯:", error);
        statusText.classList.remove('detecting');
        statusText.innerText = '連線超時';
        badge.classList.add('offline');
    }
}

// --- 4. 事件啟動 ---
window.addEventListener("scroll", reveal);
window.addEventListener("scroll", handleNavbarScroll);

window.addEventListener('load', () => {
    reveal();
    handleNavbarScroll();
    
    // 立即啟動偵測
    updateBotStatus();
    // 每 60 秒循環一次 (循環時也會有等待效果)
    setInterval(updateBotStatus, 60000); 
});
