// ==================== UI标签页渲染 - 填表和卡头 ====================

// 渲染填表Tab
StripeHelperUI.prototype.renderFillTab = async function() {
    const container = document.getElementById('tab-content-fill');
    const activeProfile = await DataManager.getActiveProfile();
    const enabledBins = await DataManager.getEnabledCardBins();

    if (!activeProfile) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div>请先在"信息"标签页中添加并选择一个配置</div>
            </div>
        `;
        return;
    }

    // 检查是否已有保存的邮箱
    const savedEmail = await DataManager.storage.getValue('register_email');
    const hasEmail = !!savedEmail;

    container.innerHTML = `
        <div id="fill-status"></div>
        <div id="register-email-display" style="display: ${hasEmail ? 'block' : 'none'}; margin-bottom: 10px; padding: 10px; background: #f0f9ff; border-radius: 6px; border-left: 3px solid #3b82f6;">
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">当前邮箱:</div>
            <div id="register-email-text" style="font-size: 14px; font-weight: 500; color: #1e40af; word-break: break-all;">${savedEmail || ''}</div>
        </div>

        <div class="btn-group">
            <button class="stripe-btn stripe-btn-primary" id="btn-auto-fill">
                <span>🚀</span>
                <span>填表+提交</span>
            </button>
        </div>

        <div class="btn-group">
            <button class="stripe-btn stripe-btn-secondary" id="btn-fill-only">
                <span>📝</span>
                <span>仅填表</span>
            </button>
            <button class="stripe-btn stripe-btn-secondary" id="btn-clear">
                <span>🧹</span>
                <span>清空表单</span>
            </button>
        </div>

        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">🤖 注册辅助</div>
            <div class="btn-group">
                <button class="stripe-btn stripe-btn-secondary" id="btn-generate-email">
                    <span>📧</span>
                    <span>生成邮箱</span>
                </button>
                <button class="stripe-btn stripe-btn-secondary" id="btn-start-register" ${hasEmail ? '' : 'disabled'} style="opacity: ${hasEmail ? '1' : '0.5'};">
                    <span>📝</span>
                    <span>开始注册</span>
                </button>
            </div>
            <div class="btn-group">
                <button class="stripe-btn stripe-btn-secondary" id="btn-get-code" ${hasEmail ? '' : 'disabled'} style="opacity: ${hasEmail ? '1' : '0.5'};">
                    <span>🔑</span>
                    <span>获取验证码</span>
                </button>
                <button class="stripe-btn stripe-btn-secondary" id="btn-click-continue">
                    <span>➡️</span>
                    <span>点击 Continue</span>
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-auto-fill').addEventListener('click', () => {
        this.handleAutoFill(true);
    });

    document.getElementById('btn-fill-only').addEventListener('click', () => {
        this.handleAutoFill(false);
    });

    document.getElementById('btn-clear').addEventListener('click', () => {
        this.handleClearForm();
    });

    // 注册辅助功能按钮
    document.getElementById('btn-generate-email').addEventListener('click', () => {
        this.handleGenerateEmail();
    });

    document.getElementById('btn-start-register').addEventListener('click', () => {
        this.handleStartRegister();
    });

    document.getElementById('btn-get-code').addEventListener('click', () => {
        this.handleGetVerificationCode();
    });

    document.getElementById('btn-click-continue').addEventListener('click', () => {
        this.handleClickContinue();
    });
};

