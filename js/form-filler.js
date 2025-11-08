// ==================== 表单填写函数 ====================

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

