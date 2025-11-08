// ==================== 注册辅助功能模块 ====================

const RegisterHelper = {
    // 配置
    CONFIG: {
        // GPTMail 邮箱服务配置
        GPTMAIL_API_BASE: 'https://mail.chatgpt.org.uk',

        MAX_EMAIL_CHECKS: 10,
        EMAIL_CHECK_INTERVAL: 3000
    },

    // 获取当前选择的邮箱服务
    async getCurrentEmailService() {
        const service = await StorageAPI.getValue('email_service', 'gptmail');
        return service;
    },

    // 获取浏览器 User-Agent
    getUserAgent() {
        return navigator.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
    },

    // 生成随机字符串
    generateRandomString(length = 10) {
        const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    },

    // 生成随机邮箱
    async generateRandomEmail() {
        const emailService = await this.getCurrentEmailService();

        if (emailService === 'gptmail') {
            return await this.generateGPTMailEmail();
        } else {
            return await this.generateDefaultEmail();
        }
    },

    // 生成默认邮箱服务的邮箱
    async generateDefaultEmail() {
        const name = this.generateRandomString(10);
        const domain = DefaultEmailConfig.getRandomDomain();

        console.log('[Register Helper] 正在生成邮箱 (默认服务):', name, '@', domain);

        try {
            const response = await fetch(DefaultEmailConfig.getNewAddressEndpoint(), {
                method: 'POST',
                headers: DefaultEmailConfig.getHeaders(),
                body: JSON.stringify({
                    enablePrefix: false,
                    name: name,
                    domain: domain
                })
            });

            const data = await response.json();
            if (data.address) {
                console.log('[Register Helper] 生成邮箱成功 (默认服务):', data.address);
                return data.address;
            } else {
                throw new Error('邮箱生成失败');
            }
        } catch (error) {
            console.error('[Register Helper] 生成邮箱失败 (默认服务):', error);
            throw error;
        }
    },

    // 生成 GPTMail 邮箱
    async generateGPTMailEmail() {
        console.log('[Register Helper] 正在生成邮箱 (GPTMail)...');

        try {
            const url = `${this.CONFIG.GPTMAIL_API_BASE}/api/generate-email`;
            console.log('[Register Helper] 请求 URL:', url);

            // 使用 GPTMailConfig 获取持久化的 Cookie
            const savedCookie = await GPTMailConfig.getCookie();

            // 获取浏览器 User-Agent
            const userAgent = this.getUserAgent();
            console.log('[Register Helper] User-Agent:', userAgent);

            // 构建请求头
            const headers = {
                'Accept': 'application/json',
                'User-Agent': userAgent
            };

            // 如果有 Cookie，添加到请求头
            if (savedCookie) {
                headers['Cookie'] = savedCookie;
                console.log('[Register Helper] ✓ 使用持久化的 Cookie');
                console.log('[Register Helper] Cookie 前100字符:', savedCookie.substring(0, 100) + '...');
            } else {
                console.error('[Register Helper] ❌ 未配置 Cookie，请求将失败');
                throw new Error('未配置 GPTMail Cookie，请在设置页面配置');
            }

            console.log('[Register Helper] 发起请求...');
            console.log('[Register Helper] 请求头:', headers);

            // 通过后台脚本发起请求，绕过 CORS
            const message = {
                action: 'fetchGPTMail',
                url: url,
                method: 'GET',
                headers: headers
            };
            console.log('[Register Helper] 发送消息到 background.js:', message);

            const result = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[Register Helper] ❌ 发送消息失败:', chrome.runtime.lastError);
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        console.log('[Register Helper] ✅ 收到 background.js 响应:', response);
                        resolve(response);
                    }
                });
            });

            console.log('[Register Helper] 后台脚本响应:', result);

            if (result.success && result.status === 200) {
                const email = result.data.email;

                if (!email) {
                    console.error('[Register Helper] GPTMail 响应中缺少 email 字段');
                    throw new Error('GPTMail 邮箱生成失败：响应格式错误');
                }

                console.log('[Register Helper] 生成邮箱成功 (GPTMail):', email);
                const domain = email.split('@')[1] || 'unknown';
                console.log('[Register Helper] 域名:', domain);

                return email;
            } else {
                console.error('[Register Helper] GPTMail 请求失败:', result.status);
                if (result.status === 403) {
                    throw new Error('GPTMail 请求被拒绝 (403)，请在设置中配置 Cookie');
                }
                throw new Error(`GPTMail 邮箱生成失败: HTTP ${result.status || 'Unknown'}`);
            }
        } catch (error) {
            console.error('[Register Helper] 生成邮箱失败 (GPTMail):', error);
            throw error;
        }
    },

    // 获取邮箱中的邮件
    async getEmails(email) {
        const emailService = await this.getCurrentEmailService();

        if (emailService === 'gptmail') {
            return await this.getGPTMailEmails(email);
        } else {
            return await this.getDefaultEmails(email);
        }
    },

    // 获取默认邮箱服务的邮件
    async getDefaultEmails(email) {
        try {
            const response = await fetch(
                DefaultEmailConfig.getMailsEndpoint(email, 20, 0),
                {
                    method: 'GET',
                    headers: DefaultEmailConfig.getHeaders()
                }
            );

            const data = await response.json();
            const results = data.results || [];
            console.log('[Register Helper] 获取邮件 (默认服务):', results.length, '封');
            return results;
        } catch (error) {
            console.error('[Register Helper] 获取邮件失败 (默认服务):', error);
            throw error;
        }
    },

    // 获取 GPTMail 邮件
    async getGPTMailEmails(email) {
        try {
            const encodedEmail = encodeURIComponent(email);
            const url = `${this.CONFIG.GPTMAIL_API_BASE}/api/emails?email=${encodedEmail}`;

            console.log('[Register Helper] GPTMail 请求 URL:', url);

            // 使用 GPTMailConfig 获取持久化的 Cookie
            const savedCookie = await GPTMailConfig.getCookie();
            console.log('[Register Helper] Cookie 状态:', savedCookie ? '已配置' : '未配置');

            // 获取浏览器 User-Agent
            const userAgent = this.getUserAgent();
            console.log('[Register Helper] User-Agent:', userAgent);

            // 构建请求头（必须包含 Cookie 和 User-Agent）
            const headers = {
                'Accept': 'application/json',
                'User-Agent': userAgent
            };

            // 如果有 Cookie，添加到请求头
            if (savedCookie) {
                headers['Cookie'] = savedCookie;
                console.log('[Register Helper] ✓ 使用持久化的 Cookie');
                console.log('[Register Helper] Cookie 前100字符:', savedCookie.substring(0, 100) + '...');
            } else {
                console.error('[Register Helper] ❌ 未配置 Cookie，请求将失败');
            }

            console.log('[Register Helper] 发起请求...');
            console.log('[Register Helper] 请求头:', headers);

            // 通过后台脚本发起请求，绕过 CORS
            const message = {
                action: 'fetchGPTMail',
                url: url,
                method: 'GET',
                headers: headers
            };
            console.log('[Register Helper] 发送消息到 background.js:', message);

            const result = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[Register Helper] ❌ 发送消息失败:', chrome.runtime.lastError);
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        console.log('[Register Helper] ✅ 收到 background.js 响应:', response);
                        resolve(response);
                    }
                });
            });

            console.log('[Register Helper] 后台脚本响应:', result);

            if (result.success && result.status === 200) {
                const data = result.data;
                console.log('[Register Helper] GPTMail 响应数据:', data);

                const emails = data.emails || [];
                console.log('[Register Helper] 获取邮件 (GPTMail):', emails.length, '封');

                // 打印每封邮件的基本信息
                emails.forEach((email, index) => {
                    console.log(`[Register Helper] 邮件 ${index + 1}:`, {
                        from: email.from,
                        subject: email.subject,
                        date: email.date,
                        hasContent: !!email.content,
                        hasHtmlContent: !!email.htmlContent
                    });
                });

                return emails;
            } else {
                console.error('[Register Helper] GPTMail 获取邮件失败:', result.status);

                if (result.status === 403) {
                    console.error('[Register Helper] ⚠️ 请求被拒绝 (403)');
                    console.error('[Register Helper] 💡 请在设置页面配置 Cookie');
                    console.error('[Register Helper] 💡 步骤: 设置 → 🚀 自动获取 Cookie → 🔄 刷新 Cookie');
                } else if (result.status === 404) {
                    console.error('[Register Helper] ⚠️ 邮箱不存在或未收到邮件 (404)');
                }

                return [];
            }
        } catch (error) {
            console.error('[Register Helper] 获取邮件失败 (GPTMail):', error);
            console.error('[Register Helper] 错误详情:', error.message);
            return [];
        }
    },

    // 从邮件中提取验证码
    extractVerificationCode(emailContent) {
        console.log('[Register Helper] 开始提取验证码，内容长度:', emailContent.length);

        // 多种验证码提取模式（按优先级排序）
        const patterns = [
            // 明确的验证码格式
            /verification code is[:\s]+([0-9]{6})/i,
            /your\s+verification\s+code\s+is[:\s]+(\d{6})/i,
            /verification\s+code[:\s]+(\d{6})/i,
            /confirmation\s+code[:\s]+(\d{6})/i,
            /authentication\s+code[:\s]+(\d{6})/i,
            /security\s+code[:\s]+(\d{6})/i,

            // 简短格式
            /code\s+is[:\s]+(\d{6})/i,
            /code[:\s]+(\d{6})/i,
            /your\s+code[:\s]+(\d{6})/i,
            /verify[:\s]+(\d{6})/i,
            /otp[:\s]+(\d{6})/i,
            /pin[:\s]+(\d{6})/i,

            // 反向格式
            /(\d{6})\s+is\s+your\s+verification\s+code/i,
            /(\d{6})\s+is\s+your\s+code/i,
            /(\d{6})\s+is\s+your\s+otp/i,

            // 操作指令
            /enter[:\s]+(\d{6})/i,
            /use[:\s]+(\d{6})/i,
            /enter\s+code[:\s]+(\d{6})/i,
            /enter\s+the\s+code[:\s]+(\d{6})/i,

            // HTML 标签内
            />([0-9]{6})</,
            /<[^>]*>([0-9]{6})<\/[^>]*>/,
            /<strong>([0-9]{6})<\/strong>/i,
            /<b>([0-9]{6})<\/b>/i,
            /<span[^>]*>([0-9]{6})<\/span>/i,
            /<div[^>]*>([0-9]{6})<\/div>/i,

            // 通用 6 位数字（最后尝试）
            /\b(\d{6})\b/
        ];

        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            const match = emailContent.match(pattern);
            if (match && match[1]) {
                const code = match[1];
                // 验证是否是纯数字
                if (code && /^\d{6}$/.test(code)) {
                    console.log(`[Register Helper] ✓ 提取验证码成功 (模式 ${i + 1}):`, code);
                    return code;
                }
            }
        }

        // 如果没找到，尝试查找所有 6 位数字并返回第一个
        const allSixDigits = emailContent.match(/\d{6}/g);
        if (allSixDigits && allSixDigits.length > 0) {
            console.log('[Register Helper] ⚠️ 使用备用方法找到可能的验证码:', allSixDigits[0]);
            console.log('[Register Helper] 找到的所有 6 位数字:', allSixDigits);
            return allSixDigits[0];
        }

        console.log('[Register Helper] ✗ 未找到验证码');
        return null;
    },

    // 检查是否是验证邮件 (用于 GPTMail)
    isVerificationEmail(emailItem) {
        const from = (emailItem.from || '').toLowerCase();
        const subject = (emailItem.subject || '').toLowerCase();
        const content = ((emailItem.content || '') + (emailItem.htmlContent || '')).toLowerCase();

        console.log('[Register Helper] 检查邮件:', {
            from: from.substring(0, 50),
            subject: subject.substring(0, 50),
            contentLength: content.length
        });

        // 常见验证邮件关键词
        const verificationKeywords = [
            // 服务名称
            'firebase', 'warp', 'cursor', 'augment', 'stripe',
            'github', 'gitlab', 'google', 'microsoft', 'apple',
            'cloudflare', 'vercel', 'netlify', 'aws', 'azure',

            // 发件人
            'noreply', 'no-reply', 'donotreply', 'do-not-reply',
            'support', 'security', 'account', 'team',

            // 验证相关
            'verification', 'verify', 'code', 'otp', 'pin',
            'confirm', 'authentication', 'auth', 'login',
            'sign in', 'signin', 'sign up', 'signup',
            'activate', 'activation', 'register', 'registration'
        ];

        // 检查发件人
        for (const keyword of verificationKeywords) {
            if (from.includes(keyword)) {
                console.log('[Register Helper] ✓ 验证邮件 (发件人匹配):', keyword);
                return true;
            }
        }

        // 检查主题
        for (const keyword of verificationKeywords) {
            if (subject.includes(keyword)) {
                console.log('[Register Helper] ✓ 验证邮件 (主题匹配):', keyword);
                return true;
            }
        }

        // 检查内容（只检查部分关键词，避免误判）
        const contentKeywords = [
            'verification code', 'verify code', 'confirmation code',
            'authentication code', 'security code', 'otp code',
            'your code is', 'code is', 'enter code', 'enter the code'
        ];

        for (const keyword of contentKeywords) {
            if (content.includes(keyword)) {
                console.log('[Register Helper] ✓ 验证邮件 (内容匹配):', keyword);
                return true;
            }
        }

        console.log('[Register Helper] ✗ 非验证邮件');
        return false;
    },

    // 填充输入框
    fillInput(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            try {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeInputValueSetter.call(element, value);
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('[Register Helper] 填充成功:', selector);
                return true;
            } catch (e) {
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        return false;
    },

    // 等待元素出现
    waitForElement(selector, timeout = 30000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(checkInterval);
                    resolve(element);
                }
                if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    resolve(null);
                }
            }, 500);
        });
    },

    // 开始注册 - 填充邮箱
    async startRegister(email, statusCallback) {
        console.log('[Register Helper] 开始注册，邮箱:', email);

        const currentUrl = window.location.href;

        // 如果不在登录页面，跳转到注册页面
        if (!currentUrl.includes('login.augmentcode.com') && !currentUrl.includes('app.augmentcode.com')) {
            if (statusCallback) statusCallback('🌐 正在跳转到注册页面...', 'info');
            console.log('[Register Helper] 跳转到注册页面');
            window.location.href = 'https://app.augmentcode.com/';
            return;
        }

        if (statusCallback) statusCallback('⏳ 等待登录页面加载...', 'info');
        console.log('[Register Helper] 当前URL:', currentUrl);

        // 等待邮箱输入框出现（最多等待 30 秒）
        console.log('[Register Helper] 等待邮箱输入框...');
        const emailInput = await this.waitForElement(
            'input#username, input[name="username"], input[autocomplete="email"], input[inputmode="email"]',
            30000
        );

        if (!emailInput) {
            if (statusCallback) statusCallback('⚠️ 页面加载超时', 'error');
            console.log('[Register Helper] 等待邮箱输入框超时');
            throw new Error('页面加载超时，请刷新重试');
        }

        console.log('[Register Helper] 邮箱输入框已出现');
        if (statusCallback) statusCallback('📝 正在填充邮箱...', 'info');

        // 等待一下，确保页面完全加载
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 尝试填充邮箱
        let emailFilled = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!emailFilled && attempts < maxAttempts) {
            attempts++;
            console.log(`[Register Helper] 尝试填充邮箱 (${attempts}/${maxAttempts})`);
            if (statusCallback) statusCallback(`📝 正在填充邮箱... (${attempts}/${maxAttempts})`, 'info');

            emailFilled = this.fillInput('input#username', email) ||
                         this.fillInput('input[name="username"]', email) ||
                         this.fillInput('input[autocomplete="email"]', email) ||
                         this.fillInput('input[inputmode="email"]', email) ||
                         this.fillInput('input[type="email"]', email) ||
                         this.fillInput('input[name="email"]', email);

            if (!emailFilled && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (emailFilled) {
            if (statusCallback) statusCallback(`✅ 邮箱已填充: ${email}`, 'success');
            console.log('[Register Helper] 邮箱填充成功');
        } else {
            if (statusCallback) statusCallback('⚠️ 未找到邮箱输入框', 'error');
            console.log('[Register Helper] 邮箱填充失败');

            // 打印所有 input 元素用于调试
            const allInputs = document.querySelectorAll('input');
            console.log('[Register Helper] 页面上的所有 input 元素:', allInputs.length);
            allInputs.forEach((input, index) => {
                console.log(`Input ${index}:`, {
                    id: input.id,
                    name: input.name,
                    type: input.type,
                    placeholder: input.placeholder,
                    autocomplete: input.autocomplete
                });
            });
            throw new Error('未找到邮箱输入框，请手动填充');
        }

        return true;
    },

    // 获取验证码并自动填写
    async getAndFillVerificationCode(email) {
        console.log('[Register Helper] ========== 开始获取验证码 ==========');
        console.log('[Register Helper] 邮箱地址:', email);

        const emailService = await this.getCurrentEmailService();
        console.log('[Register Helper] 使用邮箱服务:', emailService);

        // 最多尝试 10 次，每次间隔 3 秒
        for (let attempt = 1; attempt <= this.CONFIG.MAX_EMAIL_CHECKS; attempt++) {
            console.log(`[Register Helper] ========== 尝试 ${attempt}/${this.CONFIG.MAX_EMAIL_CHECKS} ==========`);

            const emails = await this.getEmails(email);
            console.log(`[Register Helper] 获取到 ${emails ? emails.length : 0} 封邮件`);

            if (emails && emails.length > 0) {
                console.log('[Register Helper] 开始遍历邮件查找验证码...');

                // 查找包含验证码的邮件
                for (let i = 0; i < emails.length; i++) {
                    const emailItem = emails[i];
                    console.log(`[Register Helper] --- 检查邮件 ${i + 1}/${emails.length} ---`);

                    let emailContent = '';

                    // 根据邮箱服务类型提取内容
                    if (emailService === 'gptmail') {
                        // GPTMail 格式：优先使用 htmlContent，其次使用 content
                        console.log('[Register Helper] 检查是否为验证邮件...');
                        if (!this.isVerificationEmail(emailItem)) {
                            console.log('[Register Helper] ✗ 跳过非验证邮件');
                            continue; // 跳过非验证邮件
                        }
                        console.log('[Register Helper] ✓ 确认为验证邮件');

                        emailContent = (emailItem.htmlContent || '') + (emailItem.content || '');
                        console.log('[Register Helper] 邮件内容长度:', emailContent.length);
                        console.log('[Register Helper] 邮件内容预览:', emailContent.substring(0, 200));
                    } else {
                        // 默认服务格式
                        const raw = emailItem.raw || '';
                        emailContent = raw.replace(/\r\n/g, '');
                        console.log('[Register Helper] 邮件内容长度 (默认服务):', emailContent.length);
                    }

                    console.log('[Register Helper] 开始提取验证码...');
                    const code = this.extractVerificationCode(emailContent);
                    if (code) {
                        console.log('[Register Helper] ✓✓✓ 找到验证码:', code);

                        // 等待一下，确保页面完全加载
                        console.log('[Register Helper] 等待 1 秒后填充验证码...');
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // 尝试填充验证码
                        console.log('[Register Helper] 开始填充验证码到输入框...');
                        let codeFilled = false;
                        for (let fillAttempt = 1; fillAttempt <= 5; fillAttempt++) {
                            console.log(`[Register Helper] 尝试填充验证码 (${fillAttempt}/5)`);

                            codeFilled = this.fillInput('input#code', code) ||
                                        this.fillInput('input[name="code"]', code) ||
                                        this.fillInput('input[type="text"][name="code"]', code) ||
                                        this.fillInput('input[autocomplete="off"]', code) ||
                                        this.fillInput('input[inputmode="numeric"]', code) ||
                                        this.fillInput('input[type="tel"]', code);

                            if (codeFilled) {
                                console.log('[Register Helper] ✓✓✓ 验证码填充成功！');
                                return code;
                            }

                            if (fillAttempt < 5) {
                                console.log('[Register Helper] 等待 500ms 后重试...');
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }

                        if (!codeFilled) {
                            console.error('[Register Helper] ✗✗✗ 未找到验证码输入框');
                            // 打印所有 input 元素用于调试
                            const allInputs = document.querySelectorAll('input');
                            console.log('[Register Helper] 页面上的所有 input 元素:', allInputs.length);
                            allInputs.forEach((input, index) => {
                                console.log(`Input ${index}:`, {
                                    id: input.id,
                                    name: input.name,
                                    type: input.type,
                                    placeholder: input.placeholder,
                                    autocomplete: input.autocomplete,
                                    inputmode: input.inputMode
                                });
                            });
                            throw new Error('未找到验证码输入框');
                        }
                    } else {
                        console.log('[Register Helper] ✗ 未能从此邮件提取验证码');
                    }
                }

                console.log('[Register Helper] ✗ 所有邮件都未找到验证码');
            } else {
                console.log('[Register Helper] ⚠️ 未收到任何邮件');
            }

            // 如果没有找到验证码，等待后重试
            if (attempt < this.CONFIG.MAX_EMAIL_CHECKS) {
                console.log(`[Register Helper] 等待 ${this.CONFIG.EMAIL_CHECK_INTERVAL}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, this.CONFIG.EMAIL_CHECK_INTERVAL));
            }
        }

        console.error('[Register Helper] ✗✗✗ 获取验证码超时');
        throw new Error('获取验证码超时');
    },

    // 点击 Continue 按钮
    clickContinueButton() {
        console.log('[Register Helper] 尝试点击 Continue 按钮');

        // 尝试多种选择器找到 Continue 按钮
        const selectors = [
            'button[type="submit"][name="action"][value="default"]',
            'button[type="submit"]',
            'button[data-action-button-primary="true"]'
        ];

        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                console.log('[Register Helper] 找到 Continue 按钮，点击');
                button.click();
                return true;
            }
        }

        // 使用文本匹配查找按钮
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            if (button.textContent.includes('Continue') || button.textContent.includes('继续')) {
                console.log('[Register Helper] 通过文本找到 Continue 按钮，点击');
                button.click();
                return true;
            }
        }

        console.log('[Register Helper] 未找到 Continue 按钮');
        return false;
    }
};