// 处理自动填表
StripeHelperUI.prototype.handleAutoFill = async function(autoSubmit) {
    const statusDiv = document.getElementById('fill-status');

    try {
        statusDiv.innerHTML = '<div class="status-message status-info">⏳ 正在填写表单...</div>';

        // 获取当前激活的配置
        const profile = await DataManager.getActiveProfile();
        if (!profile) {
            throw new Error('未找到当前使用的配置，请先在"信息"标签页中选择一个配置');
        }

        // 随机选择卡头
        const selectedBin = await getRandomCardBin();
        if (!selectedBin) {
            throw new Error('未找到可用的卡头，请检查卡头配置');
        }

        const cardNumber = generateLuhnCardNumber(selectedBin.prefix, selectedBin.totalLength);
        const expiryMonth = generateRandomMonth();
        const expiryYear = generateRandomYear();
        const cvc = generateRandomCVC(selectedBin.cvcLength);
        const expiry = `${expiryMonth}/${expiryYear}`;

        reliableFillForm(profile.data, cardNumber, expiry, cvc, selectedBin.name, autoSubmit);

        await DataManager.addHistory({
            action: autoSubmit ? '自动填表+提交' : '仅填表',
            profile: profile.name,
            cardBin: selectedBin.name,
            cardNumber: cardNumber.slice(0, 6) + '******' + cardNumber.slice(-4),
            success: true
        });

        statusDiv.innerHTML = `
            <div class="status-message status-success">
                ✅ 填表成功！<br>
                <small>配置: ${profile.name} | 卡号: ${cardNumber.slice(0, 6)}******${cardNumber.slice(-4)} | 类型: ${selectedBin.name}</small>
            </div>
        `;

        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);

    } catch (error) {
        console.error('填表失败:', error);
        statusDiv.innerHTML = `<div class="status-message status-error">❌ ${error.message}</div>`;

        await DataManager.addHistory({
            action: autoSubmit ? '自动填表+提交' : '仅填表',
            error: error.message,
            success: false
        });
    }
};

// 处理清空表单
StripeHelperUI.prototype.handleClearForm = function() {
    const statusDiv = document.getElementById('fill-status');
    statusDiv.innerHTML = '<div class="status-message status-info">🧹 表单已清空</div>';
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 2000);
};

// 渲染卡头Tab
StripeHelperUI.prototype.renderCardsTab = async function() {
    const container = document.getElementById('tab-content-cards');
    const cardBins = await DataManager.getCardBins();

    container.innerHTML = `
        <div class="btn-group">
            <button class="stripe-btn stripe-btn-primary" id="btn-add-card">
                <span>➕</span>
                <span>添加卡头</span>
            </button>
        </div>

        <div id="cards-list">
            ${cardBins.length === 0 ?
                '<div class="empty-state"><div class="empty-state-icon">📭</div><div>暂无卡头配置</div></div>' :
                cardBins.map(bin => `
                    <div class="card-item ${bin.enabled ? 'selected' : ''}" data-id="${bin.id}">
                        <div class="card-item-header">
                            <div class="card-item-title">${bin.name}</div>
                            <div>
                                ${bin.enabled ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-secondary">禁用</span>'}
                            </div>
                        </div>
                        <div class="card-item-info">
                            卡号前缀: ${bin.prefix}<br>
                            总长度: ${bin.totalLength} 位 | CVC: ${bin.cvcLength} 位
                        </div>
                        <div class="card-item-actions">
                            <button class="icon-btn" data-action="toggle" data-id="${bin.id}">
                                ${bin.enabled ? '🔒 禁用' : '✅ 启用'}
                            </button>
                            <button class="icon-btn" data-action="edit" data-id="${bin.id}">✏️ 编辑</button>
                            <button class="icon-btn" data-action="delete" data-id="${bin.id}">🗑️ 删除</button>
                        </div>
                    </div>
                `).join('')
            }
        </div>
    `;

    document.getElementById('btn-add-card').addEventListener('click', () => {
        this.showCardModal();
    });

    container.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            switch(action) {
                case 'toggle':
                    const bins = await DataManager.getCardBins();
                    const bin = bins.find(b => b.id === id);
                    await DataManager.updateCardBin(id, { enabled: !bin.enabled });
                    this.renderCardsTab();
                    break;
                case 'edit':
                    this.showCardModal(id);
                    break;
                case 'delete':
                    if (confirm('确定要删除这个卡头吗？')) {
                        await DataManager.deleteCardBin(id);
                        this.renderCardsTab();
                    }
                    break;
            }
        });
    });
};

// ==================== 注册辅助功能处理函数 ====================

