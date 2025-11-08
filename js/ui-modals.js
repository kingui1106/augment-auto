// ==================== UI模态框 ====================

// 显示卡头编辑模态框
StripeHelperUI.prototype.showCardModal = async function(editId = null) {
    const isEdit = editId !== null;
    const bins = await DataManager.getCardBins();
    const bin = isEdit ? bins.find(b => b.id === editId) : null;

    const modal = this.createModal({
        title: isEdit ? '编辑卡头' : '添加卡头',
        content: `
            <div class="form-group">
                <label class="form-label">卡头名称</label>
                <input type="text" class="form-input" id="modal-bin-name" value="${bin ? bin.name : ''}" placeholder="例如：Visa测试卡">
            </div>
            <div class="form-group">
                <label class="form-label">卡号前缀（BIN）</label>
                <input type="text" class="form-input" id="modal-bin-prefix" value="${bin ? bin.prefix : ''}" placeholder="例如：400000">
            </div>
            <div class="form-group">
                <label class="form-label">卡号总长度</label>
                <input type="number" class="form-input" id="modal-bin-length" value="${bin ? bin.totalLength : '16'}" min="13" max="19">
            </div>
            <div class="form-group">
                <label class="form-label">CVC长度</label>
                <input type="number" class="form-input" id="modal-bin-cvc" value="${bin ? bin.cvcLength : '3'}" min="3" max="4">
            </div>
        `,
        onConfirm: async () => {
            const data = {
                name: document.getElementById('modal-bin-name').value.trim(),
                prefix: document.getElementById('modal-bin-prefix').value.trim(),
                totalLength: parseInt(document.getElementById('modal-bin-length').value),
                cvcLength: parseInt(document.getElementById('modal-bin-cvc').value),
                enabled: bin ? bin.enabled : true
            };

            if (!data.name || !data.prefix) {
                alert('请填写完整信息');
                return false;
            }

            if (isEdit) {
                await DataManager.updateCardBin(editId, data);
            } else {
                await DataManager.addCardBin(data);
            }

            this.renderCardsTab();
            return true;
        }
    });

    modal.show();
};

