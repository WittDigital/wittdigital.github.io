document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('main-sidebar');
    const grid = document.getElementById('portal-grid');
    const bioText = document.getElementById('bio-text');

    if (sidebar && grid) {
        setTimeout(() => {
            // 1. Logo 往左移動
            sidebar.classList.remove('initial-center');
            sidebar.classList.add('active-left');

            setTimeout(() => {
                // 2. 自我介紹與網格同時浮現，但給個微小落差感
                bioText.classList.remove('contents-hidden');
                bioText.classList.add('contents-show');
                
                setTimeout(() => {
                    grid.classList.remove('contents-hidden');
                    grid.classList.add('contents-show');
                }, 200);
            }, 800);
        }, 1000);
    }
});