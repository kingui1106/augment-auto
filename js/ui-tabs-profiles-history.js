// ==================== UI标签页渲染 - 配置和历史 ====================

// 渲染信息配置Tab
StripeHelperUI.prototype.renderProfilesTab = async function() {
    const container = document.getElementById('tab-content-profiles');
    const profiles = await DataManager.getProfiles();

    container.innerHTML = `
        <div class="btn-group">
            <button class="stripe-btn stripe-btn-primary" id="btn-add-profile">
                <span>➕</span>
                <span>添加配置</span>
            </button>
        </div>

        <div id="profiles-list">
            ${profiles.length === 0 ?
                '<div class="empty-state"><div class="empty-state-icon">📭</div><div>暂无信息配置</div></div>' :
                profiles.map(profile => `
                    <div class="card-item ${profile.isActive ? 'selected' : ''}" data-id="${profile.id}">
                        <div class="card-item-header">
                            <div class="card-item-title">
                                ${profile.name}
                                ${profile.isActive ? '<span class="badge badge-success">当前使用</span>' : ''}
                            </div>
                        </div>
                        <div class="card-item-info">
                            姓名: ${profile.data.billingName}<br>
                            国家: ${profile.data.billingCountry} | 邮编: ${profile.data.billingPostalCode}<br>
                            地址: ${profile.data.billingAddressLine1}
                        </div>
                        <div class="card-item-actions">
                            ${!profile.isActive ? `<button class="icon-btn" data-action="activate" data-id="${profile.id}">✅ 设为当前</button>` : ''}
                            <button class="icon-btn" data-action="edit" data-id="${profile.id}">✏️ 编辑</button>
                            <button class="icon-btn" data-action="delete" data-id="${profile.id}">🗑️ 删除</button>
                        </div>
                    </div>
                `).join('')
            }
        </div>
    `;

    document.getElementById('btn-add-profile').addEventListener('click', () => {
        this.showProfileModal();
    });

    container.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            switch(action) {
                case 'activate':
                    await DataManager.setActiveProfile(id);
                    this.renderProfilesTab();
                    // 如果填表Tab已打开，也刷新它
                    if (document.getElementById('tab-content-fill')) {
                        this.renderFillTab();
                    }
                    break;
                case 'edit':
                    this.showProfileModal(id);
                    break;
                case 'delete':
                    if (confirm('确定要删除这个配置吗？')) {
                        await DataManager.deleteProfile(id);
                        this.renderProfilesTab();
                    }
                    break;
            }
        });
    });
};

// 显示信息配置模态框
StripeHelperUI.prototype.showProfileModal = async function(editId = null) {
    const isEdit = editId !== null;
    const profiles = await DataManager.getProfiles();
    const profile = isEdit ? profiles.find(p => p.id === editId) : null;
    const data = profile ? profile.data : {};

    const modal = this.createModal({
        title: isEdit ? '编辑信息配置' : '添加信息配置',
        content: `
            <div class="form-group">
                <label class="form-label">配置名称</label>
                <input type="text" class="form-input" id="modal-profile-name" value="${profile ? profile.name : ''}" placeholder="例如：测试账号1">
            </div>
            <div class="divider"></div>
            <div class="form-group">
                <label class="form-label">持卡人姓名</label>
                <input type="text" class="form-input" id="modal-billing-name" value="${data.billingName || ''}" placeholder="张三">
            </div>
            <div class="form-group">
                <label class="form-label">国家代码</label>
                <input type="text" class="form-input" id="modal-billing-country" value="${data.billingCountry || ''}" placeholder="CN / US">
            </div>
            <div class="form-group">
                <label class="form-label">邮政编码</label>
                <input type="text" class="form-input" id="modal-billing-postal" value="${data.billingPostalCode || ''}" placeholder="100000">
            </div>
            <div class="form-group">
                <label class="form-label">省/州</label>
                <input type="text" class="form-input" id="modal-billing-admin" value="${data.billingAdministrativeArea || ''}" placeholder="北京市">
            </div>
            <div class="form-group">
                <label class="form-label">城市</label>
                <input type="text" class="form-input" id="modal-billing-locality" value="${data.billingLocality || ''}" placeholder="北京市">
            </div>
            <div class="form-group">
                <label class="form-label">地区</label>
                <input type="text" class="form-input" id="modal-billing-dependent" value="${data.billingDependentLocality || ''}" placeholder="朝阳区">
            </div>
            <div class="form-group">
                <label class="form-label">详细地址</label>
                <input type="text" class="form-input" id="modal-billing-address" value="${data.billingAddressLine1 || ''}" placeholder="建国路123号">
            </div>
        `,
        onConfirm: async () => {
            const newData = {
                name: document.getElementById('modal-profile-name').value.trim(),
                data: {
                    billingName: document.getElementById('modal-billing-name').value.trim(),
                    billingCountry: document.getElementById('modal-billing-country').value.trim(),
                    billingPostalCode: document.getElementById('modal-billing-postal').value.trim(),
                    billingAdministrativeArea: document.getElementById('modal-billing-admin').value.trim(),
                    billingLocality: document.getElementById('modal-billing-locality').value.trim(),
                    billingDependentLocality: document.getElementById('modal-billing-dependent').value.trim(),
                    billingAddressLine1: document.getElementById('modal-billing-address').value.trim()
                }
            };

            if (!newData.name) {
                alert('请填写配置名称');
                return false;
            }

            if (isEdit) {
                await DataManager.updateProfile(editId, newData);
            } else {
                await DataManager.addProfile(newData);
            }

            this.renderProfilesTab();
            return true;
        }
    });

    modal.show();
};

// 渲染历史Tab
StripeHelperUI.prototype.renderHistoryTab = async function() {
    const container = document.getElementById('tab-content-history');
    const history = await DataManager.getHistory();

    container.innerHTML = `
        <div class="btn-group">
            <button class="stripe-btn stripe-btn-secondary" id="btn-clear-history">
                <span>🗑️</span>
                <span>清空历史</span>
            </button>
        </div>

        <div id="history-list">
            ${history.length === 0 ?
                '<div class="empty-state"><div class="empty-state-icon">📭</div><div>暂无历史记录</div></div>' :
                history.map(record => `
                    <div class="history-item ${record.success ? 'success' : 'error'}">
                        <div class="history-item-header">
                            <span>${record.success ? '✅' : '❌'} ${record.action}</span>
                            <span class="history-item-time">${new Date(record.timestamp).toLocaleString('zh-CN')}</span>
                        </div>
                        ${record.success ? `
                            <div class="history-item-body">
                                配置: ${record.profile}<br>
                                卡头: ${record.cardBin}<br>
                                卡号: ${record.cardNumber}
                            </div>
                        ` : `
                            <div class="history-item-body">
                                错误: ${record.error}
                            </div>
                        `}
                    </div>
                `).join('')
            }
        </div>
    `;

    const clearBtn = document.getElementById('btn-clear-history');
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (confirm('确定要清空所有历史记录吗？')) {
                await DataManager.clearHistory();
                this.renderHistoryTab();
            }
        });
    }
};

