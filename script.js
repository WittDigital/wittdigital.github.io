document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('main-sidebar');
    const grid = document.getElementById('portal-grid');

    if (sidebar && grid) {
        setTimeout(() => {
            // 1. 中間 Logo 溶解消失
            sidebar.classList.add('run-dissolve');

            setTimeout(() => {
                // 2. 移除中間狀態，切換到左側
                sidebar.classList.remove('initial-center');
                sidebar.classList.add('active-left');
                
                // 3. 觸發掃描動畫（這時 CSS 會讓 bio-details 自動浮現）
                sidebar.classList.add('run-scan');

                setTimeout(() => {
                    grid.classList.remove('contents-hidden');
                    grid.classList.add('contents-show');
                }, 1000);
            }, 800); 
        }, 1000);
    }
});