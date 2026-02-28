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
                    <h1 class="page-title">Prospection</h1>
                    <p class="page-subtitle">Suivi des opportunités commerciales</p>
                </div>
                <button class="button-primary" onclick="Leads.showAddForm()">
                    Nouveau Prospect
                </button>
            </div>

            <div id="lead-form-container"></div>

            <div class="leads-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                ${leads.length > 0 ? leads.map(lead => this.renderLeadCard(lead)).join('') : `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <h3>Aucun prospect en cours</h3>
                        <p>Ajoutez vos premières opportunités pour commencer le suivi.</p>
                        <button class="button-secondary" onclick="Leads.showAddForm()">Ajouter un prospect</button>
                    </div>
                `}
            </div>
        `;
    },

    renderLeadCard(lead) {
        const statusConfig = {
            cold: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', label: 'Contact Initial', icon: 'fa-seedling' },
            warm: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'En Négociation', icon: 'fa-fire' },
            won: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', label: 'Client Confirmé', icon: 'fa-trophy' }
        };
        const s = statusConfig[lead.status] || statusConfig.cold;

        const nameParts = (lead.name || '?').trim().split(' ');
        const initials = nameParts.length >= 2
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : (lead.name || '?')[0].toUpperCase();

        return `
        <div style="
            border-radius: 20px; border: 1px solid rgba(255,255,255,0.07);
            background: rgba(255,255,255,0.02); overflow: hidden;
            transition: all 0.25s ease; display: flex; flex-direction: column;
            border-left: 4px solid ${s.color};
        " onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.3)'"
           onmouseout="this.style.transform='';this.style.boxShadow=''">

            <div style="padding: 1.4rem 1.4rem 1rem; display: flex; gap: 1rem; align-items: flex-start;">
                <div style="width:46px;height:46px;border-radius:13px;flex-shrink:0;background:linear-gradient(135deg,${s.color}33,${s.color}11);border:1px solid ${s.border};display:flex;align-items:center;justify-content:center;font-size:0.95rem;font-weight:900;color:${s.color};">${initials}</div>
                <div style="flex:1;min-width:0;">
                    <h3 style="margin:0;font-size:1rem;font-weight:700;color:var(--white);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(lead.name)}</h3>
                    <p style="margin:3px 0 0;font-size:0.77rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(lead.activity || 'Activité non précisée')}</p>
                </div>
                <span style="background:${s.bg};color:${s.color};border:1px solid ${s.border};padding:4px 9px;border-radius:20px;font-size:0.63rem;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;flex-shrink:0;display:flex;align-items:center;gap:4px;">
                    <i class="fas ${s.icon}" style="font-size:0.55rem;"></i>${s.label}
                </span>
            </div>

            <div style="padding:0 1.4rem 1.1rem;display:flex;flex-direction:column;gap:5px;">
                ${lead.email ? `<div style="display:flex;align-items:center;gap:8px;font-size:0.81rem;color:var(--text-muted);"><i class="far fa-envelope" style="width:13px;color:${s.color};opacity:0.7;"></i><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this.escapeHtml(lead.email)}</span></div>` : ''}
                ${lead.phone ? `<div style="display:flex;align-items:center;gap:8px;font-size:0.81rem;color:var(--text-muted);"><i class="fas fa-phone-alt" style="width:13px;color:${s.color};opacity:0.7;"></i><span>${this.escapeHtml(lead.phone)}</span></div>` : ''}
            </div>

            <div style="display:flex;gap:0.5rem;padding:0.9rem 1.4rem;border-top:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.1);align-items:center;">
                <div style="display:flex;gap:0.4rem;flex:1;flex-wrap:wrap;">
                    ${lead.status === 'cold'
                ? `<button onclick="Leads.updateStatus('${lead.id}','warm')" style="padding:5px 11px;border-radius:20px;border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.1);color:#f59e0b;font-size:0.7rem;font-weight:700;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#f59e0b';this.style.color='#000'" onmouseout="this.style.background='rgba(245,158,11,0.1)';this.style.color='#f59e0b'"><i class="fas fa-fire" style="margin-right:4px;"></i>Négociation</button>`
                : `<button onclick="Leads.updateStatus('${lead.id}','cold')" style="padding:5px 11px;border-radius:20px;border:1px solid rgba(96,165,250,0.3);background:rgba(96,165,250,0.1);color:#60a5fa;font-size:0.7rem;font-weight:700;cursor:pointer;transition:all 0.2s;"><i class="fas fa-seedling" style="margin-right:4px;"></i>Contact</button>`
            }
                    <button onclick="Leads.convertToQuote('${lead.id}')" style="padding:5px 11px;border-radius:20px;border:1px solid var(--primary-glass);background:var(--primary-glass);color:var(--primary-light);font-size:0.7rem;font-weight:700;cursor:pointer;transition:all 0.2s;"><i class="fas fa-file-invoice" style="margin-right:4px;"></i>Devis</button>
                    <button onclick="Leads.convertToClient('${lead.id}')" style="padding:5px 11px;border-radius:20px;border:1px solid rgba(16,185,129,0.3);background:rgba(16,185,129,0.1);color:#10b981;font-size:0.7rem;font-weight:700;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#10b981';this.style.color='white'" onmouseout="this.style.background='rgba(16,185,129,0.1)';this.style.color='#10b981'"><i class="fas fa-user-check" style="margin-right:4px;"></i>Convertir</button>
                </div>
                <button onclick="Leads.delete('${lead.id}')" style="width:30px;height:30px;border-radius:9px;border:none;background:rgba(239,68,68,0.1);color:#ef4444;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;flex-shrink:0;" onmouseover="this.style.background='#ef4444';this.style.color='white'" onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444'">
                    <i class="fas fa-trash-alt" style="font-size:0.7rem;"></i>
                </button>
            </div>
        </div>`;
    },


    showAddForm() {
        const container = document.getElementById('lead-form-container');
        container.innerHTML = `
    < div class="form-card glass" style = "margin-bottom: 2rem; animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); background: rgba(255, 255, 255, 0.03); border: 1px solid var(--primary-glass); box-shadow: 0 20px 50px rgba(0,0,0,0.3);" >
                <div class="form-header" style="border-bottom: 1px solid var(--primary-glass); padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--primary-light);"><i class="fas fa-user-plus" style="margin-right: 10px;"></i> Nouveau Prospect</h3>
                    <button class="btn-close" onclick="Leads.hideForm()" style="background: none; border: none; color: white; cursor: pointer; opacity: 0.6; transition: opacity 0.2s;">✕</button>
                </div>
                <form onsubmit="Leads.save(event)" style="padding: 2rem;">
                    <div class="form-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">Nom / Entreprise <span style="color: var(--primary);">*</span></label>
                            <input type="text" name="name" class="modern-input" required placeholder="Ex: Jean Dupont" style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Activité</label>
                            <input type="text" name="activity" class="modern-input" placeholder="Ex: Boulangerie, Startup..." style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email de contact</label>
                            <input type="email" name="email" class="modern-input" placeholder="Ex: contact@email.com" style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Téléphone</label>
                            <input type="tel" name="phone" class="modern-input" placeholder="Ex: 06 00 00 00 00" style="width: 100%;">
                        </div>
                    </div>
                    <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2.5rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2rem;">
                        <button type="button" class="button-outline" onclick="Leads.hideForm()" style="min-width: 120px;">Annuler</button>
                        <button type="submit" class="button-primary" style="min-width: 200px; box-shadow: var(--primary-shadow);">🚀 Suivre ce prospect</button>
                    </div>
                </form>
            </div >
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
        App.showNotification('Prospect ajouté au suivi', 'success');
        this.hideForm();
        this.render(this.lastContainerId);
    },

    async updateStatus(id, newStatus) {
        await Storage.updateLead(id, { status: newStatus });
        App.showNotification('Statut mis à jour', 'success');

        // Qualification automatique : si 'won', on convertit en client
        if (newStatus === 'won') {
            const lead = (Storage.getLeads() || []).find(l => l.id === id);
            if (lead) {
                setTimeout(() => {
                    if (confirm(`Le prospect ${lead.name} est maintenant un "Client confirmé".Voulez - vous le transférer définitivement dans votre base Clients ? `)) {
                        this.convertToClient(id);
                    }
                }, 500);
            }
        }

        this.render(this.lastContainerId);
    },

    async convertToClient(id) {
        if (!confirm('Convertir ce prospect en client ? Ses informations seront transférées dans le module Clients.')) return;

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

            App.showNotification('Nouveau client enregistré.', 'success');
            App.navigateTo('clients');
        }
    },

    async delete(id) {
        if (confirm('Supprimer ce prospect ?')) {
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

            App.showNotification('Préparation du devis...', 'info');

            // 3. Rediriger vers le FORMULAIRE de nouveau devis (pas un devis vide)
            App.navigateTo('quotes');

            setTimeout(() => {
                if (typeof Quotes !== 'undefined') {
                    // On déclenche le formulaire d'ajout avec le client pré-sélectionné
                    // Cela évite de créer un "document vide" comme reproché par l'utilisateur
                    Quotes.showAddForm(client.id);
                    App.showNotification(`Nouveau devis pour ${client.name} `, 'success');
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
