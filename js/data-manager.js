// ==================== 数据存储管理器 ====================

const DataManager = {
    // 存储 API 引用
    storage: StorageAPI,

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

    // 设置激活的配置
    async setActiveProfile(id) {
        const profiles = await this.getProfiles();
        profiles.forEach(p => {
            p.isActive = (p.id === id);
        });
        await this.saveProfiles(profiles);
    },

    // 获取当前激活的配置
    async getActiveProfile() {
        const profiles = await this.getProfiles();
        return profiles.find(p => p.isActive) || profiles[0];
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

