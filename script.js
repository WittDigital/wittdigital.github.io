document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('main-sidebar');
    const grid = document.getElementById('portal-grid');

    if (sidebar && grid) {
        // 1. 強制讓 sidebar 處於初始狀態 (如果 HTML 沒寫的話)
        sidebar.classList.add('initial-center');

        setTimeout(() => {
            // 2. 啟動溶解動畫
            sidebar.classList.add('run-dissolve');

            setTimeout(() => {
                // 3. 歸位並切換為橫向模式 (重要：移除 initial-center)
                sidebar.classList.remove('initial-center');
                sidebar.classList.add('active-left');
                sidebar.classList.add('run-scan');
                
                // 4. 顯示右側網格
                setTimeout(() => {
                    grid.classList.remove('contents-hidden');
                    grid.classList.add('contents-show');
                }, 1000);
            }, 800); // 溶解時間縮短，讓節奏更順
        }, 500); 
    }
});