// ==================== 后台服务脚本 ====================

console.log('[Background] Stripe Helper 后台服务已启动');

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] ========================================');
    console.log('[Background] 收到消息:', request);
    console.log('[Background] 消息类型 (action):', request.action);
    console.log('[Background] 发送者:', sender);
    console.log('[Background] ========================================');

    if (request.action === 'getCookies') {
        // 获取指定域名的所有 Cookie
        const url = request.url || 'https://mail.chatgpt.org.uk';
        const domain = request.domain || '.chatgpt.org.uk';

        console.log('[Background] 正在获取 Cookie...');
        console.log('[Background] URL:', url);
        console.log('[Background] Domain:', domain);

        // 尝试多种方式获取 Cookie 以确保兼容性
        const domainVariants = [
            domain,                        // .chatgpt.org.uk
            domain.replace(/^\./, ''),     // chatgpt.org.uk (去掉前导点)
        ];

        console.log('[Background] 尝试的域名变体:', domainVariants);

        // 额外尝试直接获取 cf_clearance cookie
        const cfClearanceAttempts = [
            { name: 'cf_clearance', domain: '.chatgpt.org.uk' },
            { name: 'cf_clearance', domain: 'chatgpt.org.uk' },
            { name: 'cf_clearance', url: 'https://mail.chatgpt.org.uk' },
            { name: 'cf_clearance', url: 'https://chatgpt.org.uk' },
        ];

        // 同时尝试从不同 URL 获取 cookies
        const urlVariants = [
            'https://mail.chatgpt.org.uk',
            'https://chatgpt.org.uk'
        ];

        // 使用 Promise.all 同时尝试所有域名变体和 URL 变体
        const domainPromises = domainVariants.map(d =>
            new Promise(resolve => {
                chrome.cookies.getAll({ domain: d }, cookies => {
                    console.log(`[Background] 域名 "${d}" 获取到:`, cookies.length, '个 Cookie');
                    resolve(cookies || []);
                });
            })
        );

        const urlPromises = urlVariants.map(u =>
            new Promise(resolve => {
                chrome.cookies.getAll({ url: u }, cookies => {
                    console.log(`[Background] URL "${u}" 获取到:`, cookies.length, '个 Cookie');
                    resolve(cookies || []);
                });
            })
        );

        Promise.all([...domainPromises, ...urlPromises]).then(async results => {
            // 合并所有结果并去重（根据 name+domain）
            const allCookies = [];
            const seen = new Set();

            results.forEach(cookies => {
                cookies.forEach(cookie => {
                    const key = `${cookie.name}|${cookie.domain}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        allCookies.push(cookie);
                    }
                });
            });

            console.log('[Background] 合并后共获取到 Cookie:', allCookies.length, '个');

            // 如果没有找到 cf_clearance，尝试更多方式直接获取
            let cfClearanceCookie = allCookies.find(c => c.name === 'cf_clearance');

            if (!cfClearanceCookie) {
                console.warn('[Background] 未在初始查询中找到 cf_clearance，尝试直接获取...');

                // 尝试多种方式直接获取 cf_clearance
                for (const attempt of cfClearanceAttempts) {
                    try {
                        const result = await new Promise(resolve => {
                            chrome.cookies.get(attempt, cookie => {
                                console.log(`[Background] 尝试获取 cf_clearance:`, attempt, '结果:', cookie);
                                resolve(cookie);
                            });
                        });

                        if (result) {
                            console.log('[Background] ✓ 成功通过直接查询获取到 cf_clearance!');
                            cfClearanceCookie = result;

                            // 添加到 allCookies 中
                            const key = `${result.name}|${result.domain}`;
                            if (!seen.has(key)) {
                                seen.add(key);
                                allCookies.push(result);
                            }
                            break;
                        }
                    } catch (error) {
                        console.error('[Background] 直接获取失败:', attempt, error);
                    }
                }
            }

            // 打印每个 Cookie 的详细信息
            allCookies.forEach(cookie => {
                console.log(`[Background] Cookie: ${cookie.name}`, {
                    value: cookie.value.substring(0, 50) + '...',
                    httpOnly: cookie.httpOnly,
                    secure: cookie.secure,
                    domain: cookie.domain,
                    path: cookie.path
                });
            });

            if (allCookies && allCookies.length > 0) {
                // 将 Cookie 数组转换为字符串格式
                const cookieString = allCookies.map(cookie => {
                    return `${cookie.name}=${cookie.value}`;
                }).join('; ');

                console.log('[Background] Cookie 字符串长度:', cookieString.length);
                console.log('[Background] Cookie 前200字符:', cookieString.substring(0, 200) + '...');

                // cfClearanceCookie 已在前面定义，这里只需要检查
                const hasCfClearance = !!cfClearanceCookie;

                if (cfClearanceCookie) {
                    console.log('[Background] ✓✓✓ 找到 cf_clearance Cookie:', {
                        domain: cfClearanceCookie.domain,
                        httpOnly: cfClearanceCookie.httpOnly,
                        secure: cfClearanceCookie.secure,
                        value: cfClearanceCookie.value.substring(0, 50) + '...',
                        expirationDate: cfClearanceCookie.expirationDate ? new Date(cfClearanceCookie.expirationDate * 1000).toISOString() : 'session'
                    });
                } else {
                    console.warn('[Background] ✗✗✗ 未找到 cf_clearance Cookie');
                    console.warn('[Background] 获取到的 Cookie 列表:', allCookies.map(c => c.name).join(', '));
                }

                sendResponse({
                    success: true,
                    cookie: cookieString,
                    count: allCookies.length,
                    hasCfClearance: hasCfClearance,
                    cookieNames: allCookies.map(c => c.name)  // 返回 cookie 名称列表用于诊断
                });
            } else {
                console.log('[Background] 未找到 Cookie');
                sendResponse({
                    success: false,
                    error: '未找到 Cookie，请先访问 https://mail.chatgpt.org.uk/ 并完成 Cloudflare 验证'
                });
            }
        }).catch(error => {
            console.error('[Background] 获取 Cookie 失败:', error);
            sendResponse({
                success: false,
                error: '获取 Cookie 失败: ' + error.message
            });
        });

        // 返回 true 表示异步响应
        return true;
    }

    if (request.action === 'openGPTMail') {
        // 打开 GPTMail 网站
        chrome.tabs.create({
            url: 'https://mail.chatgpt.org.uk/',
            active: true
        }, (tab) => {
            console.log('[Background] 已打开 GPTMail 网站，标签页 ID:', tab.id);
            sendResponse({ success: true, tabId: tab.id });
        });

        return true;
    }

    if (request.action === 'fetchGPTMail') {
        // 通过后台脚本发起请求，绕过 CORS 限制
        const { url, method, headers, body } = request;

        console.log('[Background] 发起 GPTMail 请求:', url);
        console.log('[Background] 请求头:', headers);

        fetch(url, {
            method: method || 'GET',
            headers: headers || {},
            body: body
        })
        .then(response => {
            console.log('[Background] 响应状态:', response.status);

            // 读取响应内容
            return response.text().then(text => {
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    data = text;
                }

                return {
                    success: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                };
            });
        })
        .then(result => {
            console.log('[Background] 请求成功:', result);
            sendResponse(result);
        })
        .catch(error => {
            console.error('[Background] 请求失败:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        });

        return true;
    }
});

// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[Background] 扩展已安装');
    } else if (details.reason === 'update') {
        console.log('[Background] 扩展已更新到版本:', chrome.runtime.getManifest().version);
    }
});