// 生成邮箱
StripeHelperUI.prototype.handleGenerateEmail = async function() {
    const statusDiv = document.getElementById('fill-status');
    const emailDisplay = document.getElementById('register-email-display');
    const emailText = document.getElementById('register-email-text');
    const btnStartRegister = document.getElementById('btn-start-register');
    const btnGetCode = document.getElementById('btn-get-code');

    try {
        statusDiv.innerHTML = '<div class="status-message status-info">⏳ 正在生成邮箱...</div>';

        const email = await RegisterHelper.generateRandomEmail();

        // 保存邮箱到存储
        await DataManager.storage.setValue('register_email', email);

        // 保存到历史记录
        await DataManager.addHistory({
            action: '生成邮箱',
            email: email,
            success: true
        });

        // 显示邮箱
        emailText.textContent = email;
        emailDisplay.style.display = 'block';

        // 启用注册和获取验证码按钮
        btnStartRegister.disabled = false;
        btnStartRegister.style.opacity = '1';
        btnGetCode.disabled = false;
        btnGetCode.style.opacity = '1';

        statusDiv.innerHTML = '<div class="status-message status-success">✅ 邮箱生成成功！</div>';
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 2000);

    } catch (error) {
        console.error('[Register Helper] 生成邮箱失败:', error);
        statusDiv.innerHTML = `<div class="status-message status-error">❌ 生成邮箱失败: ${error.message}</div>`;

        // 保存失败记录到历史
        await DataManager.addHistory({
            action: '生成邮箱',
            error: error.message,
            success: false
        });
    }
};

// 开始注册
StripeHelperUI.prototype.handleStartRegister = async function() {
    const statusDiv = document.getElementById('fill-status');

    try {
        // 获取保存的邮箱
        const email = await DataManager.storage.getValue('register_email');

        if (!email) {
            statusDiv.innerHTML = '<div class="status-message status-error">❌ 请先生成邮箱</div>';
            return;
        }

        // 状态回调函数
        const updateStatus = (message, type) => {
            const typeClass = type === 'success' ? 'status-success' :
                            type === 'error' ? 'status-error' :
                            type === 'warning' ? 'status-warning' : 'status-info';
            statusDiv.innerHTML = `<div class="status-message ${typeClass}">${message}</div>`;
        };

        await RegisterHelper.startRegister(email, updateStatus);

        // 保存到历史记录
        await DataManager.addHistory({
            action: '开始注册',
            email: email,
            success: true
        });

        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);

    } catch (error) {
        console.error('[Register Helper] 开始注册失败:', error);
        statusDiv.innerHTML = `<div class="status-message status-error">❌ 注册失败: ${error.message}</div>`;

        // 保存失败记录到历史
        await DataManager.addHistory({
            action: '开始注册',
            error: error.message,
            success: false
        });
    }
};

// 获取验证码
StripeHelperUI.prototype.handleGetVerificationCode = async function() {
    const statusDiv = document.getElementById('fill-status');

    try {
        // 获取保存的邮箱
        const email = await DataManager.storage.getValue('register_email');

        if (!email) {
            throw new Error('请先生成邮箱');
        }

        statusDiv.innerHTML = '<div class="status-message status-info">⏳ 正在获取验证码...</div>';

        const code = await RegisterHelper.getAndFillVerificationCode(email);

        // 保存到历史记录
        await DataManager.addHistory({
            action: '获取验证码',
            email: email,
            code: code,
            success: true
        });

        statusDiv.innerHTML = `<div class="status-message status-success">✅ 验证码已填充: ${code}</div>`;
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);

    } catch (error) {
        console.error('[Register Helper] 获取验证码失败:', error);
        statusDiv.innerHTML = `<div class="status-message status-error">❌ 获取验证码失败: ${error.message}</div>`;

        // 保存失败记录到历史
        await DataManager.addHistory({
            action: '获取验证码',
            error: error.message,
            success: false
        });
    }
};

// 点击 Continue 按钮
StripeHelperUI.prototype.handleClickContinue = async function() {
    const statusDiv = document.getElementById('fill-status');

    try {
        statusDiv.innerHTML = '<div class="status-message status-info">⏳ 正在点击 Continue 按钮...</div>';

        const success = RegisterHelper.clickContinueButton();

        if (success) {
            // 保存到历史记录
            await DataManager.addHistory({
                action: '点击 Continue',
                success: true
            });

            statusDiv.innerHTML = '<div class="status-message status-success">✅ 已点击 Continue 按钮</div>';
        } else {
            // 保存失败记录到历史
            await DataManager.addHistory({
                action: '点击 Continue',
                error: '未找到 Continue 按钮',
                success: false
            });

            statusDiv.innerHTML = '<div class="status-message status-warning">⚠️ 未找到 Continue 按钮</div>';
        }

        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 2000);

    } catch (error) {
        console.error('[Register Helper] 点击按钮失败:', error);
        statusDiv.innerHTML = `<div class="status-message status-error">❌ 点击失败: ${error.message}</div>`;

        // 保存失败记录到历史
        await DataManager.addHistory({
            action: '点击 Continue',
            error: error.message,
            success: false
        });
    }
};

