// ==================== UI标签页渲染 - 设置和关于 ====================

// 渲染设置Tab
StripeHelperUI.prototype.renderSettingsTab = async function() {
    const container = document.getElementById('tab-content-settings');
    const cardBins = await DataManager.getCardBins();
    const profiles = await DataManager.getProfiles();
    const history = await DataManager.getHistory();

    // 获取当前选择的邮箱服务
    const currentEmailService = await StorageAPI.getValue('email_service', 'gptmail');

    // 获取保存的 GPTMail Cookie
    const savedCookie = await StorageAPI.getValue('gptmail_cookie', '');
    const hasCookie = !!savedCookie;
    const hasCfClearance = savedCookie.includes('cf_clearance');

    container.innerHTML = `
        <div class="card-item">
            <div class="card-item-title">📧 邮箱服务</div>
            <div class="card-item-info">选择用于注册辅助的邮箱服务</div>
            <div style="margin-top: 12px;">
                <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                    <input type="radio" name="email-service" value="gptmail" ${currentEmailService === 'gptmail' ? 'checked' : ''}
                           style="margin-right: 8px; cursor: pointer;">
                    <span style="font-weight: 500;">GPTMail 邮箱服务</span>
                    <span style="margin-left: 8px; font-size: 12px; color: #10b981;">✓ 推荐</span>
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="email-service" value="default" ${currentEmailService === 'default' ? 'checked' : ''}
                           style="margin-right: 8px; cursor: pointer;">
                    <span style="font-weight: 500;">默认邮箱服务</span>
                </label>
            </div>
        </div>

        <div class="card-item">
            <div class="card-item-title">🍪 GPTMail Cookie 配置</div>
            <div class="card-item-info">
                配置 GPTMail 服务的 Cookie 以绕过 Cloudflare 验证
                ${hasCookie
                    ? (hasCfClearance
                        ? '<br><span style="color: #10b981; font-weight: 500;">✓ Cookie 已配置（包含 cf_clearance）</span>'
                        : '<br><span style="color: #f59e0b; font-weight: 500;">⚠️ Cookie 已配置但缺少 cf_clearance</span>')
                    : '<br><span style="color: #ef4444; font-weight: 500;">❌ 未配置 Cookie</span>'}
            </div>
            <div class="card-item-actions" style="margin-top: 12px;">
                <button class="icon-btn" id="btn-open-and-get-cookie">🚀 自动获取 Cookie</button>
                <button class="icon-btn" id="btn-get-cookie">🔄 刷新 Cookie</button>
            </div>
            <div class="card-item-actions" style="margin-top: 8px;">
                <button class="icon-btn" id="btn-open-gptmail">🌐 前往 GPTMail</button>
                <button class="icon-btn" id="btn-set-cookie-manual">✏️ 手动设置</button>
            </div>
            <div class="card-item-actions" style="margin-top: 8px;">
                <button class="icon-btn" id="btn-export-gptmail-config">💾 导出配置文件</button>
                <button class="icon-btn" id="btn-import-gptmail-config">📂 导入配置文件</button>
            </div>
            ${hasCookie ? `
                <div style="margin-top: 12px;">
                    <button class="icon-btn" id="btn-clear-cookie" style="background: #ef4444; color: white;">
                        🗑️ 清除 Cookie
                    </button>
                </div>
            ` : ''}
        </div>

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

    // 邮箱服务切换事件
    const emailServiceRadios = container.querySelectorAll('input[name="email-service"]');
    emailServiceRadios.forEach(radio => {
        radio.addEventListener('change', async (e) => {
            const selectedService = e.target.value;
            await StorageAPI.setValue('email_service', selectedService);
            console.log('[Settings] 邮箱服务已切换为:', selectedService);

            // 显示提示
            const serviceName = selectedService === 'gptmail' ? 'GPTMail' : '默认';
            alert(`✅ 已切换到 ${serviceName} 邮箱服务`);
        });
    });

    // 自动获取 Cookie（打开网站并获取）
    const btnOpenAndGetCookie = document.getElementById('btn-open-and-get-cookie');
    if (btnOpenAndGetCookie) {
        btnOpenAndGetCookie.addEventListener('click', async () => {
            try {
                console.log('[Settings] 开始自动获取 Cookie...');

                // 发送消息到后台脚本打开网站
                chrome.runtime.sendMessage({
                    action: 'openGPTMail'
                }, async (response) => {
                    if (response && response.success) {
                        console.log('[Settings] 网站已打开，等待 3 秒后获取 Cookie...');

                        // 显示提示
                        alert('✅ 已打开 GPTMail 网站\n\n请等待页面完全加载后，点击"🔄 刷新 Cookie"按钮获取 Cookie');
                    } else {
                        alert('❌ 打开网站失败');
                    }
                });
            } catch (error) {
                console.error('[Settings] 自动获取 Cookie 失败:', error);
                alert('❌ 操作失败: ' + error.message);
            }
        });
    }

    // 刷新 Cookie（从浏览器获取）
    const btnGetCookie = document.getElementById('btn-get-cookie');
    if (btnGetCookie) {
        btnGetCookie.addEventListener('click', async () => {
            try {
                console.log('[Settings] 正在获取 Cookie...');

                // 发送消息到后台脚本获取 Cookie
                chrome.runtime.sendMessage({
                    action: 'getCookies',
                    url: 'https://mail.chatgpt.org.uk',
                    domain: '.chatgpt.org.uk'  // 指定域名以获取所有 Cookie
                }, async (response) => {
                    if (response && response.success) {
                        const cookieString = response.cookie;
                        const hasCfClearance = response.hasCfClearance;

                        console.log('[Settings] 获取到 Cookie，长度:', cookieString.length);
                        console.log('[Settings] 包含 cf_clearance:', hasCfClearance ? '✓' : '✗');

                        // 使用 GPTMailConfig 保存 Cookie（持久化）
                        const saved = await GPTMailConfig.saveCookie(cookieString);

                        if (saved) {
                            console.log('[Settings] ✓ Cookie 已持久化保存，共', response.count, '个');

                            // 显示详细信息
                            const message = `✅ Cookie 获取成功！\n\n` +
                                `📊 共获取 ${response.count} 个 Cookie\n` +
                                `📏 总长度: ${cookieString.length} 字符\n` +
                                `${hasCfClearance ? '✓ 包含 cf_clearance（可以使用）' : '⚠️ 缺少 cf_clearance（可能无法使用）'}\n\n` +
                                `已持久化保存到扩展配置`;

                            alert(message);
                        } else {
                            console.error('[Settings] ✗ Cookie 保存失败');
                            alert('❌ Cookie 保存失败，请重试');
                        }

                        // 刷新页面以显示状态
                        this.renderCurrentTab();
                    } else {
                        console.error('[Settings] 获取 Cookie 失败:', response?.error);
                        alert('❌ ' + (response?.error || '获取 Cookie 失败') + '\n\n请先访问 https://mail.chatgpt.org.uk/ 并完成验证');
                    }
                });
            } catch (error) {
                console.error('[Settings] 获取 Cookie 失败:', error);
                alert('❌ 获取失败: ' + error.message);
            }
        });
    }

    // 前往 GPTMail 网站
    const btnOpenGPTMail = document.getElementById('btn-open-gptmail');
    if (btnOpenGPTMail) {
        btnOpenGPTMail.addEventListener('click', () => {
            window.open('https://mail.chatgpt.org.uk/', '_blank');
            console.log('[Settings] 打开 GPTMail 网站');
        });
    }

    // 手动设置 Cookie
    const btnSetCookieManual = document.getElementById('btn-set-cookie-manual');
    if (btnSetCookieManual) {
        btnSetCookieManual.addEventListener('click', async () => {
            const cookieInput = prompt(
                '⚠️ 请输入完整的 GPTMail Cookie（必须包含 cf_clearance）:\n\n' +
                '📋 获取方法:\n' +
                '1. 访问 https://mail.chatgpt.org.uk/\n' +
                '2. 打开浏览器开发者工具 (F12)\n' +
                '3. 切换到 Network 标签\n' +
                '4. 刷新页面，找到任意请求\n' +
                '5. 复制 Request Headers 中的完整 Cookie 值\n' +
                '6. 确保包含 cf_clearance=...\n\n' +
                '粘贴 Cookie:',
                savedCookie
            );

            if (cookieInput !== null) {
                const trimmedCookie = cookieInput.trim();

                if (trimmedCookie === '') {
                    alert('❌ Cookie 不能为空');
                    return;
                }

                // 验证是否包含 cf_clearance
                if (!trimmedCookie.includes('cf_clearance')) {
                    const confirm = window.confirm(
                        '⚠️ 警告：Cookie 中未找到 cf_clearance\n\n' +
                        'cf_clearance 是绕过 Cloudflare 验证的关键 Cookie。\n' +
                        '没有它，请求将会失败（403 错误）。\n\n' +
                        '是否仍要保存此 Cookie？'
                    );

                    if (!confirm) {
                        return;
                    }
                }

                // 使用 GPTMailConfig 保存 Cookie（持久化）
                const saved = await GPTMailConfig.saveCookie(trimmedCookie);

                if (saved) {
                    console.log('[Settings] ✓ GPTMail Cookie 已持久化保存（手动）');

                    // 显示详细信息
                    const hasCfClearance = trimmedCookie.includes('cf_clearance');
                    alert(
                        '✅ Cookie 已持久化保存！\n\n' +
                        `📊 Cookie 长度: ${trimmedCookie.length} 字符\n` +
                        `${hasCfClearance ? '✓ 包含 cf_clearance' : '⚠️ 缺少 cf_clearance'}`
                    );
                } else {
                    console.error('[Settings] ✗ Cookie 保存失败');
                    alert('❌ Cookie 保存失败，请重试');
                }

                // 刷新页面以显示状态
                this.renderCurrentTab();
            }
        });
    }

    // 清除 Cookie
    const btnClearCookie = document.getElementById('btn-clear-cookie');
    if (btnClearCookie) {
        btnClearCookie.addEventListener('click', async () => {
            if (confirm('确定要清除 GPTMail Cookie 吗？')) {
                // 使用 GPTMailConfig 清除 Cookie
                const cleared = await GPTMailConfig.clearCookie();

                if (cleared) {
                    console.log('[Settings] ✓ GPTMail Cookie 已清除');
                    alert('✅ Cookie 已清除！');
                } else {
                    console.error('[Settings] ✗ Cookie 清除失败');
                    alert('❌ Cookie 清除失败');
                }

                // 刷新页面以更新状态
                this.renderCurrentTab();
            }
        });
    }

    // 导出 GPTMail 配置文件
    const btnExportGPTMailConfig = document.getElementById('btn-export-gptmail-config');
    if (btnExportGPTMailConfig) {
        btnExportGPTMailConfig.addEventListener('click', async () => {
            try {
                const config = await GPTMailConfig.exportConfig();

                if (!config.cookie) {
                    alert('⚠️ 当前没有配置 Cookie，无法导出');
                    return;
                }

                const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gptmail-config-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);

                console.log('[Settings] GPTMail 配置已导出');
                alert('✅ 配置文件已导出！');
            } catch (error) {
                console.error('[Settings] 导出配置失败:', error);
                alert('❌ 导出失败: ' + error.message);
            }
        });
    }

    // 导入 GPTMail 配置文件
    const btnImportGPTMailConfig = document.getElementById('btn-import-gptmail-config');
    if (btnImportGPTMailConfig) {
        btnImportGPTMailConfig.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const text = await file.text();
                    const config = JSON.parse(text);

                    // 验证配置文件
                    if (!config.cookie) {
                        alert('❌ 无效的配置文件：缺少 Cookie');
                        return;
                    }

                    // 导入配置
                    const imported = await GPTMailConfig.importConfig(config);

                    if (imported) {
                        console.log('[Settings] GPTMail 配置已导入');
                        alert('✅ 配置导入成功！');
                        this.renderCurrentTab();
                    } else {
                        alert('❌ 配置导入失败');
                    }
                } catch (error) {
                    console.error('[Settings] 导入配置失败:', error);
                    alert('❌ 导入失败: ' + error.message);
                }
            };
            input.click();
        });
    }

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
};

// 渲染关于Tab
StripeHelperUI.prototype.renderAboutTab = function() {
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
            Made with ❤️ by chaogei666
        </div>
    `;
};

