/* =========================================
   Witt3c Portal - 核心動畫控制
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('main-header');
    const grid = document.getElementById('portal-grid');
    const bioText = document.getElementById('bio-text');

    setTimeout(() => {
        // 1. Logo 往左移動歸位
        sidebar.classList.remove('initial-center');
        sidebar.classList.add('active-left');

        setTimeout(() => {
            // 2. 自我介紹文字浮現
            bioText.classList.remove('contents-hidden');
            bioText.classList.add('contents-show');
            
            // 3. 右側網格卡片浮現
            setTimeout(() => {
                grid.classList.remove('contents-hidden');
                grid.classList.add('contents-show');
            }, 300);
        }, 800);
    }, 1000);
});

