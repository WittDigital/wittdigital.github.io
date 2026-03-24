document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('main-sidebar');
    const grid = document.getElementById('portal-grid');
    const avatarImg = sidebar.querySelector('.avatar-img');

    const startPortalAnimation = () => {
        // 1. 確保初始狀態
        sidebar.classList.add('initial-center');

        setTimeout(() => {
            // 2. 啟動溶解動畫
            sidebar.classList.add('run-dissolve');

            setTimeout(() => {
                // 3. 歸位並切換為橫向模式
                sidebar.classList.remove('initial-center');
                sidebar.classList.add('active-left');
                sidebar.classList.add('run-scan');
                
                // 4. 顯示右側網格
                setTimeout(() => {
                    grid.classList.remove('contents-hidden');
                    grid.classList.add('contents-show');
                }, 1000);
            }, 1200);
        }, 1500);
    };

    // --- 關鍵修正：判斷圖片是否載入完成 ---
    if (avatarImg.complete) {
        // 如果圖片已經從快取讀取完畢
        startPortalAnimation();
    } else {
        // 如果圖片還在下載，監聽 load 事件
        avatarImg.addEventListener('load', () => {
            startPortalAnimation();
        });
        
        // 防止圖片掛掉導致網頁完全不動，設一個保險（3秒後強制啟動）
        setTimeout(startPortalAnimation, 3000);
    }
});