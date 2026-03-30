/**
 * 工具函数模块
 */

const Utils = {
    // 格式化金额
    formatMoney(amount, showSign = false) {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '¥0';
        }
        const num = parseFloat(amount);
        const formatted = Math.abs(num).toLocaleString('zh-CN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        const sign = showSign && num > 0 ? '+' : '';
        return sign + '¥' + formatted;
    },

    // 格式化日期
    formatDate(dateStr, format = 'short') {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        
        if (format === 'short') {
            return `${date.getMonth() + 1}月${date.getDate()}日`;
        } else if (format === 'full') {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        return dateStr;
    },

    // 格式化相对时间
    formatRelativeTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = date - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        if (days < 0) {
            return `已逾期${Math.abs(days)}天`;
        } else if (days === 0) {
            return '今天';
        } else if (days === 1) {
            return '明天';
        } else if (days <= 7) {
            return `${days}天后`;
        } else if (days <= 30) {
            return `${Math.ceil(days / 7)}周后`;
        } else {
            return `${Math.ceil(days / 30)}月后`;
        }
    },

    // 计算利润
    calculateProfit(projectId) {
        const project = ProjectStore.getById(projectId);
        if (!project) return null;
        
        const contractAmount = parseFloat(project.contractAmount) || 0;
        const totalCost = CostStore.getTotalCost(projectId);
        const totalTax = parseFloat(project.taxAmount) || 0;
        const profit = contractAmount - totalCost - totalTax;
        const profitRate = contractAmount > 0 ? (profit / contractAmount * 100) : 0;
        
        return {
            contractAmount,
            totalCost,
            totalTax,
            profit,
            profitRate: profitRate.toFixed(1)
        };
    },

    // 计算项目预测
    calculatePrediction(data) {
        const contractAmount = parseFloat(data.contractAmount) || 0;
        const estimatedCosts = {
            labor: parseFloat(data.estimatedLabor) || 0,
            material: parseFloat(data.estimatedMaterial) || 0,
            business: parseFloat(data.estimatedBusiness) || 0,
            machinery: parseFloat(data.estimatedMachinery) || 0,
            transport: parseFloat(data.estimatedTransport) || 0,
            other: parseFloat(data.estimatedOther) || 0,
            tax: parseFloat(data.estimatedTax) || 0
        };
        
        const totalEstimatedCost = Object.values(estimatedCosts).reduce((a, b) => a + b, 0);
        const estimatedProfit = contractAmount - totalEstimatedCost;
        const profitRate = contractAmount > 0 ? (estimatedProfit / contractAmount * 100) : 0;
        
        // 风险评估
        const risks = [];
        if (profitRate < 10) {
            risks.push({ level: 'high', text: '利润率偏低，需谨慎控制成本' });
        }
        if (profitRate < 0) {
            risks.push({ level: 'danger', text: '项目预计亏损，建议重新评估' });
        }
        if (estimatedCosts.business / contractAmount > 0.1) {
            risks.push({ level: 'medium', text: '商务费用占比较高' });
        }
        if (!data.hasDownPayment) {
            risks.push({ level: 'low', text: '无预付款，资金压力较大' });
        }
        
        return {
            contractAmount,
            estimatedCosts,
            totalEstimatedCost,
            estimatedProfit,
            profitRate: profitRate.toFixed(1),
            risks,
            isViable: profitRate >= 10
        };
    },

    // 获取状态标签样式
    getStatusTag(status) {
        const statusMap = {
            '进行中': 'tag-primary',
            '已完成': 'tag-success',
            '已暂停': 'tag-warning',
            '已取消': 'tag-danger',
            '待收款': 'tag-warning',
            '已收款': 'tag-success'
        };
        return statusMap[status] || 'tag-primary';
    },

    // 生成唯一ID
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // 防抖函数
    debounce(fn, delay = 300) {
        let timer = null;
        return function(...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    // 显示提示
    showToast(message, duration = 2000) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.75);
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeIn 0.3s;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // 确认对话框
    confirm(message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: #fff;
                border-radius: 12px;
                padding: 20px;
                width: 280px;
                text-align: center;
            `;
            dialog.innerHTML = `
                <p style="margin-bottom: 20px; font-size: 15px;">${message}</p>
                <div style="display: flex; gap: 12px;">
                    <button class="btn" style="flex:1; background: #f5f5f5; color: #666;" onclick="this.closest('.confirm-overlay').dataset.result='cancel'; this.closest('.confirm-overlay').remove();">取消</button>
                    <button class="btn btn-primary" style="flex:1;" onclick="this.closest('.confirm-overlay').dataset.result='ok'; this.closest('.confirm-overlay').remove();">确定</button>
                </div>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            const observer = new MutationObserver(() => {
                if (!document.body.contains(overlay)) {
                    resolve(overlay.dataset.result === 'ok');
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true });
        });
    },

    // 解析URL参数
    getUrlParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    }
};

// 成本类型配置
const COST_TYPES = [
    { value: 'labor', label: '人工分包款', icon: '👷' },
    { value: 'material', label: '设备材料费', icon: '📦' },
    { value: 'business', label: '商务费', icon: '🤝' },
    { value: 'machinery', label: '机械租赁', icon: '🚜' },
    { value: 'transport', label: '交通费', icon: '🚗' },
    { value: 'other', label: '杂费', icon: '📋' }
];

// 项目状态配置
const PROJECT_STATUS = [
    { value: '进行中', color: '#1890ff' },
    { value: '已完成', color: '#52c41a' },
    { value: '已暂停', color: '#faad14' },
    { value: '已取消', color: '#ff4d4f' }
];

// 付款方式配置
const PAYMENT_TYPES = [
    { value: 'progress', label: '进度款', desc: '按工程进度支付' },
    { value: 'milestone', label: '节点款', desc: '完成特定节点支付' },
    { value: 'final', label: '尾款', desc: '完工验收后支付' },
    { value: 'other', label: '其他', desc: '其他付款方式' }
];
