/**
 * 維特 Discord Bot 專用腳本
 * 包含：捲動動畫、導覽列變色、Bot 狀態人工延遲偵測
 */

// --- 1. 捲動顯現動畫 (Scroll Reveal) ---
function reveal() {
    const reveals = document.querySelectorAll(".reveal");

    for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 100; // 捲動到元素上方 100px 時觸發

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}

// --- 2. 導覽列捲動效果 (Navbar Scroll) ---
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

// --- 3. Bot 狀態偵測功能 (含人工延遲與動態點點) ---
async function updateBotStatus() {
    const SERVER_ID = '1330733636219043961';
    const TARGET_BOT_NAME = '維特witt 助手'; 
    
    const badge = document.getElementById('bot-status-badge');
    if (!badge) return;
    const statusText = badge.querySelector('.status-text');

    // 進入偵測狀態：清除顏色類別，加入閃爍與點點動畫
    badge.classList.remove('online', 'offline');
    statusText.innerHTML = '連線偵測中<span class="loading-dots"></span>';
    statusText.style.opacity = "0.7"; // 稍微變淡表示處理中

    try {
        // 同時啟動 API 抓取與「2.5秒人工延遲」，讓使用者感覺系統在認真判定
        const [response] = await Promise.all([
            fetch(`https://discord.com/api/guilds/${SERVER_ID}/widget.json?t=${Date.now()}`),
            new Promise(resolve => setTimeout(resolve, 2500)) 
        ]);

        const data = await response.json();
        const bot = data.members.find(m => m.username === TARGET_BOT_NAME);

        // 判定完成，恢復正常顯示
        statusText.style.opacity = "1";

        if (bot && bot.status !== 'offline') {
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
        statusText.innerText = '連線超時';
        badge.classList.add('offline');
    }
}

// --- 4. 事件監聽與啟動 ---

// 監聽捲動事件
window.addEventListener("scroll", reveal);
window.addEventListener("scroll", handleNavbarScroll);

// 頁面完全載入後執行一次
window.addEventListener('load', () => {
    // 觸發初始動畫
    reveal();
    handleNavbarScroll();
    
    // 啟動 Bot 偵測 (立即執行一次，隨後每 60 秒檢查一次)
    updateBotStatus();
    setInterval(updateBotStatus, 60000); 
});

// --- 指令過濾邏輯 (僅當在 commands.html 時執行) ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // 切換按鈕樣式
        document.querySelector('.filter-btn.active').classList.remove('active');
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        const cards = document.querySelectorAll('.command-card');

        cards.forEach(card => {
            if (filter === 'all' || card.classList.contains(filter)) {
                card.style.display = 'flex';
                // 重新觸發 reveal 動畫效果
                setTimeout(() => card.style.opacity = '1', 10);
            } else {
                card.style.display = 'none';
                card.style.opacity = '0';
            }
        });
    });
});

// 等待 DOM 載入完成
document.addEventListener('DOMContentLoaded', () => {
    
    // 建立觀察器
    const observerOptions = {
        threshold: 0.15 // 當元件出現 15% 時觸發
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // 觸發後就停止觀察，避免重複動畫
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 尋找所有需要動畫的元件
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => revealObserver.observe(el));
});
