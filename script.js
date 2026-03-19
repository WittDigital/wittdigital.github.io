// Scroll reveal animation
function reveal() {
    var reveals = document.querySelectorAll(".reveal");

    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 100;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}

window.addEventListener("scroll", reveal);
// Trigger once on load
reveal();

// Navbar scroll effect
window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 50) {
        navbar.style.padding = "1rem 5%";
        navbar.style.background = "rgba(5, 5, 5, 0.8)";
    } else {
        navbar.style.padding = "1.5rem 5%";
        navbar.style.background = "rgba(5, 5, 5, 0.5)";
    }
});

// Bot 狀態偵測功能
async function updateBotStatus() {
    const SERVER_ID = '1330733636219043961';
    const TARGET_BOT_NAME = '維特witt 助手'; 
    
    const badge = document.getElementById('bot-status-badge');
    if (!badge) return;
    const statusText = badge.querySelector('.status-text');

    try {
        const response = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json?t=${Date.now()}`);
        const data = await response.json();
        const bot = data.members.find(m => m.username === TARGET_BOT_NAME);

        if (bot) {
            badge.classList.add('online');
            badge.classList.remove('offline');
            statusText.innerText = '系統運作中';
        } else {
            badge.classList.add('offline');
            badge.classList.remove('online');
            statusText.innerText = '服務離線中';
        }
    } catch (error) {
        console.error("Bot Status Error:", error);
    }
}

// 修改你原本的 window.onload，加入啟動偵測
window.addEventListener('load', () => {
    // 執行原本的 reveal 動畫 (如果你原本有寫的話)
    if (typeof reveal === 'function') reveal();
    
    // 啟動 Bot 偵測
    updateBotStatus();
    setInterval(updateBotStatus, 30000); // 每 30 秒自動更新一次
});
