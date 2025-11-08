// ==================== 提交按钮点击函数 ====================

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

