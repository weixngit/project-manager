/**
 * 数据存储模块 - LocalStorage封装
 */

const Storage = {
    // 存储键名
    KEYS: {
        PROJECTS: 'pm_projects',           // 项目列表
        COSTS: 'pm_costs',                 // 成本记录
        PAYMENTS: 'pm_payments',           // 回款记录
        INVOICES: 'pm_invoices',           // 票据记录
        REMINDERS: 'pm_reminders',         // 提醒设置
        SETTINGS: 'pm_settings'            // 系统设置
    },

    // 初始化存储
    init() {
        Object.values(this.KEYS).forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
            }
        });
    },

    // 获取数据
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取数据失败:', e);
            return [];
        }
    },

    // 保存数据
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    },

    // 添加单条数据
    add(key, item) {
        const data = this.get(key);
        item.id = this.generateId();
        item.createdAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        data.push(item);
        this.set(key, data);
        return item;
    },

    // 更新单条数据
    update(key, id, updates) {
        const data = this.get(key);
        const index = data.findIndex(item => item.id === id);
        if (index > -1) {
            data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
            this.set(key, data);
            return data[index];
        }
        return null;
    },

    // 删除单条数据
    delete(key, id) {
        const data = this.get(key);
        const filtered = data.filter(item => item.id !== id);
        this.set(key, filtered);
        return filtered.length < data.length;
    },

    // 根据ID获取
    getById(key, id) {
        const data = this.get(key);
        return data.find(item => item.id === id);
    },

    // 生成唯一ID
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // 清空所有数据
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};

// 项目相关操作
const ProjectStore = {
    getAll() {
        return Storage.get(Storage.KEYS.PROJECTS);
    },

    getById(id) {
        return Storage.getById(Storage.KEYS.PROJECTS, id);
    },

    add(project) {
        project.status = project.status || '进行中';
        project.progress = project.progress || 0;
        return Storage.add(Storage.KEYS.PROJECTS, project);
    },

    update(id, updates) {
        return Storage.update(Storage.KEYS.PROJECTS, id, updates);
    },

    delete(id) {
        // 同时删除相关的成本、回款、票据记录
        const costs = CostStore.getByProjectId(id);
        costs.forEach(c => CostStore.delete(c.id));
        
        const payments = PaymentStore.getByProjectId(id);
        payments.forEach(p => PaymentStore.delete(p.id));
        
        const invoices = InvoiceStore.getByProjectId(id);
        invoices.forEach(i => InvoiceStore.delete(i.id));

        return Storage.delete(Storage.KEYS.PROJECTS, id);
    },

    // 获取进行中的项目
    getActive() {
        return this.getAll().filter(p => p.status === '进行中');
    },

    // 搜索项目
    search(keyword) {
        const projects = this.getAll();
        if (!keyword) return projects;
        return projects.filter(p => 
            p.name.includes(keyword) || 
            (p.client && p.client.includes(keyword))
        );
    }
};

// 成本记录相关操作
const CostStore = {
    getAll() {
        return Storage.get(Storage.KEYS.COSTS);
    },

    getByProjectId(projectId) {
        return this.getAll().filter(c => c.projectId === projectId);
    },

    add(cost) {
        cost.date = cost.date || new Date().toISOString().split('T')[0];
        return Storage.add(Storage.KEYS.COSTS, cost);
    },

    update(id, updates) {
        return Storage.update(Storage.KEYS.COSTS, id, updates);
    },

    delete(id) {
        return Storage.delete(Storage.KEYS.COSTS, id);
    },

    // 按类型统计
    getStatsByType(projectId) {
        const costs = this.getByProjectId(projectId);
        const stats = {};
        costs.forEach(c => {
            if (!stats[c.type]) {
                stats[c.type] = 0;
            }
            stats[c.type] += parseFloat(c.amount) || 0;
        });
        return stats;
    },

    // 获取项目总成本
    getTotalCost(projectId) {
        const costs = this.getByProjectId(projectId);
        return costs.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    }
};

// 回款记录相关操作
const PaymentStore = {
    getAll() {
        return Storage.get(Storage.KEYS.PAYMENTS);
    },

    getByProjectId(projectId) {
        return this.getAll().filter(p => p.projectId === projectId);
    },

    add(payment) {
        payment.status = payment.status || '待收款';
        payment.expectedDate = payment.expectedDate || '';
        payment.actualDate = payment.actualDate || '';
        return Storage.add(Storage.KEYS.PAYMENTS, payment);
    },

    update(id, updates) {
        return Storage.update(Storage.KEYS.PAYMENTS, id, updates);
    },

    delete(id) {
        return Storage.delete(Storage.KEYS.PAYMENTS, id);
    },

    // 获取待收款项（根据实际回款日期判断）
    getPending() {
        return this.getAll().filter(p => !p.actualDate || p.actualDate.trim() === '');
    },

    // 获取即将到期的回款（7天内）
    getUpcoming(days = 7) {
        const pending = this.getPending();
        const now = new Date();
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        return pending.filter(p => {
            if (!p.expectedDate) return false;
            const expected = new Date(p.expectedDate);
            return expected <= future && expected >= now;
        });
    },

    // 获取已逾期
    getOverdue() {
        const pending = this.getPending();
        const now = new Date();
        
        return pending.filter(p => {
            if (!p.expectedDate) return false;
            const expected = new Date(p.expectedDate);
            return expected < now;
        });
    },

    // 获取项目已回款总额（根据实际回款日期判断）
    getTotalPaid(projectId) {
        const payments = this.getByProjectId(projectId);
        return payments
            .filter(p => p.actualDate && p.actualDate.trim() !== '')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    },

    // 获取项目待回款总额（根据实际回款日期判断）
    getTotalPending(projectId) {
        const payments = this.getByProjectId(projectId);
        return payments
            .filter(p => !p.actualDate || p.actualDate.trim() === '')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    }
};

// 票据记录相关操作
const InvoiceStore = {
    getAll() {
        return Storage.get(Storage.KEYS.INVOICES);
    },

    getByProjectId(projectId) {
        return this.getAll().filter(i => i.projectId === projectId);
    },

    add(invoice) {
        invoice.type = invoice.type || '收到';
        invoice.date = invoice.date || new Date().toISOString().split('T')[0];
        return Storage.add(Storage.KEYS.INVOICES, invoice);
    },

    update(id, updates) {
        return Storage.update(Storage.KEYS.INVOICES, id, updates);
    },

    delete(id) {
        return Storage.delete(Storage.KEYS.INVOICES, id);
    },

    // 统计开票情况
    getInvoiceStats(projectId) {
        const invoices = this.getByProjectId(projectId);
        let inputAmount = 0, outputAmount = 0;
        let inputPu = 0, inputZh = 0, outputPu = 0, outputZh = 0;
        
        invoices.forEach(i => {
            const amt = parseFloat(i.amount) || 0;
            if (i.type === '收到普') { inputAmount += amt; inputPu += amt; }
            else if (i.type === '收到专') { inputAmount += amt; inputZh += amt; }
            else if (i.type === '开出普') { outputAmount += amt; outputPu += amt; }
            else if (i.type === '开出专') { outputAmount += amt; outputZh += amt; }
        });
        
        return { inputAmount, outputAmount, inputPu, inputZh, outputPu, outputZh };
    }
};

// 初始化
Storage.init();
