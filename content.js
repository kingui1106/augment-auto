// ==UserScript==
// @name         Stripe Checkout 智能填表助手 Pro - 浏览器扩展版
// @namespace    http://tampermonkey.net/
// @version      2.0.1
// @description  Stripe支付表单自动填写工具 - 浏览器扩展版，支持全网页运行
// @author       chaogei666
// @match        <all_urls>
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('🚀 Stripe智能填表助手 Pro v2.0.1 已加载');
    console.log('✨ 浏览器扩展版本 - 全网页模式');
    console.log('📍 当前页面:', window.location.href);

    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExtension);
    } else {
        initExtension();
    }

    function initExtension() {
        console.log('📦 初始化扩展...');
        
        // 创建并初始化UI
        const ui = new StripeHelperUI();
        ui.init();
        
        console.log('✅ Stripe助手已就绪！');
    }
})();

