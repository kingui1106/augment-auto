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

        // 使用 domain 参数来获取所有 Cookie（包括 HttpOnly）
        chrome.cookies.getAll({ domain: domain }, (cookies) => {
            console.log('[Background] 获取到 Cookie:', cookies.length, '个');

            // 打印每个 Cookie 的详细信息
            cookies.forEach(cookie => {
                console.log(`[Background] Cookie: ${cookie.name}`, {
                    httpOnly: cookie.httpOnly,
                    secure: cookie.secure,
                    domain: cookie.domain,
                    path: cookie.path
                });
            });

            if (cookies && cookies.length > 0) {
                // 将 Cookie 数组转换为字符串格式
                const cookieString = cookies.map(cookie => {
                    return `${cookie.name}=${cookie.value}`;
                }).join('; ');

                console.log('[Background] Cookie 字符串长度:', cookieString.length);
                console.log('[Background] Cookie 前200字符:', cookieString.substring(0, 200) + '...');

                // 检查是否包含 cf_clearance
                const hasCfClearance = cookieString.includes('cf_clearance');
                console.log('[Background] 包含 cf_clearance:', hasCfClearance ? '✓' : '✗');

                sendResponse({
                    success: true,
                    cookie: cookieString,
                    count: cookies.length,
                    hasCfClearance: hasCfClearance
                });
            } else {
                console.log('[Background] 未找到 Cookie');
                sendResponse({
                    success: false,
                    error: '未找到 Cookie，请先访问网站'
                });
            }
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

