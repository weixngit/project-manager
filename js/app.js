/**
 * 主应用逻辑
 */

const App = {
    // 初始化
    init() {
        this.updateStats();
        this.loadRecentProjects();
        this.setupReminder();
    },

    // 更新首页统计
    updateStats() {
        // 进行中项目数
        const activeProjects = ProjectStore.getActive();
        document.getElementById('total-projects').textContent = activeProjects.length;

        // 总利润
        const projects = ProjectStore.getAll();
        let totalProfit = 0;
        projects.forEach(p => {
            const profit = Utils.calculateProfit(p.id);
            if (profit) {
                totalProfit += profit.profit;
            }
        });
        document.getElementById('total-profit').textContent = Utils.formatMoney(totalProfit);

        // 待回款提醒数
        const upcoming = PaymentStore.getUpcoming(7);
        const overdue = PaymentStore.getOverdue();
        const alertCount = upcoming.length + overdue.length;
        document.getElementById('payment-alert').textContent = alertCount;
    },

    // 加载最近项目
    loadRecentProjects() {
        const container = document.getElementById('recent-projects');
        const projects = ProjectStore.getAll()
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5);

        if (projects.length === 0) {
            container.innerHTML = '<div class="empty-tip">暂无项目，点击"项目列表"新建</div>';
            return;
        }

        container.innerHTML = projects.map(p => `
            <a href="pages/project-detail.html?id=${p.id}" class="recent-item">
                <div>
                    <div class="project-name">${p.name}</div>
                    <div class="project-info" style="font-size: 12px; color: #999; margin-top: 4px;">
                        合同金额: ${Utils.formatMoney(p.contractAmount)}
                    </div>
                </div>
                <span class="project-status ${Utils.getStatusTag(p.status)}">${p.status}</span>
            </a>
        `).join('');
    },

    // 设置提醒检查
    setupReminder() {
        // 页面加载时检查提醒
        this.checkReminders();
        
        // 每5分钟检查一次
        setInterval(() => this.checkReminders(), 5 * 60 * 1000);
    },

    // 检查提醒
    checkReminders() {
        const overdue = PaymentStore.getOverdue();
        const upcoming = PaymentStore.getUpcoming(3);
        
        if (overdue.length > 0) {
            console.log('逾期提醒:', overdue);
        }
        if (upcoming.length > 0) {
            console.log('即将到期:', upcoming);
        }
    },

    // 刷新页面
    refresh() {
        this.updateStats();
        this.loadRecentProjects();
    }
};

// 不在这里自动初始化，等云端同步完成后在 index.html 里手动调用
// document.addEventListener('DOMContentLoaded', () => {
//     App.init();
// });
