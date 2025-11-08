/**
 * GPTMail 配置管理模块
 * 确保 Cookie 持久化保存
 */

const GPTMailConfig = {
    // 配置文件路径
    CONFIG_FILE: 'gptmail-config.json',
    
    // 默认配置
    DEFAULT_CONFIG: {
        cookie: '',
        lastUpdated: '',
        userAgent: '',
        note: 'GPTMail Cookie 配置文件 - 请勿手动修改'
    },

    /**
     * 保存 Cookie 到持久化存储
     * @param {string} cookie - Cookie 字符串
     * @returns {Promise<boolean>}
     */
    async saveCookie(cookie) {
        try {
            const config = {
                cookie: cookie,
                lastUpdated: new Date().toISOString(),
                userAgent: navigator.userAgent,
                note: 'GPTMail Cookie 配置文件 - 自动生成'
            };

            // 1. 保存到 chrome.storage.local
            await chrome.storage.local.set({ 
                'gptmail_cookie': cookie,
                'gptmail_config': config
            });

            console.log('[GPTMail Config] Cookie 已保存到 chrome.storage.local');
            console.log('[GPTMail Config] Cookie 长度:', cookie.length);
            console.log('[GPTMail Config] 更新时间:', config.lastUpdated);

            // 2. 验证保存是否成功
            const saved = await chrome.storage.local.get(['gptmail_cookie']);
            if (saved.gptmail_cookie === cookie) {
                console.log('[GPTMail Config] ✓ Cookie 持久化成功');
                return true;
            } else {
                console.error('[GPTMail Config] ✗ Cookie 持久化失败');
                return false;
            }
        } catch (error) {
            console.error('[GPTMail Config] 保存 Cookie 失败:', error);
            return false;
        }
    },

    /**
     * 获取保存的 Cookie
     * @returns {Promise<string>}
     */
    async getCookie() {
        try {
            // 从 chrome.storage.local 读取
            const result = await chrome.storage.local.get(['gptmail_cookie']);
            const cookie = result.gptmail_cookie || '';

            if (cookie) {
                console.log('[GPTMail Config] Cookie 已加载，长度:', cookie.length);
                
                // 检查是否包含 cf_clearance
                if (cookie.includes('cf_clearance')) {
                    console.log('[GPTMail Config] ✓ Cookie 包含 cf_clearance');
                } else {
                    console.warn('[GPTMail Config] ⚠️ Cookie 不包含 cf_clearance');
                }
            } else {
                console.warn('[GPTMail Config] ⚠️ Cookie 未配置');
            }

            return cookie;
        } catch (error) {
            console.error('[GPTMail Config] 获取 Cookie 失败:', error);
            return '';
        }
    },

    /**
     * 获取完整配置
     * @returns {Promise<Object>}
     */
    async getConfig() {
        try {
            const result = await chrome.storage.local.get(['gptmail_config']);
            return result.gptmail_config || this.DEFAULT_CONFIG;
        } catch (error) {
            console.error('[GPTMail Config] 获取配置失败:', error);
            return this.DEFAULT_CONFIG;
        }
    },

    /**
     * 清除 Cookie
     * @returns {Promise<boolean>}
     */
    async clearCookie() {
        try {
            await chrome.storage.local.remove(['gptmail_cookie', 'gptmail_config']);
            console.log('[GPTMail Config] Cookie 已清除');
            return true;
        } catch (error) {
            console.error('[GPTMail Config] 清除 Cookie 失败:', error);
            return false;
        }
    },

    /**
     * 导出配置到 JSON 文件
     * @returns {Promise<Object>}
     */
    async exportConfig() {
        const config = await this.getConfig();
        console.log('[GPTMail Config] 导出配置:', config);
        return config;
    },

    /**
     * 从 JSON 文件导入配置
     * @param {Object} config - 配置对象
     * @returns {Promise<boolean>}
     */
    async importConfig(config) {
        try {
            if (!config || !config.cookie) {
                console.error('[GPTMail Config] 无效的配置文件');
                return false;
            }

            const success = await this.saveCookie(config.cookie);
            if (success) {
                console.log('[GPTMail Config] 配置导入成功');
                return true;
            } else {
                console.error('[GPTMail Config] 配置导入失败');
                return false;
            }
        } catch (error) {
            console.error('[GPTMail Config] 导入配置失败:', error);
            return false;
        }
    },

    /**
     * 验证 Cookie 是否有效
     * @param {string} cookie - Cookie 字符串
     * @returns {boolean}
     */
    validateCookie(cookie) {
        if (!cookie || cookie.trim() === '') {
            return false;
        }

        // 检查是否包含必要的字段
        const requiredFields = ['cf_clearance'];
        for (const field of requiredFields) {
            if (!cookie.includes(field)) {
                console.warn(`[GPTMail Config] Cookie 缺少必要字段: ${field}`);
                return false;
            }
        }

        return true;
    }
};

