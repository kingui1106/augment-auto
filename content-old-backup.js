(function() {
    'use strict';
    
    // ==================== Storage API Wrapper ====================
    // 将 GM_* API 转换为 chrome.storage API
    
    const StorageAPI = {
        async getValue(key, defaultValue = null) {
            return new Promise((resolve) => {
                chrome.storage.local.get([key], (result) => {
                    resolve(result[key] !== undefined ? result[key] : defaultValue);
                });
            });
        },
        
        async setValue(key, value) {
            return new Promise((resolve) => {
                chrome.storage.local.set({ [key]: value }, () => {
                    resolve();
                });
            });
        },
        
        async deleteValue(key) {
            return new Promise((resolve) => {
                chrome.storage.local.remove([key], () => {
                    resolve();
                });
            });
        }
    };
    
    // ==================== 数据管理 ====================
    
    // 默认卡头配置
    const defaultCardBins = [
        {
            id: 'bin1',
            prefix: "379240", 
            name: "美国运通",
            totalLength: 15,
            cvcLength: 4,
            enabled: true
        },
        {
            id: 'bin2',
            prefix: "552461",
            name: "Mastercard",
            totalLength: 16,
            cvcLength: 3,
            enabled: true
        },
        {
            id: 'bin3',
            prefix: "559888",
            name: "Mastercard Pro",
            totalLength: 16,
            cvcLength: 3,
            enabled: true
        }
    ];
    
    // 默认个人信息配置
    const defaultProfiles = [
        {
            id: 'profile1',
            name: '中国-北京',
            data: {
                billingName: '张三',
                billingCountry: 'CN',
                billingPostalCode: '100000',
                billingAdministrativeArea: '北京市',
                billingLocality: '北京市',
                billingDependentLocality: '朝阳区',
                billingAddressLine1: '建国路123号'
            }
        },
        {
            id: 'profile2',
            name: '中国-上海',
            data: {
                billingName: '李四',
                billingCountry: 'CN',
                billingPostalCode: '200000',
                billingAdministrativeArea: '上海市',
                billingLocality: '上海市',
                billingDependentLocality: '浦东新区',
                billingAddressLine1: '世纪大道88号'
            }
        },
        {
            id: 'profile3',
            name: '中国-广州',
            data: {
                billingName: '王五',
                billingCountry: 'CN',
                billingPostalCode: '510000',
                billingAdministrativeArea: '广东省',
                billingLocality: '广州市',
                billingDependentLocality: '天河区',
                billingAddressLine1: '天河路888号'
            }
        },
        {
            id: 'profile4',
            name: '中国-深圳',
            data: {
                billingName: '赵六',
                billingCountry: 'CN',
                billingPostalCode: '518000',
                billingAdministrativeArea: '广东省',
                billingLocality: '深圳市',
                billingDependentLocality: '南山区',
                billingAddressLine1: '科技园南路666号'
            }
        },
        {
            id: 'profile5',
            name: '美国-纽约',
            data: {
                billingName: 'John Smith',
                billingCountry: 'US',
                billingPostalCode: '10001',
                billingAdministrativeArea: 'NY',
                billingLocality: 'New York',
                billingDependentLocality: 'Manhattan',
                billingAddressLine1: '123 Broadway Street'
            }
        },
        {
            id: 'profile6',
            name: '美国-加州',
            data: {
                billingName: 'Sarah Johnson',
                billingCountry: 'US',
                billingPostalCode: '90001',
                billingAdministrativeArea: 'CA',
                billingLocality: 'Los Angeles',
                billingDependentLocality: 'Downtown',
                billingAddressLine1: '456 Sunset Boulevard'
            }
        },
        {
            id: 'profile7',
            name: '英国-伦敦',
            data: {
                billingName: 'David Brown',
                billingCountry: 'GB',
                billingPostalCode: 'SW1A 1AA',
                billingAdministrativeArea: 'England',
                billingLocality: 'London',
                billingDependentLocality: 'Westminster',
                billingAddressLine1: '10 Downing Street'
            }
        },
        {
            id: 'profile8',
            name: '日本-东京',
            data: {
                billingName: 'Tanaka Yuki',
                billingCountry: 'JP',
                billingPostalCode: '100-0001',
                billingAdministrativeArea: '東京都',
                billingLocality: '千代田区',
                billingDependentLocality: '丸の内',
                billingAddressLine1: '丸の内1-1-1'
            }
        },
        {
            id: 'profile9',
            name: '澳大利亚-悉尼',
            data: {
                billingName: 'Michael Wilson',
                billingCountry: 'AU',
                billingPostalCode: '2000',
                billingAdministrativeArea: 'NSW',
                billingLocality: 'Sydney',
                billingDependentLocality: 'City Center',
                billingAddressLine1: '123 George Street'
            }
        },
        {
            id: 'profile10',
            name: '加拿大-多伦多',
            data: {
                billingName: 'Emily Taylor',
                billingCountry: 'CA',
                billingPostalCode: 'M5H 2N2',
                billingAdministrativeArea: 'ON',
                billingLocality: 'Toronto',
                billingDependentLocality: 'Downtown',
                billingAddressLine1: '100 King Street West'
            }
        },
        {
            id: 'profile11',
            name: '新加坡',
            data: {
                billingName: 'Lee Wei Ming',
                billingCountry: 'SG',
                billingPostalCode: '018956',
                billingAdministrativeArea: 'Singapore',
                billingLocality: 'Singapore',
                billingDependentLocality: 'Central',
                billingAddressLine1: '1 Marina Boulevard'
            }
        },
        {
            id: 'profile12',
            name: '德国-柏林',
            data: {
                billingName: 'Hans Mueller',
                billingCountry: 'DE',
                billingPostalCode: '10115',
                billingAdministrativeArea: 'Berlin',
                billingLocality: 'Berlin',
                billingDependentLocality: 'Mitte',
                billingAddressLine1: 'Unter den Linden 77'
            }
        }
    ];

    // 数据存储管理器
    const DataManager = {
        // 获取卡头列表
        async getCardBins() {
            const saved = await StorageAPI.getValue('cardBins');
            return saved ? JSON.parse(saved) : defaultCardBins;
        },

        // 保存卡头列表
        async saveCardBins(bins) {
            await StorageAPI.setValue('cardBins', JSON.stringify(bins));
        },

        // 添加卡头
        async addCardBin(bin) {
            const bins = await this.getCardBins();
            bin.id = 'bin_' + Date.now();
            bins.push(bin);
            await this.saveCardBins(bins);
            return bin;
        },

        // 删除卡头
        async deleteCardBin(id) {
            const bins = await this.getCardBins();
            const filtered = bins.filter(b => b.id !== id);
            await this.saveCardBins(filtered);
        },

        // 更新卡头
        async updateCardBin(id, updates) {
            const bins = await this.getCardBins();
            const index = bins.findIndex(b => b.id === id);
            if (index !== -1) {
                bins[index] = { ...bins[index], ...updates };
                await this.saveCardBins(bins);
            }
        },

        // 获取启用的卡头
        async getEnabledCardBins() {
            const bins = await this.getCardBins();
            return bins.filter(b => b.enabled);
        },

        // 获取配置列表
        async getProfiles() {
            const saved = await StorageAPI.getValue('profiles');
            return saved ? JSON.parse(saved) : defaultProfiles;
        },

        // 保存配置列表
        async saveProfiles(profiles) {
            await StorageAPI.setValue('profiles', JSON.stringify(profiles));
        },

        // 添加配置
        async addProfile(profile) {
            const profiles = await this.getProfiles();
            profile.id = 'profile_' + Date.now();
            profiles.push(profile);
            await this.saveProfiles(profiles);
            return profile;
        },

        // 删除配置
        async deleteProfile(id) {
            const profiles = await this.getProfiles();
            const filtered = profiles.filter(p => p.id !== id);
            await this.saveProfiles(filtered);
        },

        // 更新配置
        async updateProfile(id, updates) {
            const profiles = await this.getProfiles();
            const index = profiles.findIndex(p => p.id === id);
            if (index !== -1) {
                profiles[index] = { ...profiles[index], ...updates };
                await this.saveProfiles(profiles);
            }
        },

        // 获取历史记录
        async getHistory() {
            const saved = await StorageAPI.getValue('history');
            return saved ? JSON.parse(saved) : [];
        },

        // 添加历史记录
        async addHistory(record) {
            const history = await this.getHistory();
            record.id = Date.now();
            record.timestamp = new Date().toISOString();
            history.unshift(record);
            if (history.length > 50) {
                history.splice(50);
            }
            await StorageAPI.setValue('history', JSON.stringify(history));
        },

        // 清空历史记录
        async clearHistory() {
            await StorageAPI.setValue('history', JSON.stringify([]));
        },

        // 导出所有配置
        async exportConfig() {
            return {
                cardBins: await this.getCardBins(),
                profiles: await this.getProfiles(),
                history: await this.getHistory(),
                exportTime: new Date().toISOString()
            };
        },

        // 导入配置
        async importConfig(config) {
            if (config.cardBins) await this.saveCardBins(config.cardBins);
            if (config.profiles) await this.saveProfiles(config.profiles);
            if (config.history) await StorageAPI.setValue('history', JSON.stringify(config.history));
        }
    };

    // ==================== 工具函数 ====================

    // 随机选择一个启用的卡BIN
    async function getRandomCardBin() {
        const enabled = await DataManager.getEnabledCardBins();
        if (enabled.length === 0) {
            const allBins = await DataManager.getCardBins();
            return allBins[0];
        }
        const randomIndex = Math.floor(Math.random() * enabled.length);
        return enabled[randomIndex];
    }

    function generateRandomMonth() {
        return String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    }

    function generateRandomYear() {
        const currentYear = new Date().getFullYear();
        return String(currentYear + Math.floor(Math.random() * 5) + 1).slice(-2);
    }

    function generateRandomCVC(length) {
        const max = Math.pow(10, length) - 1;
        return String(Math.floor(Math.random() * max)).padStart(length, '0');
    }

    // Luhn算法生成有效信用卡号
    function generateLuhnCardNumber(prefix, totalLength) {
        let cardNumber = prefix;

        while (cardNumber.length < totalLength - 1) {
            cardNumber += Math.floor(Math.random() * 10);
        }

        cardNumber += '0';

        let sum = 0;
        let isEven = false;

        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            isEven = !isEven;
        }

        const checkDigit = (10 - (sum % 10)) % 10;
        return cardNumber.slice(0, -1) + checkDigit;
    }

    // 点击提交按钮的函数
    function clickSubmitButton() {
        console.log('🔍 开始查找并点击提交按钮...');

        let submitButton = null;

        // 策略1: 通过data-testid精确查找（最优先）
        const testIdSelectors = [
            'button[data-testid="hosted-payment-submit-button"]',
            '[data-testid="hosted-payment-submit-button"]',
            'button[data-testid*="submit-button"]',
            '[data-testid*="submit"]'
        ];

        for (const selector of testIdSelectors) {
            submitButton = document.querySelector(selector);
            if (submitButton) {
                console.log(`✅ 通过data-testid找到提交按钮: "${selector}"`);
                break;
            }
        }

        // 策略2: 通过XPath查找
        if (!submitButton) {
            try {
                const xpaths = [
                    '//*[@id="payment-form"]/div/div/div/div[3]/div/div[2]/div/button',
                    '//button[@data-testid="hosted-payment-submit-button"]',
                    '//button[contains(@class, "SubmitButton--complete")]'
                ];

                for (const xpath of xpaths) {
                    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    if (result.singleNodeValue) {
                        submitButton = result.singleNodeValue;
                        console.log(`✅ 通过XPath找到提交按钮: "${xpath}"`);
                        break;
                    }
                }
            } catch (e) {
                console.log('⚠️ XPath查找失败:', e.message);
            }
        }

        // 策略3: 通过类名和type属性组合查找
        if (!submitButton) {
            const classSelectors = [
                'button.SubmitButton.SubmitButton--complete[type="submit"]',
                'button.SubmitButton--complete',
                'button.SubmitButton[type="submit"]',
                'button.SubmitButton',
                'button[type="submit"]'
            ];

            for (const selector of classSelectors) {
                const buttons = document.querySelectorAll(selector);
                for (const btn of buttons) {
                    if (!btn.disabled && btn.offsetParent !== null) {
                        submitButton = btn;
                        console.log(`✅ 通过类名找到提交按钮: "${selector}"`);
                        break;
                    }
                }
                if (submitButton) break;
            }
        }

        // 策略4: 通过文本内容查找
        if (!submitButton) {
            const textPatterns = ['保存银行卡', '处理中', 'Submit', 'Pay', 'Subscribe', '订阅', '支付'];
            const allButtons = document.querySelectorAll('button, [role="button"]');

            for (const button of allButtons) {
                const buttonText = button.textContent || button.innerText || '';
                for (const pattern of textPatterns) {
                    if (buttonText.includes(pattern)) {
                        submitButton = button;
                        console.log(`✅ 通过文本内容找到提交按钮: "${pattern}"`);
                        break;
                    }
                }
                if (submitButton) break;
            }
        }

        // 执行点击
        if (submitButton) {
            console.log('🎯 找到提交按钮，准备点击...');

            try {
                submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });

                setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.focus();

                    const events = [
                        new MouseEvent('mouseenter', { bubbles: true, cancelable: true }),
                        new MouseEvent('mouseover', { bubbles: true, cancelable: true }),
                        new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
                        new MouseEvent('mouseup', { bubbles: true, cancelable: true }),
                        new MouseEvent('click', { bubbles: true, cancelable: true }),
                        new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
                        new PointerEvent('pointerup', { bubbles: true, cancelable: true }),
                        new FocusEvent('focus', { bubbles: true }),
                    ];

                    events.forEach(event => {
                        try {
                            submitButton.dispatchEvent(event);
                        } catch (e) {
                            console.log('事件分发警告:', e.message);
                        }
                    });

                    submitButton.click();
                    console.log('✅ 提交按钮点击完成！');
                }, 300);

                return true;

            } catch (error) {
                console.error('❌ 点击按钮时出错:', error);
                return false;
            }
        } else {
            console.log('❌ 未找到提交按钮，请检查页面结构');
            return false;
        }
    }

    // ==================== 表单填写函数 ====================

    function reliableFillForm(profileData, cardNumber, expiry, cvc, cardType, autoSubmit = false) {
        console.log(`开始填写表单，卡类型: ${cardType}, 卡号: ${cardNumber}`);

        const fieldData = [
            { id: 'billingName', value: profileData.billingName, type: 'input', name: '持卡人姓名' },
            { id: 'billingCountry', value: profileData.billingCountry, type: 'select', name: '国家' },
            { id: 'billingPostalCode', value: profileData.billingPostalCode, type: 'input', name: '邮编' },
            { id: 'billingAdministrativeArea', value: profileData.billingAdministrativeArea, type: 'select', name: '省/州' },
            { id: 'billingLocality', value: profileData.billingLocality, type: 'input', name: '城市' },
            { id: 'billingDependentLocality', value: profileData.billingDependentLocality, type: 'input', name: '地区' },
            { id: 'billingAddressLine1', value: profileData.billingAddressLine1, type: 'input', name: '地址第1行' }
        ];

        let filledCount = 0;

        fieldData.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                if (fillFieldReliably(element, field.value, field.type)) {
                    console.log(`✅ 已填写: ${field.name}`);
                    filledCount++;
                } else {
                    console.log(`❌ 填写失败: ${field.name}`);
                }
            } else {
                console.log(`❌ 未找到字段: ${field.name}`);
            }
        });

        fillCreditCardFields(cardNumber, expiry, cvc);

        console.log(`🎉 填写完成，成功填写 ${filledCount} 个字段`);

        if (autoSubmit) {
            setTimeout(() => {
                console.log('延迟执行提交操作...');
                const submitSuccess = clickSubmitButton();

                if (!submitSuccess) {
                    setTimeout(() => {
                        console.log('尝试第二次提交...');
                        clickSubmitButton();
                    }, 2000);
                }
            }, 1500);
        } else {
            console.log('⚠️ 仅填表模式，不执行自动提交');
        }

        return true;
    }

    function fillFieldReliably(element, value, type) {
        try {
            if (type === 'select') {
                return setSelectValueReliably(element, value);
            } else {
                return setInputValueReliably(element, value);
            }
        } catch (e) {
            console.log(`填写错误: ${e.message}`);
            return false;
        }
    }

    function setInputValueReliably(input, value) {
        input.focus();
        input.value = value;

        const events = ['input', 'change', 'blur', 'focus', 'keydown', 'keyup', 'keypress'];
        events.forEach(eventType => {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            input.dispatchEvent(event);
        });

        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);

        const reactEvent = new Event('input', { bubbles: true });
        reactEvent.simulated = true;
        input.dispatchEvent(reactEvent);

        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);

        return input.value === value;
    }

    function setSelectValueReliably(select, value) {
        let success = false;

        select.value = value;
        if (select.value === value) success = true;

        if (!success) {
            for (let option of select.options) {
                if (option.value === value || option.text.includes(value)) {
                    option.selected = true;
                    success = true;
                    break;
                }
            }
        }

        if (success) {
            const events = ['change', 'input', 'blur'];
            events.forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                select.dispatchEvent(event);
            });
        }

        return success;
    }

    function fillCreditCardFields(cardNumber, expiry, cvc) {
        console.log('尝试填写信用卡字段...');

        const cardFields = [
            {
                selectors: [
                    'input[data-elements-stable-field-name="cardNumber"]',
                    'input[autocomplete="cc-number"]',
                    'input[placeholder*="card"]',
                    '#cardNumber'
                ],
                value: cardNumber,
                name: '卡号'
            },
            {
                selectors: [
                    'input[data-elements-stable-field-name="cardExpiry"]',
                    'input[autocomplete="cc-exp"]',
                    'input[placeholder*="expir"]',
                    '#cardExpiry'
                ],
                value: expiry,
                name: '有效期'
            },
            {
                selectors: [
                    'input[data-elements-stable-field-name="cardCvc"]',
                    'input[autocomplete="cc-csc"]',
                    'input[placeholder*="cvc"]',
                    '#cardCvc'
                ],
                value: cvc,
                name: 'CVC'
            }
        ];

        cardFields.forEach(field => {
            let element = null;

            for (const selector of field.selectors) {
                element = document.querySelector(selector);
                if (element) break;
            }

            if (element) {
                if (setInputValueReliably(element, field.value)) {
                    console.log(`✅ 已填写: ${field.name} (${field.value})`);
                } else {
                    console.log(`❌ 填写失败: ${field.name}`);
                }
            } else {
                console.log(`❌ 未找到字段: ${field.name}`);
            }
        });
    }

    // ==================== UI构建器 ====================

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
                <div class="stripe-helper-content">
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

        // 渲染填表Tab
        async renderFillTab() {
            const container = document.getElementById('tab-content-fill');
            const profiles = await DataManager.getProfiles();
            const cardBins = await DataManager.getEnabledCardBins();

            container.innerHTML = `
                <div id="fill-status"></div>

                <div class="form-group">
                    <label class="form-label">选择信息配置</label>
                    <select class="form-select" id="profile-select">
                        ${profiles.map((p, i) => `<option value="${p.id}" ${i === 0 ? 'selected' : ''}>${p.name}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">选择卡头 <small style="color: #6c757d;">(选择特定卡头将固定使用该卡头)</small></label>
                    <select class="form-select" id="card-bin-select">
                        <option value="random" selected>🎲 随机选择</option>
                        ${cardBins.map(bin => `<option value="${bin.id}">${bin.name} (${bin.prefix})</option>`).join('')}
                    </select>
                </div>

                <div class="btn-group">
                    <button class="stripe-btn stripe-btn-primary" id="btn-auto-fill">
                        <span>🚀</span>
                        <span>自动填表并提交</span>
                    </button>
                </div>

                <div class="btn-group">
                    <button class="stripe-btn stripe-btn-success" id="btn-fill-only">
                        <span>📝</span>
                        <span>仅填表</span>
                    </button>
                    <button class="stripe-btn stripe-btn-secondary" id="btn-clear">
                        <span>🧹</span>
                        <span>清空</span>
                    </button>
                </div>

                <div class="divider"></div>

                <div class="card-item">
                    <div class="card-item-title">💡 使用提示</div>
                    <div class="card-item-info">
                        • 自动填表并提交：自动填写并点击提交按钮<br>
                        • 仅填表：只填写表单，不自动提交<br>
                        • 清空：清除所有表单内容<br>
                        • 所有操作都会自动记录到历史中
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

            const cardBinSelect = document.getElementById('card-bin-select');
            cardBinSelect.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                const selectedText = e.target.options[e.target.selectedIndex].text;

                const statusDiv = document.getElementById('fill-status');
                if (selectedValue === 'random') {
                    statusDiv.innerHTML = '<div class="status-message status-info">🎲 已选择：随机卡头模式</div>';
                } else {
                    statusDiv.innerHTML = `<div class="status-message status-info">✅ 已选择：${selectedText}</div>`;
                }

                setTimeout(() => {
                    statusDiv.innerHTML = '';
                }, 1500);
            });
        }

        // 处理自动填表
        async handleAutoFill(autoSubmit) {
            const statusDiv = document.getElementById('fill-status');
            const profileId = document.getElementById('profile-select').value;
            const binSelect = document.getElementById('card-bin-select').value;

            try {
                statusDiv.innerHTML = '<div class="status-message status-info">⏳ 正在填写表单...</div>';

                const profiles = await DataManager.getProfiles();
                const profile = profiles.find(p => p.id === profileId);
                if (!profile) {
                    throw new Error('未找到选中的配置');
                }

                let selectedBin;
                if (binSelect === 'random' || !binSelect) {
                    selectedBin = await getRandomCardBin();
                } else {
                    const allBins = await DataManager.getCardBins();
                    selectedBin = allBins.find(b => b.id === binSelect);
                    if (!selectedBin) {
                        selectedBin = await getRandomCardBin();
                    }
                }

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
                        <small>卡号: ${cardNumber.slice(0, 6)}******${cardNumber.slice(-4)} | 类型: ${selectedBin.name}</small>
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
        }

        // 处理清空表单
        handleClearForm() {
            const statusDiv = document.getElementById('fill-status');
            statusDiv.innerHTML = '<div class="status-message status-info">🧹 表单已清空</div>';
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 2000);
        }

        // 渲染卡头Tab
        async renderCardsTab() {
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
                btn.addEventListener('click', async (e) => {
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
        }

        // 显示卡头编辑模态框
        async showCardModal(editId = null) {
            const isEdit = editId !== null;
            const bins = await DataManager.getCardBins();
            const bin = isEdit ? bins.find(b => b.id === editId) : null;

            const modal = this.createModal({
                title: isEdit ? '编辑卡头' : '添加卡头',
                content: `
                    <div class="form-group">
                        <label class="form-label">卡头名称</label>
                        <input type="text" class="form-input" id="modal-bin-name" value="${bin ? bin.name : ''}" placeholder="例如：Visa测试卡">
                    </div>
                    <div class="form-group">
                        <label class="form-label">卡号前缀（BIN）</label>
                        <input type="text" class="form-input" id="modal-bin-prefix" value="${bin ? bin.prefix : ''}" placeholder="例如：400000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">卡号总长度</label>
                        <input type="number" class="form-input" id="modal-bin-length" value="${bin ? bin.totalLength : '16'}" min="13" max="19">
                    </div>
                    <div class="form-group">
                        <label class="form-label">CVC长度</label>
                        <input type="number" class="form-input" id="modal-bin-cvc" value="${bin ? bin.cvcLength : '3'}" min="3" max="4">
                    </div>
                `,
                onConfirm: async () => {
                    const data = {
                        name: document.getElementById('modal-bin-name').value.trim(),
                        prefix: document.getElementById('modal-bin-prefix').value.trim(),
                        totalLength: parseInt(document.getElementById('modal-bin-length').value),
                        cvcLength: parseInt(document.getElementById('modal-bin-cvc').value),
                        enabled: bin ? bin.enabled : true
                    };

                    if (!data.name || !data.prefix) {
                        alert('请填写完整信息');
                        return false;
                    }

                    if (isEdit) {
                        await DataManager.updateCardBin(editId, data);
                    } else {
                        await DataManager.addCardBin(data);
                    }

                    this.renderCardsTab();
                    return true;
                }
            });

            modal.show();
        }

        // 渲染信息配置Tab
        async renderProfilesTab() {
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
                            <div class="card-item" data-id="${profile.id}">
                                <div class="card-item-header">
                                    <div class="card-item-title">${profile.name}</div>
                                </div>
                                <div class="card-item-info">
                                    姓名: ${profile.data.billingName}<br>
                                    国家: ${profile.data.billingCountry} | 邮编: ${profile.data.billingPostalCode}<br>
                                    地址: ${profile.data.billingAddressLine1}
                                </div>
                                <div class="card-item-actions">
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
        }

        // 显示信息配置模态框
        async showProfileModal(editId = null) {
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
        }

        // 渲染历史Tab
        async renderHistoryTab() {
            const container = document.getElementById('tab-content-history');
            const history = await DataManager.getHistory();

            container.innerHTML = `
                <div class="btn-group">
                    <button class="stripe-btn stripe-btn-danger" id="btn-clear-history">
                        <span>🗑️</span>
                        <span>清空历史</span>
                    </button>
                </div>

                <div id="history-list">
                    ${history.length === 0 ?
                        '<div class="empty-state"><div class="empty-state-icon">📭</div><div>暂无历史记录</div></div>' :
                        history.map(record => {
                            const time = new Date(record.timestamp).toLocaleString('zh-CN');
                            const statusIcon = record.success ? '✅' : '❌';
                            return `
                                <div class="history-item">
                                    ${statusIcon} <strong>${record.action}</strong><br>
                                    ${record.profile ? `配置: ${record.profile}<br>` : ''}
                                    ${record.cardBin ? `卡头: ${record.cardBin}<br>` : ''}
                                    ${record.cardNumber ? `卡号: ${record.cardNumber}<br>` : ''}
                                    ${record.error ? `错误: ${record.error}<br>` : ''}
                                    <div class="history-time">${time}</div>
                                </div>
                            `;
                        }).join('')
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
        }

        // 渲染设置Tab
        async renderSettingsTab() {
            const container = document.getElementById('tab-content-settings');
            const cardBins = await DataManager.getCardBins();
            const profiles = await DataManager.getProfiles();
            const history = await DataManager.getHistory();

            container.innerHTML = `
                <div class="card-item">
                    <div class="card-item-title">📦 数据管理</div>
                    <div class="card-item-info">导出或导入您的所有配置数据</div>
                    <div class="card-item-actions">
                        <button class="icon-btn" id="btn-export">📥 导出配置</button>
                        <button class="icon-btn" id="btn-import">📤 导入配置</button>
                    </div>
                </div>

                <div class="card-item">
                    <div class="card-item-title">📊 统计信息</div>
                    <div class="card-item-info">
                        卡头数量: ${cardBins.length} 个<br>
                        信息配置: ${profiles.length} 个<br>
                        历史记录: ${history.length} 条
                    </div>
                </div>

                <div class="divider"></div>

                <div class="btn-group">
                    <button class="stripe-btn stripe-btn-danger" id="btn-reset">
                        <span>⚠️</span>
                        <span>重置所有数据</span>
                    </button>
                </div>
            `;

            document.getElementById('btn-export').addEventListener('click', async () => {
                const config = await DataManager.exportConfig();
                const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stripe-helper-config-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);

                alert('配置已导出！');
            });

            document.getElementById('btn-import').addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            try {
                                const config = JSON.parse(e.target.result);
                                await DataManager.importConfig(config);
                                alert('配置导入成功！');
                                this.renderCurrentTab();
                            } catch (error) {
                                alert('配置文件格式错误！');
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            });

            document.getElementById('btn-reset').addEventListener('click', async () => {
                if (confirm('确定要重置所有数据吗？此操作不可撤销！')) {
                    if (confirm('再次确认：这将删除所有卡头、配置和历史记录！')) {
                        await StorageAPI.deleteValue('cardBins');
                        await StorageAPI.deleteValue('profiles');
                        await StorageAPI.deleteValue('history');
                        alert('所有数据已重置！');
                        this.renderCurrentTab();
                    }
                }
            });
        }

        // 渲染关于Tab
        renderAboutTab() {
            const container = document.getElementById('tab-content-about');

            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px 20px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">💳</div>
                    <div style="font-size: 24px; font-weight: 700; color: #667eea; margin-bottom: 8px;">
                        Stripe智能填表助手 Pro
                    </div>
                    <div style="font-size: 14px; color: #6c757d; margin-bottom: 24px;">
                        Version 2.0.1 - 浏览器扩展版
                    </div>
                </div>

                <div class="card-item">
                    <div class="card-item-title">👨‍💻 开发者信息</div>
                    <div class="card-item-info" style="line-height: 2;">
                        <strong>制作人</strong>: chaogei666<br>
                        <strong>微信号</strong>: chaogei666<br>
                        <strong>开发日期</strong>: 2025年
                    </div>
                </div>

                <div class="card-item">
                    <div class="card-item-title">✨ 功能特性</div>
                    <div class="card-item-info" style="line-height: 1.8;">
                        • 💳 可自定义卡头管理系统<br>
                        • 👤 多套个人信息配置<br>
                        • 📜 历史记录追踪（最多50条）<br>
                        • 📦 配置数据导入导出<br>
                        • 🎨 现代化渐变UI设计<br>
                        • 🚀 一键自动填表并提交<br>
                        • 🔧 操作后面板保持打开<br>
                        • 🌍 支持多国地址格式
                    </div>
                </div>

                <div class="card-item">
                    <div class="card-item-title">📋 默认配置</div>
                    <div class="card-item-info" style="line-height: 1.8;">
                        <strong>卡头类型</strong>: 3种<br>
                        • 379240 (美国运通 15位)<br>
                        • 552461 (Mastercard 16位)<br>
                        • 559888 (Mastercard Pro 16位)<br>
                        <br>
                        <strong>信息配置</strong>: 12套<br>
                        • 覆盖8个国家/地区<br>
                        • 中国（北京、上海、广州、深圳）<br>
                        • 美国、英国、日本、澳大利亚<br>
                        • 加拿大、新加坡、德国
                    </div>
                </div>

                <div class="card-item">
                    <div class="card-item-title">🛡️ 隐私说明</div>
                    <div class="card-item-info" style="line-height: 1.8;">
                        • 所有数据仅存储在本地浏览器<br>
                        • 不会上传到任何服务器<br>
                        • 不会收集任何个人信息<br>
                        • 仅在授权页面运行
                    </div>
                </div>

                <div class="card-item">
                    <div class="card-item-title">⚠️ 免责声明</div>
                    <div class="card-item-info" style="line-height: 1.8;">
                        本工具仅供学习和测试使用<br>
                        请在合法合规的环境中使用<br>
                        使用本工具产生的任何后果由使用者自行承担
                    </div>
                </div>

                <div class="divider"></div>

                <div style="text-align: center; color: #6c757d; font-size: 13px; padding: 20px;">
                    <div style="margin-bottom: 8px;">感谢使用 Stripe智能填表助手 Pro</div>
                    <div>© 2025 chaogei666. All rights reserved.</div>
                    <div style="margin-top: 12px; font-size: 12px;">
                        <a href="#" style="color: #667eea; text-decoration: none;" id="contact-link">💬 联系开发者</a>
                    </div>
                </div>
            `;

            const contactLink = document.getElementById('contact-link');
            if (contactLink) {
                contactLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('微信号: chaogei666\n\n如有问题或建议，欢迎添加微信交流！');
                });
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

    // ==================== 初始化 ====================

    function initStripeHelper() {
        console.log('🚀 Stripe智能填表助手 Pro v2.0.1 已加载');
        console.log('✨ 浏览器扩展版本 - 全网页模式');
        console.log('📍 当前页面:', window.location.href);

        const ui = new StripeHelperUI();
        ui.init();
    }

    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStripeHelper);
    } else {
        initStripeHelper();
    }
})();

