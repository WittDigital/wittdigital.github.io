/* =========================================
   Witt3c Portal - 數位掃描動畫控制
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('main-sidebar');
    const grid = document.getElementById('portal-grid');
    const bioText = document.getElementById('bio-text');

    if (sidebar && grid) {
        setTimeout(() => {
            // =========================================
            // ✅ 新增：觸發中央 Logo 的「溶解消失」動畫
            // =========================================
            sidebar.classList.add('run-dissolve');

            // 稍等 0.2 秒（讓中央 Logo 開始溶解），同時觸發左側欄的「歸位與掃描」
            setTimeout(() => {
                // 1. 歸位到左側（這步很快，使用者看不出來，因為 opacity 還是 0）
                sidebar.classList.remove('initial-center');
                sidebar.classList.add('active-left');
                
                // 2. 觸發左側欄的「數位掃描顯現」
                sidebar.classList.add('run-scan');
                
                // 3. 同步觸發自我介紹文字的浮現
                bioText.classList.add('run-scan-text');

                // 待掃描過渡完成後，顯示右側網格
                setTimeout(() => {
                    grid.classList.remove('contents-hidden');
                    grid.classList.add('contents-show');
                }, 1500); // 掃描動畫進行 1.5 秒後顯示右側

            }, 200); // 中央 Logo 溶解後 0.2 秒觸發左側欄掃描
            
        }, 1000); // 系統啟動 1 秒延遲
    }
});