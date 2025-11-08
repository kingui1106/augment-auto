// ==================== GPTMail Content Script ====================
// 在 mail.chatgpt.org.uk 页面中运行，用于在真实浏览器环境中发起请求
// 这样可以绕过 Cloudflare 的反爬虫检测

console.log('[GPTMail Content] GPTMail Content Script 已加载');
console.log('[GPTMail Content] 当前页面:', window.location.href);

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[GPTMail Content] 收到消息:', request);

    // 处理 GPTMail API 请求
    if (request.action === 'fetchGPTMailInPage') {
        const { url, method, headers } = request;

        console.log('[GPTMail Content] 在页面上下文中发起请求:', url);
        console.log('[GPTMail Content] 请求方法:', method || 'GET');
        console.log('[GPTMail Content] 请求头:', headers);

        // 在页面上下文中使用原生 fetch，自动携带页面的 Cookie 和浏览器指纹
        fetch(url, {
            method: method || 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'en,en-US;q=0.9,zh-CN;q=0.8,zh;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Referer': 'https://mail.chatgpt.org.uk/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Priority': 'u=1, i',
                ...(headers || {})
            },
            credentials: 'include', // 自动携带 Cookie
            mode: 'cors'
        })
        .then(response => {
            console.log('[GPTMail Content] 响应状态:', response.status, response.statusText);
            console.log('[GPTMail Content] 响应头:', response.headers);

            // 读取响应头
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            // 读取响应内容
            return response.text().then(text => {
                let data;
                try {
                    data = JSON.parse(text);
                    console.log('[GPTMail Content] 响应数据 (JSON):', data);
                } catch (e) {
                    data = text;
                    console.log('[GPTMail Content] 响应数据 (文本):', text.substring(0, 200) + '...');
                }

                return {
                    success: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    headers: responseHeaders,
                    data: data
                };
            });
        })
        .then(result => {
            console.log('[GPTMail Content] 请求成功:', result);
            sendResponse(result);
        })
        .catch(error => {
            console.error('[GPTMail Content] 请求失败:', error);
            sendResponse({
                success: false,
                status: 0,
                error: error.message,
                errorType: error.name
            });
        });

        // 返回 true 表示异步响应
        return true;
    }

    // 健康检查
    if (request.action === 'pingGPTMailContent') {
        console.log('[GPTMail Content] 收到 ping，返回 pong');
        sendResponse({
            success: true,
            message: 'pong',
            url: window.location.href
        });
        return true;
    }
});

console.log('[GPTMail Content] 消息监听器已注册');
