// ==================== 工具函数 ====================

// 随机选择一个启用的卡BIN
async function getRandomCardBin() {
    const enabled = await DataManager.getEnabledCardBins();
    if (enabled.length === 0) {
        const allBins = await DataManager.getCardBins();
        return allBins[0];
    }
    const randomIndex = Math.floor(Math.random() * enabled.length);
    return enabled[randomIndex];
}

function generateRandomMonth() {
    return String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
}

function generateRandomYear() {
    const currentYear = new Date().getFullYear();
    return String(currentYear + Math.floor(Math.random() * 5) + 1).slice(-2);
}

function generateRandomCVC(length) {
    const max = Math.pow(10, length) - 1;
    return String(Math.floor(Math.random() * max)).padStart(length, '0');
}

// Luhn算法生成有效信用卡号
function generateLuhnCardNumber(prefix, totalLength) {
    let cardNumber = prefix;

    while (cardNumber.length < totalLength - 1) {
        cardNumber += Math.floor(Math.random() * 10);
    }

    cardNumber += '0';

    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return cardNumber.slice(0, -1) + checkDigit;
}

