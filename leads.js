// SoloPrice Pro - Leads Module (Radar à Prospects)

const Leads = {
    lastContainerId: 'leads-content',

    render(containerId = 'leads-content') {
        this.lastContainerId = containerId;
        const container = document.getElementById(containerId);
        if (!container) return;

        const leads = Storage.getLeads();

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">${i18n.t('leads.title')}</h1>
                    <p class="page-subtitle">${i18n.t('leads.subtitle')}</p>
                </div>
                <button class="button-primary" onclick="Leads.showAddForm()">
                    <i class="fas fa-plus"></i> ${i18n.t('leads.btn.new')}
                </button>
            </div>

            <div id="lead-form-container"></div>

            <div class="leads-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                ${leads.length > 0 ? leads.map(lead => this.renderLeadCard(lead)).join('') : `
                    <div class="empty-state glass" style="grid-column: 1 / -1; padding: 4rem 2rem; border-radius: 20px; text-align: center; border: 1px dashed var(--border);">
                        <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                            <i class="fas fa-funnel-dollar" style="font-size: 2rem; color: var(--text-muted);"></i>
                        </div>
                        <h3 style="margin-bottom: 0.5rem;">${i18n.t('leads.empty.title')}</h3>
                        <p style="color: var(--text-muted); margin-bottom: 2rem;">${i18n.t('leads.empty.desc')}</p>
                        <button class="button-secondary" onclick="Leads.showAddForm()">${i18n.t('leads.empty.btn')}</button>
                    </div>
                `}
            </div>
        `;
    },

    renderLeadCard(lead) {
        const statusConfig = {
            cold: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', label: i18n.t('leads.status.cold'), icon: 'fa-seedling' },
            warm: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: i18n.t('leads.status.warm'), icon: 'fa-fire' },
            won: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', label: i18n.t('leads.status.won'), icon: 'fa-trophy' }
        };
        const s = statusConfig[lead.status] || statusConfig.cold;

        const nameParts = (lead.name || '?').trim().split(' ');
        const initials = nameParts.length >= 2
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : (lead.name || '?')[0].toUpperCase();

        return `
        <div class="lead-card glass" style="
            border-radius: 20px; border: 1px solid rgba(255,255,255,0.07);
            background: rgba(255,255,255,0.02); overflow: hidden;
            transition: all 0.25s ease; display: flex; flex-direction: column;
            border-left: 4px solid ${s.color};
        " onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.3)'"
           onmouseout="this.style.transform='';this.style.boxShadow=''">

            <div style="padding: 1.5rem 1.5rem 1rem; display: flex; gap: 1rem; align-items: flex-start;">
                <div style="width:46px;height:46px;border-radius:13px;flex-shrink:0;background:linear-gradient(135deg,${s.color}33,${s.color}11);border:1px solid ${s.border};display:flex;align-items:center;justify-content:center;font-size:0.95rem;font-weight:900;color:${s.color};">${initials}</div>
                <div style="flex:1;min-width:0;">
                    <h3 style="margin:0;font-size:1rem;font-weight:700;color:var(--white);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(lead.name)}</h3>
                    <p style="margin:3px 0 0;font-size:0.77rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(lead.activity || i18n.t('leads.label.activity_empty'))}</p>
                </div>
                <span style="background:${s.bg};color:${s.color};border:1px solid ${s.border};padding:4px 9px;border-radius:20px;font-size:0.63rem;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;flex-shrink:0;display:flex;align-items:center;gap:4px;">
                    <i class="fas ${s.icon}" style="font-size:0.55rem;"></i>${s.label}
                </span>
            </div>

            <div style="padding:0 1.5rem 1.2rem;display:flex;flex-direction:column;gap:6px;">
                ${lead.email ? `<div style="display:flex;align-items:center;gap:8px;font-size:0.81rem;color:var(--text-muted);"><i class="far fa-envelope" style="width:13px;color:${s.color};opacity:0.7;"></i><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this.escapeHtml(lead.email)}</span></div>` : ''}
                ${lead.phone ? `<div style="display:flex;align-items:center;gap:8px;font-size:0.81rem;color:var(--text-muted);"><i class="fas fa-phone-alt" style="width:13px;color:${s.color};opacity:0.7;"></i><span>${this.escapeHtml(lead.phone)}</span></div>` : ''}
            </div>

            <div style="display:flex;gap:0.5rem;padding:1rem 1.5rem;border-top:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.15);align-items:center;margin-top:auto;">
                <div style="display:flex;gap:0.4rem;flex:1;flex-wrap:wrap;">
                    ${lead.status === 'cold'
                ? `<button onclick="Leads.updateStatus('${lead.id}','warm')" class="button-secondary sm" style="padding:5px 12px; font-size: 0.7rem; border-color: rgba(245,158,11,0.3); color: #f59e0b;"><i class="fas fa-fire"></i> ${i18n.t('leads.btn.negociation')}</button>`
                : `<button onclick="Leads.updateStatus('${lead.id}','cold')" class="button-secondary sm" style="padding:5px 12px; font-size: 0.7rem; border-color: rgba(96,165,250,0.3); color: #60a5fa;"><i class="fas fa-seedling"></i> ${i18n.t('leads.btn.contact')}</button>`
            }
                    <button onclick="Leads.convertToQuote('${lead.id}')" class="button-primary small" style="padding:5px 12px; font-size: 0.7rem;"><i class="fas fa-file-invoice"></i> ${i18n.t('leads.btn.quote')}</button>
                    <button onclick="Leads.convertToClient('${lead.id}')" class="button-secondary sm" style="padding:5px 12px; font-size: 0.7rem; border-color: rgba(16,185,129,0.3); color: #10b981;"><i class="fas fa-user-check"></i> ${i18n.t('leads.btn.convert')}</button>
                </div>
                <button onclick="Leads.delete('${lead.id}')" style="width:32px;height:32px;border-radius:10px;border:none;background:rgba(239,68,68,0.1);color:#ef4444;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;flex-shrink:0;" onmouseover="this.style.background='#ef4444';this.style.color='white'" onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444'">
                    <i class="fas fa-trash-alt" style="font-size:0.75rem;"></i>
                </button>
            </div>
        </div>`;
    },


    showAddForm() {
        if (typeof App !== 'undefined' && !App.enforceLimit('leads')) {
            return;
        }

        const container = document.getElementById('lead-form-container');
        container.innerHTML = `
            <div class="form-card glass" style="margin-bottom: 2rem; animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); background: rgba(255, 255, 255, 0.03); border: 1px solid var(--primary-glass); box-shadow: 0 20px 50px rgba(0,0,0,0.3); border-radius: 20px;">
                <div class="form-header" style="border-bottom: 1px solid var(--primary-glass); padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--primary-light);"><i class="fas fa-user-plus" style="margin-right: 10px;"></i> ${i18n.t('leads.form.title')}</h3>
                    <button class="btn-close" onclick="Leads.hideForm()" style="background: none; border: none; color: white; cursor: pointer; opacity: 0.6; transition: opacity 0.2s;"></button>
                </div>
                <form onsubmit="Leads.save(event)" style="padding: 2rem;">
                    <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">${i18n.t('leads.form.label.name')}</label>
                            <input type="text" name="name" class="modern-input" required placeholder="Ex: Jean Dupont" style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">${i18n.t('leads.form.label.activity')}</label>
                            <input type="text" name="activity" class="modern-input" placeholder="Ex: Boulangerie, Startup..." style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">${i18n.t('leads.form.label.email')}</label>
                            <input type="email" name="email" class="modern-input" placeholder="Ex: contact@email.com" style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">${i18n.t('leads.form.label.phone')}</label>
                            <input type="tel" name="phone" class="modern-input" placeholder="Ex: 06 00 00 00 00" style="width: 100%;">
                        </div>
                    </div>
                    <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2.5rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2rem;">
                        <button type="button" class="button-outline" onclick="Leads.hideForm()" style="min-width: 120px;">${i18n.t('clients.btn.close')}</button>
                        <button type="submit" class="button-primary" style="min-width: 200px; box-shadow: var(--primary-shadow);"> ${i18n.t('leads.form.btn.save')}</button>
                    </div>
                </form>
            </div>
        `;
        container.scrollIntoView({ behavior: 'smooth' });
    },

    async save(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const leadData = {
            name: formData.get('name'),
            activity: formData.get('activity'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            status: 'cold'
        };

        await Storage.addLead(leadData);
        App.showNotification(i18n.t('leads.notify.added'), 'success');
        this.hideForm();
        this.render(this.lastContainerId);
    },

    async updateStatus(id, newStatus) {
        await Storage.updateLead(id, { status: newStatus });
        App.showNotification(i18n.t('leads.notify.status_updated'), 'success');

        // Qualification automatique : si 'won', on convertit en client
        if (newStatus === 'won') {
            const lead = (Storage.getLeads() || []).find(l => l.id === id);
            if (lead) {
                setTimeout(() => {
                    if (confirm(i18n.t('leads.confirm.conversion', { name: lead.name }))) {
                        this.convertToClient(id);
                    }
                }, 500);
            }
        }

        this.render(this.lastContainerId);
    },

    async convertToClient(id) {
        if (!confirm(i18n.t('leads.confirm.convert_client'))) return;

        const lead = Storage.getLeads().find(l => l.id === id);
        if (lead) {
            // Add to clients
            await Storage.addClient({
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                notes: lead.activity ? `Activité: ${lead.activity} ` : ''
            });

            // Delete from leads
            await Storage.deleteLead(id);

            App.showNotification(i18n.t('leads.notify.converted'), 'success');
            App.navigateTo('clients');
        }
    },

    async delete(id) {
        if (confirm(i18n.t('leads.confirm.delete'))) {
            await Storage.deleteLead(id);
            this.render(this.lastContainerId);
        }
    },

    hideForm() {
        document.getElementById('lead-form-container').innerHTML = '';
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    async convertToQuote(id) {
        try {
            const leads = Storage.getLeads();
            const lead = leads.find(l => l.id === id);

            if (!lead) return;

            // 1. Assurer que c'est un client (requis pour lier un devis)
            let client = (Storage.getClients() || []).find(c => c.name === lead.name || (lead.email && c.email === lead.email));

            if (!client) {
                console.log('[LEADS] Creating client for quote context...');
                client = await Storage.addClient({
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    notes: lead.activity ? `Activité: ${lead.activity} ` : ''
                });
            }

            if (!client || !client.id) throw new Error('Impossible de préparer le contexte client.');

            // 2. Passage en "Négociation" si ce n'est pas déjà le cas
            if (lead.status === 'cold') {
                await this.updateStatus(id, 'warm');
            }

            App.showNotification(i18n.t('leads.notify.preparing_quote'), 'info');

            // 3. Rediriger vers le FORMULAIRE de nouveau devis (pas un devis vide)
            App.navigateTo('quotes');

            setTimeout(() => {
                if (typeof Quotes !== 'undefined') {
                    // On déclenche le formulaire d'ajout avec le client pré-sélectionné
                    // Cela évite de créer un "document vide" comme reproché par l'utilisateur
                    Quotes.showAddForm(client.id);
                    App.showNotification(i18n.t('leads.notify.quote_ready', { name: client.name }), 'success');
                } else {
                    console.warn('[LEADS] Quotes module not loaded.');
                }
            }, 600);

        } catch (err) {
            console.error('[LEADS] Workflow Error:', err);
            App.showNotification('Erreur : ' + err.message, 'error');
        }
    }
};
