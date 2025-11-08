// ==================== UI基础类 ====================

class StripeHelperUI {
    constructor() {
        this.panel = null;
        this.currentTab = 'fill';
        this.modals = {};
    }

    // 初始化UI
    init() {
        this.createPanel();
        this.attachEventListeners();
        this.renderCurrentTab();
    }

    // 创建主面板
    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'stripe-helper-panel';
        panel.innerHTML = `
            <button class="stripe-helper-toggle">
                💳 Stripe助手
            </button>
            <div class="stripe-helper-content show">
                <div class="stripe-helper-tabs">
                    <button class="stripe-helper-tab active" data-tab="fill">🚀 填表</button>
                    <button class="stripe-helper-tab" data-tab="cards">💳 卡头</button>
                    <button class="stripe-helper-tab" data-tab="profiles">👤 信息</button>
                    <button class="stripe-helper-tab" data-tab="history">📜 历史</button>
                    <button class="stripe-helper-tab" data-tab="settings">⚙️ 设置</button>
                    <button class="stripe-helper-tab" data-tab="about">ℹ️ 关于</button>
                </div>
                <div id="tab-content-fill" class="stripe-helper-tab-content active"></div>
                <div id="tab-content-cards" class="stripe-helper-tab-content"></div>
                <div id="tab-content-profiles" class="stripe-helper-tab-content"></div>
                <div id="tab-content-history" class="stripe-helper-tab-content"></div>
                <div id="tab-content-settings" class="stripe-helper-tab-content"></div>
                <div id="tab-content-about" class="stripe-helper-tab-content"></div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;
    }

    // 附加事件监听器
    attachEventListeners() {
        const toggleBtn = this.panel.querySelector('.stripe-helper-toggle');
        const content = this.panel.querySelector('.stripe-helper-content');

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            content.classList.toggle('show');
        });

        const tabs = this.panel.querySelectorAll('.stripe-helper-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.addEventListener('click', (e) => {
            if (!this.panel.contains(e.target) && content.classList.contains('show')) {
                content.classList.remove('show');
            }
        });
    }

    // 切换Tab
    switchTab(tabName) {
        this.currentTab = tabName;

        this.panel.querySelectorAll('.stripe-helper-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        this.panel.querySelectorAll('.stripe-helper-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-content-${tabName}`);
        });

        this.renderCurrentTab();
    }

    // 渲染当前Tab
    renderCurrentTab() {
        switch(this.currentTab) {
            case 'fill':
                this.renderFillTab();
                break;
            case 'cards':
                this.renderCardsTab();
                break;
            case 'profiles':
                this.renderProfilesTab();
                break;
            case 'history':
                this.renderHistoryTab();
                break;
            case 'settings':
                this.renderSettingsTab();
                break;
            case 'about':
                this.renderAboutTab();
                break;
        }
    }

    // 创建模态框
    createModal({ title, content, onConfirm }) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">${title}</div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    <button class="stripe-btn stripe-btn-secondary modal-cancel">取消</button>
                    <button class="stripe-btn stripe-btn-primary modal-confirm">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const cancelBtn = overlay.querySelector('.modal-cancel');
        const confirmBtn = overlay.querySelector('.modal-confirm');

        const close = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        };

        cancelBtn.addEventListener('click', close);

        confirmBtn.addEventListener('click', () => {
            if (onConfirm()) {
                close();
            }
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
            }
        });

        return {
            show: () => {
                setTimeout(() => overlay.classList.add('show'), 10);
            },
            close
        };
    }
}

