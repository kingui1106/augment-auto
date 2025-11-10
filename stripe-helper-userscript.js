// ==UserScript==
// @name         Stripe Checkout 智能填表助手 Pro (油猴版)
// @namespace    http://tampermonkey.net/
// @version      2.0.1
// @description  强大的Stripe填表工具：卡头管理、信息预设、历史记录、批量测试，现代化UI - 油猴脚本版本
// @author       kingui1106
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      mail.chatgpt.org.uk
// @connect      api.temp-mail.io
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('[Stripe Helper] 油猴脚本已加载');

    // ==================== Storage API Wrapper ====================
    // 将 GM_* API 转换为统一的 Storage API
    const StorageAPI = {
        async getValue(key, defaultValue = null) {
            const value = GM_getValue(key, defaultValue);
            return Promise.resolve(value);
        },

        async setValue(key, value) {
            GM_setValue(key, value);
            return Promise.resolve();
        },

        async deleteValue(key) {
            GM_deleteValue(key);
            return Promise.resolve();
        }
    };

    // ==================== 默认数据配置 ====================
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
            enabled: false
        },
        {
            id: 'bin3',
            prefix: "559888",
            name: "Mastercard Pro",
            totalLength: 16,
            cvcLength: 3,
            enabled: false
        }
    ];

    const defaultProfiles = [
        {
            id: 'profile1',
            name: '中国-北京',
            isActive: true,
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
            id: 'profile4',
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
            id: 'profile5',
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
        }
    ];

    // ==================== 数据存储管理器 ====================
    const DataManager = {
        storage: StorageAPI,

        async getCardBins() {
            const saved = await StorageAPI.getValue('cardBins');
            return saved ? JSON.parse(saved) : defaultCardBins;
        },

        async saveCardBins(bins) {
            await StorageAPI.setValue('cardBins', JSON.stringify(bins));
        },

        async addCardBin(bin) {
            const bins = await this.getCardBins();
            bin.id = 'bin_' + Date.now();
            bins.push(bin);
            await this.saveCardBins(bins);
            return bin;
        },

        async deleteCardBin(id) {
            const bins = await this.getCardBins();
            const filtered = bins.filter(b => b.id !== id);
            await this.saveCardBins(filtered);
        },

        async updateCardBin(id, updates) {
            const bins = await this.getCardBins();
            const index = bins.findIndex(b => b.id === id);
            if (index !== -1) {
                bins[index] = { ...bins[index], ...updates };
                await this.saveCardBins(bins);
            }
        },

        async getEnabledCardBins() {
            const bins = await this.getCardBins();
            return bins.filter(b => b.enabled);
        },

        async getProfiles() {
            const saved = await StorageAPI.getValue('profiles');
            return saved ? JSON.parse(saved) : defaultProfiles;
        },

        async saveProfiles(profiles) {
            await StorageAPI.setValue('profiles', JSON.stringify(profiles));
        },

        async addProfile(profile) {
            const profiles = await this.getProfiles();
            profile.id = 'profile_' + Date.now();
            profiles.push(profile);
            await this.saveProfiles(profiles);
            return profile;
        },

        async deleteProfile(id) {
            const profiles = await this.getProfiles();
            const filtered = profiles.filter(p => p.id !== id);
            await this.saveProfiles(filtered);
        },

        async updateProfile(id, updates) {
            const profiles = await this.getProfiles();
            const index = profiles.findIndex(p => p.id === id);
            if (index !== -1) {
                profiles[index] = { ...profiles[index], ...updates };
                await this.saveProfiles(profiles);
            }
        },

        async setActiveProfile(id) {
            const profiles = await this.getProfiles();
            profiles.forEach(p => {
                p.isActive = (p.id === id);
            });
            await this.saveProfiles(profiles);
        },

        async getActiveProfile() {
            const profiles = await this.getProfiles();
            return profiles.find(p => p.isActive) || profiles[0];
        },

        async getHistory() {
            const saved = await StorageAPI.getValue('history');
            return saved ? JSON.parse(saved) : [];
        },

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

        async clearHistory() {
            await StorageAPI.setValue('history', JSON.stringify([]));
        },

        async exportConfig() {
            return {
                cardBins: await this.getCardBins(),
                profiles: await this.getProfiles(),
                history: await this.getHistory(),
                exportTime: new Date().toISOString()
            };
        },

        async importConfig(config) {
            if (config.cardBins) await this.saveCardBins(config.cardBins);
            if (config.profiles) await this.saveProfiles(config.profiles);
            if (config.history) await StorageAPI.setValue('history', JSON.stringify(config.history));
        }
    };

    // ==================== 工具函数 ====================
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

    // ==================== 提交按钮点击函数 ====================
    function clickSubmitButton() {
        console.log('🔍 开始查找并点击提交按钮...');

        let submitButton = null;

        // 策略1: 通过data-testid精确查找
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

    // ==================== 简化的邮箱生成辅助功能 ====================
    const RegisterHelper = {
        // 生成随机字符串
        generateRandomString(length = 10) {
            const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            return result;
        },

        // 生成简单的随机邮箱（不依赖外部服务）
        async generateRandomEmail() {
            const randomString = this.generateRandomString(12);
            const domains = ['example.com', 'test.com', 'demo.com'];
            const domain = domains[Math.floor(Math.random() * domains.length)];
            const email = `${randomString}@${domain}`;
            console.log('[Register Helper] 生成随机邮箱:', email);
            return email;
        }
    };

    // ==================== CSS 样式 ====================
    GM_addStyle(`
        * { box-sizing: border-box; }

        .stripe-helper-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stripe-helper-toggle {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .stripe-helper-toggle:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(102, 126, 234, 0.5);
        }

        .stripe-helper-content {
            position: absolute;
            top: 60px;
            right: 0;
            width: 420px;
            max-height: 80vh;
            overflow-y: auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            display: none;
            animation: slideIn 0.3s ease;
        }

        .stripe-helper-content.show {
            display: block;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .stripe-helper-content::-webkit-scrollbar {
            width: 8px;
        }

        .stripe-helper-content::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 8px;
        }

        .stripe-helper-content::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 8px;
        }

        .stripe-helper-tabs {
            display: flex;
            background: #f8f9fa;
            border-radius: 16px 16px 0 0;
            padding: 8px;
            gap: 4px;
        }

        .stripe-helper-tab {
            flex: 1;
            padding: 12px 8px;
            border: none;
            background: transparent;
            color: #666;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s ease;
        }

        .stripe-helper-tab:hover {
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
        }

        .stripe-helper-tab.active {
            background: white;
            color: #667eea;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .stripe-helper-tab-content {
            display: none;
            padding: 20px;
        }

        .stripe-helper-tab-content.active {
            display: block;
        }

        .btn-group {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }

        .stripe-btn {
            flex: 1;
            padding: 12px 16px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .stripe-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .stripe-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .stripe-btn-success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
        }

        .stripe-btn-success:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(17, 153, 142, 0.4);
        }

        .stripe-btn-danger {
            background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
            color: white;
        }

        .stripe-btn-secondary {
            background: #e9ecef;
            color: #495057;
        }

        .stripe-btn-secondary:hover {
            background: #dee2e6;
        }

        .card-item {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 10px;
            margin-bottom: 12px;
            border: 2px solid transparent;
            transition: all 0.2s ease;
        }

        .card-item:hover {
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .card-item.selected {
            border-color: #667eea;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }

        .card-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .card-item-title {
            font-weight: 600;
            color: #212529;
            font-size: 15px;
        }

        .card-item-info {
            font-size: 13px;
            color: #6c757d;
            line-height: 1.6;
        }

        .card-item-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }

        .icon-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: white;
            color: #495057;
        }

        .icon-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            color: #495057;
            font-size: 13px;
        }

        .form-input, .form-select {
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.2s ease;
        }

        .form-input:focus, .form-select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 1000000;
            display: none;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        }

        .modal-overlay.show {
            display: flex;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .modal {
            background: white;
            border-radius: 16px;
            padding: 24px;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .modal-header {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #212529;
        }

        .modal-footer {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }

        .history-item {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 8px;
            font-size: 13px;
            color: #495057;
        }

        .history-time {
            color: #6c757d;
            font-size: 12px;
            margin-top: 4px;
        }

        .status-message {
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
            animation: fadeIn 0.3s ease;
        }

        .status-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .status-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .status-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-primary {
            background: #667eea;
            color: white;
        }

        .badge-success {
            background: #38ef7d;
            color: white;
        }

        .badge-secondary {
            background: #6c757d;
            color: white;
        }

        .divider {
            height: 1px;
            background: #e9ecef;
            margin: 16px 0;
        }

        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `);

    // ==================== UI基础类 ====================
    class StripeHelperUI {
        constructor() {
            this.panel = null;
            this.currentTab = 'fill';
            this.modals = {};
        }

        init() {
            this.createPanel();
            this.attachEventListeners();
            this.renderCurrentTab();
        }

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

        // 渲染填表Tab
        async renderFillTab() {
            const container = document.getElementById('tab-content-fill');
            const activeProfile = await DataManager.getActiveProfile();

            if (!activeProfile) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <div>请先在"信息"标签页中添加并选择一个配置</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div id="fill-status"></div>

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

                <div style="margin-top: 20px; padding: 12px; background: #f0f9ff; border-radius: 8px; border-left: 3px solid #3b82f6;">
                    <div style="font-weight: 600; margin-bottom: 8px;">当前使用配置</div>
                    <div style="font-size: 13px; color: #374151;">
                        ${activeProfile.name}<br>
                        ${activeProfile.data.billingName} | ${activeProfile.data.billingCountry}
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
        }

        async handleAutoFill(autoSubmit) {
            const statusDiv = document.getElementById('fill-status');

            try {
                statusDiv.innerHTML = '<div class="status-message status-info">⏳ 正在填写表单...</div>';

                const profile = await DataManager.getActiveProfile();
                if (!profile) {
                    throw new Error('未找到当前使用的配置');
                }

                const selectedBin = await getRandomCardBin();
                if (!selectedBin) {
                    throw new Error('未找到可用的卡头');
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
                        <small>配置: ${profile.name} | 卡号: ${cardNumber.slice(0, 6)}******${cardNumber.slice(-4)}</small>
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
        }

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
                btn.addEventListener('click', async () => {
                    const action = btn.dataset.action;
                    const id = btn.dataset.id;

                    switch(action) {
                        case 'activate':
                            await DataManager.setActiveProfile(id);
                            this.renderProfilesTab();
                            this.renderFillTab();
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
        }

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
                    <button class="stripe-btn stripe-btn-secondary" id="btn-clear-history">
                        <span>🗑️</span>
                        <span>清空历史</span>
                    </button>
                </div>

                <div id="history-list">
                    ${history.length === 0 ?
                        '<div class="empty-state"><div class="empty-state-icon">📭</div><div>暂无历史记录</div></div>' :
                        history.map(record => `
                            <div class="history-item">
                                <div>
                                    <span>${record.success ? '✅' : '❌'} ${record.action}</span>
                                </div>
                                ${record.success && record.cardNumber ? `
                                    <div style="margin-top: 6px; font-size: 12px;">
                                        配置: ${record.profile || 'N/A'}<br>
                                        卡头: ${record.cardBin || 'N/A'}<br>
                                        卡号: ${record.cardNumber}
                                    </div>
                                ` : record.error ? `
                                    <div style="margin-top: 6px; font-size: 12px; color: #dc3545;">
                                        错误: ${record.error}
                                    </div>
                                ` : ''}
                                <div class="history-time">${new Date(record.timestamp).toLocaleString('zh-CN')}</div>
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
                const dataStr = JSON.stringify(config, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `stripe-helper-config-${Date.now()}.json`;
                link.click();
                URL.revokeObjectURL(url);
            });

            document.getElementById('btn-import').addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                            try {
                                const config = JSON.parse(event.target.result);
                                await DataManager.importConfig(config);
                                alert('✅ 配置导入成功！');
                                this.renderSettingsTab();
                            } catch (error) {
                                alert('❌ 配置导入失败: ' + error.message);
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            });

            document.getElementById('btn-reset').addEventListener('click', async () => {
                if (confirm('⚠️ 确定要重置所有数据吗？此操作不可恢复！')) {
                    await DataManager.saveCardBins(defaultCardBins);
                    await DataManager.saveProfiles(defaultProfiles);
                    await DataManager.clearHistory();
                    alert('✅ 所有数据已重置！');
                    this.renderSettingsTab();
                }
            });
        }

        // 渲染关于Tab
        renderAboutTab() {
            const container = document.getElementById('tab-content-about');
            container.innerHTML = `
                <div class="card-item">
                    <div class="card-item-title">🎉 Stripe Checkout 智能填表助手 Pro</div>
                    <div class="card-item-info">
                        版本: 2.0.1 (油猴版)<br>
                        作者: kingui1106<br>
                        更新日期: 2025-01-10
                    </div>
                </div>

                <div class="card-item">
                    <div class="card-item-title">✨ 主要功能</div>
                    <div class="card-item-info">
                        • 🚀 快速填写Stripe支付表单<br>
                        • 💳 灵活的卡头管理系统<br>
                        • 👤 多个账户信息配置<br>
                        • 📜 完整的操作历史记录<br>
                        • 📦 配置数据导入导出<br>
                        • 🎨 现代化的用户界面
                    </div>
                </div>

                <div class="card-item">
                    <div class="card-item-title">📝 使用说明</div>
                    <div class="card-item-info" style="line-height: 1.8;">
                        1. 在"💳 卡头"标签页中添加和管理卡号前缀<br>
                        2. 在"👤 信息"标签页中配置账户信息<br>
                        3. 在"🚀 填表"标签页中一键填写表单<br>
                        4. 在"📜 历史"标签页中查看操作记录<br>
                        5. 在"⚙️ 设置"标签页中管理数据
                    </div>
                </div>

                <div class="card-item">
                    <div class="card-item-title">⚠️ 注意事项</div>
                    <div class="card-item-info" style="color: #dc3545;">
                        本工具仅供测试和学习使用，请勿用于任何非法用途。<br>
                        使用本工具产生的一切后果由使用者自行承担。
                    </div>
                </div>

                <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
                    Made with ❤️ by kingui1106
                </div>
            `;
        }
    }

    // ==================== 初始化 ====================
    function init() {
        console.log('[Stripe Helper] 正在初始化UI...');
        const ui = new StripeHelperUI();
        ui.init();
        console.log('[Stripe Helper] UI初始化完成');
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
