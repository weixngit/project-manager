/**
 * 云端存储模块 - Supabase API
 */

const CloudStorage = {
    // Supabase 配置
    URL: 'https://azspvriaxhlllgtphwgv.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6c3B2cmlheGhsbGxndHBod2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTM1OTMsImV4cCI6MjA5MDQyOTU5M30.6F3W6dYQ8DdtWRFBGBIejcms2XCvdMxWBvmOX_AMlAc',
    
    // 请求头
    getHeaders() {
        return {
            'apikey': this.ANON_KEY,
            'Authorization': `Bearer ${this.ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    },
    
    // 初始化（测试连接）
    async init() {
        try {
            const response = await fetch(`${this.URL}/rest/v1/projects?limit=1`, {
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                console.log('Supabase connected successfully');
                this.enable();
                
                // 首次同步本地数据到云端
                const projects = Storage.get(Storage.KEYS.PROJECTS);
                if (projects.length > 0) {
                    await this.syncFromLocal();
                }
                
                return true;
            }
        } catch (e) {
            console.error('Supabase init failed:', e);
        }
        return false;
    },
    
    // 项目操作
    projects: {
        async getAll() {
            const response = await fetch(`${CloudStorage.URL}/rest/v1/projects?order=updated_at.desc`, {
                headers: CloudStorage.getHeaders()
            });
            return await response.json();
        },
        
        async getById(id) {
            const response = await fetch(`${CloudStorage.URL}/rest/v1/projects?id=eq.${id}`, {
                headers: CloudStorage.getHeaders()
            });
            const data = await response.json();
            return data[0] || null;
        },
        
        async add(project) {
            const dbProject = {
                id: project.id,
                name: project.name,
                contract_amount: parseFloat(project.contractAmount) || 0,
                client: project.client || '',
                manager: project.manager || '',
                start_date: project.startDate || null,
                end_date: project.endDate || null,
                status: project.status || '进行中',
                progress: project.progress || 0,
                tax_amount: parseFloat(project.taxAmount) || 0,
                remark: project.remark || '',
                created_at: project.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const response = await fetch(`${CloudStorage.URL}/rest/v1/projects`, {
                method: 'POST',
                headers: CloudStorage.getHeaders(),
                body: JSON.stringify(dbProject)
            });
            
            return response.ok;
        },
        
        async update(id, updates) {
            const dbUpdates = {
                updated_at: new Date().toISOString()
            };
            
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.contractAmount !== undefined) dbUpdates.contract_amount = parseFloat(updates.contractAmount) || 0;
            if (updates.client !== undefined) dbUpdates.client = updates.client;
            if (updates.manager !== undefined) dbUpdates.manager = updates.manager;
            if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
            if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
            if (updates.taxAmount !== undefined) dbUpdates.tax_amount = parseFloat(updates.taxAmount) || 0;
            if (updates.remark !== undefined) dbUpdates.remark = updates.remark;
            
            const response = await fetch(`${CloudStorage.URL}/rest/v1/projects?id=eq.${id}`, {
                method: 'PATCH',
                headers: CloudStorage.getHeaders(),
                body: JSON.stringify(dbUpdates)
            });
            
            return response.ok;
        },
        
        async delete(id) {
            const response = await fetch(`${CloudStorage.URL}/rest/v1/projects?id=eq.${id}`, {
                method: 'DELETE',
                headers: CloudStorage.getHeaders()
            });
            
            return response.ok;
        }
    },
    
    // 成本操作
    costs: {
        async getByProjectId(projectId) {
            const response = await fetch(`${CloudStorage.URL}/rest/v1/costs?project_id=eq.${projectId}&order=date.desc`, {
                headers: CloudStorage.getHeaders()
            });
            return await response.json();
        },
        
        async add(cost) {
            const dbCost = {
                id: cost.id,
                project_id: cost.projectId,
                type: cost.type,
                amount: parseFloat(cost.amount) || 0,
                date: cost.date || null,
                remark: cost.remark || '',
                created_at: cost.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const response = await fetch(`${CloudStorage.URL}/rest/v1/costs`, {
                method: 'POST',
                headers: CloudStorage.getHeaders(),
                body: JSON.stringify(dbCost)
            });
            
            return response.ok;
        },
        
        async delete(id) {
            const response = await fetch(`${CloudStorage.URL}/rest/v1/costs?id=eq.${id}`, {
                method: 'DELETE',
                headers: CloudStorage.getHeaders()
            });
            
            return response.ok;
        }
    },
    
    // 回款操作
    payments: {
        async getByProjectId(projectId) {
            const response = await fetch(`${CloudStorage.URL}/rest/v1/payments?project_id=eq.${projectId}&order=expected_date.desc`, {
                headers: CloudStorage.getHeaders()
            });
            return await response.json();
        },
        
        async getAll() {
            const response = await fetch(`${CloudStorage.URL}/rest/v1/payments?order=expected_date.desc`, {
                headers: CloudStorage.getHeaders()
            });
            return await response.json();
        },
        
        async add(payment) {
            const dbPayment = {
                id: payment.id,
                project_id: payment.projectId,
                amount: parseFloat(payment.amount) || 0,
                type: payment.type || 'final',
                expected_date: payment.expectedDate || null,
                actual_date: payment.actualDate || null,
                status: payment.status || '待收款',
                remark: payment.remark || '',
                created_at: payment.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const response = await fetch(`${CloudStorage.URL}/rest/v1/payments`, {
                method: 'POST',
                headers: CloudStorage.getHeaders(),
                body: JSON.stringify(dbPayment)
            });
            
            return response.ok;
        },
        
        async update(id, updates) {
            const dbUpdates = {
                updated_at: new Date().toISOString()
            };
            
            if (updates.amount !== undefined) dbUpdates.amount = parseFloat(updates.amount) || 0;
            if (updates.type !== undefined) dbUpdates.type = updates.type;
            if (updates.expectedDate !== undefined) dbUpdates.expected_date = updates.expectedDate;
            if (updates.actualDate !== undefined) dbUpdates.actual_date = updates.actualDate;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.remark !== undefined) dbUpdates.remark = updates.remark;
            
            const response = await fetch(`${CloudStorage.URL}/rest/v1/payments?id=eq.${id}`, {
                method: 'PATCH',
                headers: CloudStorage.getHeaders(),
                body: JSON.stringify(dbUpdates)
            });
            
            return response.ok;
        },
        
        async delete(id) {
            const response = await fetch(`${CloudStorage.URL}/rest/v1/payments?id=eq.${id}`, {
                method: 'DELETE',
                headers: CloudStorage.getHeaders()
            });
            
            return response.ok;
        }
    },
    
    // 票据操作
    invoices: {
        async getByProjectId(projectId) {
            const response = await fetch(`${CloudStorage.URL}/rest/v1/invoices?project_id=eq.${projectId}&order=date.desc`, {
                headers: CloudStorage.getHeaders()
            });
            return await response.json();
        },
        
        async add(invoice) {
            const dbInvoice = {
                id: invoice.id,
                project_id: invoice.projectId,
                type: invoice.type,
                amount: parseFloat(invoice.amount) || 0,
                number: invoice.number || '',
                date: invoice.date || null,
                party: invoice.party || '',
                remark: invoice.remark || '',
                created_at: invoice.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const response = await fetch(`${CloudStorage.URL}/rest/v1/invoices`, {
                method: 'POST',
                headers: CloudStorage.getHeaders(),
                body: JSON.stringify(dbInvoice)
            });
            
            return response.ok;
        },
        
        async delete(id) {
            const response = await fetch(`${CloudStorage.URL}/rest/v1/invoices?id=eq.${id}`, {
                method: 'DELETE',
                headers: CloudStorage.getHeaders()
            });
            
            return response.ok;
        }
    },
    
    // 同步本地数据到云端
    async syncFromLocal() {
        try {
            // 同步项目
            const projects = Storage.get(Storage.KEYS.PROJECTS);
            for (const p of projects) {
                await this.projects.add(p);
            }
            
            // 同步成本
            const costs = Storage.get(Storage.KEYS.COSTS);
            for (const c of costs) {
                await this.costs.add(c);
            }
            
            // 同步回款
            const payments = Storage.get(Storage.KEYS.PAYMENTS);
            for (const p of payments) {
                await this.payments.add(p);
            }
            
            // 同步票据
            const invoices = Storage.get(Storage.KEYS.INVOICES);
            for (const i of invoices) {
                await this.invoices.add(i);
            }
            
            console.log('Sync from local completed');
            return true;
        } catch (e) {
            console.error('Sync from local failed:', e);
            return false;
        }
    },
    
    // 从云端同步到本地
    async syncToLocal() {
        try {
            const projects = await this.projects.getAll();
            const payments = await this.payments.getAll();
            
            // 转换格式并保存到本地
            const localProjects = projects.map(p => ({
                id: p.id,
                name: p.name,
                contractAmount: p.contract_amount,
                client: p.client,
                manager: p.manager,
                startDate: p.start_date,
                endDate: p.end_date,
                status: p.status,
                progress: p.progress,
                taxAmount: p.tax_amount,
                remark: p.remark,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }));
            
            Storage.set(Storage.KEYS.PROJECTS, localProjects);
            
            console.log('Sync to local completed');
            return true;
        } catch (e) {
            console.error('Sync to local failed:', e);
            return false;
        }
    },
    
    // 启用云同步
    enable() {
        localStorage.setItem('pm_cloud_enabled', 'true');
    },
    
    // 禁用云同步
    disable() {
        localStorage.setItem('pm_cloud_enabled', 'false');
    },
    
    // 检查是否启用云同步
    isEnabled() {
        return localStorage.getItem('pm_cloud_enabled') === 'true';
    }
};

// 初始化云同步
(async function initCloud() {
    await CloudStorage.init();
})();
