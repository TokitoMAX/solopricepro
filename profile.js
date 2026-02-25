// SoloPrice Pro - Profile Module
// Handles user identity and license management

const Profile = {
    render() {
        const container = document.getElementById('profile-content');
        if (!container) return;

        const user = Storage.getUser() || {};
        const isPro = Storage.isPro();

        const company = user.company || user.user_metadata?.company || {};

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Mon Profil</h1>
                <p class="page-subtitle">Gérez votre identité professionnelle et votre licence SoloPrice Pro.</p>
            </div>

            <div class="profile-layout">
                
                <div class="profile-section">
                    <div class="glass-card" style="padding: 2rem; border-radius: 20px; border: 1px solid var(--border);">
                        <h2 class="section-title-small" style="margin-bottom: 1.5rem;">Identité Entreprise</h2>
                        <form id="company-form" onsubmit="Profile.save(event)">
                            <div class="form-grid">
                                <div class="form-group full-width">
                                    <label class="form-label">Nom Commercial / Entreprise *</label>
                                    <input type="text" name="name" class="form-input" value="${company.name || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Email Professionnel *</label>
                                    <input type="email" name="email" class="form-input" value="${company.email || user.email || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Téléphone</label>
                                    <input type="tel" name="phone" class="form-input" value="${company.phone || ''}">
                                </div>
                                <div class="form-group full-width">
                                    <label class="form-label">Adresse Siège Social *</label>
                                    <input type="text" name="address" class="form-input" value="${company.address || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">SIRET</label>
                                    <input type="text" name="siret" class="form-input" value="${company.siret || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Mentions Légales (Pied de page)</label>
                                    <input type="text" name="footer_mentions" class="form-input" value="${company.footer_mentions || ''}" placeholder="Ex: TVA Intracom FR...">
                                </div>
                                <div class="form-group full-width">
                                    <label class="form-label">Portfolio / Site Web</label>
                                    <input type="url" name="portfolio" class="form-input" value="${company.portfolio || ''}" placeholder="https://votre-portfolio.com">
                                </div>
                                
                                <div class="form-group full-width">
                                    <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
                                        Logo de l'entreprise
                                        ${!isPro ? `<span class="badge-premium" style="background: var(--primary-glass); color: var(--primary-light); font-size: 0.65rem; padding: 2px 8px; border-radius: 4px;">PRO</span>` : ''}
                                    </label>
                                    <div class="logo-upload-container" style="display: flex; gap: 1rem; align-items: center; background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 12px; border: 1px dashed ${!isPro ? 'rgba(255,255,255,0.05)' : 'var(--border)'}; opacity: ${!isPro ? '0.7' : '1'};">
                                        <div id="logo-preview" style="width: 80px; height: 80px; background: ${!isPro ? 'rgba(0,0,0,0.2)' : 'white'}; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid var(--border);">
                                            ${company.logo && isPro ? `<img src="${company.logo}" style="width: 100%; height: 100%; object-fit: contain;">` : '<i class="fas fa-image" style="font-size: 24px; color: #ccc;"></i>'}
                                        </div>
                                        <div style="flex: 1;">
                                            <input type="file" id="logo-input" accept="image/*" style="display: none;" onchange="Profile.handleLogoUpload(event)">
                                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                                ${isPro ? `
                                                    <button type="button" class="button-primary small" onclick="document.getElementById('logo-input').click()">Charger Logo</button>
                                                    ${company.logo ? `<button type="button" class="button-danger small" onclick="Profile.removeLogo()">Supprimer</button>` : ''}
                                                ` : `
                                                    <button type="button" class="button-secondary small" onclick="App.showUpgradeModal()" style="background: rgba(16, 185, 129, 0.1); border-color: var(--primary-glass);">
                                                        <i class="fas fa-lock" style="margin-right: 5px; font-size: 0.8rem;"></i> Débloquer le Logo
                                                    </button>
                                                `}
                                            </div>
                                            <p class="text-xs text-muted" style="margin-top: 0.5rem;">
                                                ${isPro ? 'PNG or JPG. Max 500KB.' : 'L\'ajout de logo est réservé aux comptes PRO et EXPERT.'}
                                            </p>
                                            <input type="hidden" name="logo" id="logo-base64" value="${(isPro && company.logo) ? company.logo : ''}">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-section-separator" style="margin: 2rem 0; border-top: 1px solid var(--border);"></div>

                            <h2 class="section-title-small" style="margin-bottom: 1.5rem;">Coordonnées de Paiement</h2>
                            <p class="text-xs text-muted" style="margin-bottom: 1.5rem;">
                                Ces informations seront affichées sur vos devis pour que vos clients puissent vous régler directement.
                            </p>
                            <div class="form-grid">
                                <div class="form-group full-width" style="margin-top: 1.5rem; padding: 1.5rem; border-radius: 16px; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);">
                                    <label class="form-label" style="color: #3b82f6; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                                        <i class="fab fa-paypal" style="font-size: 1.2rem;"></i> Email PayPal de réception <span style="background: #3b82f6; color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; margin-left: auto;">OBLIGATOIRE POUR DEVIS</span>
                                    </label>
                                    <input type="email" name="paypal_email" class="form-input" value="${company.paypal_email || ''}" placeholder="votre-email@paypal.com" style="background: rgba(255,255,255,0.05); border-color: rgba(59, 130, 246, 0.3); font-size: 1.1rem;">
                                    <p class="text-xs" style="margin-top: 0.75rem; color: #60a5fa; line-height: 1.4;">
                                        <i class="fas fa-info-circle"></i> Cette adresse est utilisée pour recevoir vos acomptes directement. Assurez-vous qu'elle est correcte.
                                    </p>
                                </div>
                            </div>

                            <div class="form-actions" style="margin-top: 2rem;">
                                <button type="submit" class="button-primary full-width">Mettre à jour mon profil</button>
                            </div>
                        </form>
                    </div>

                    <div class="license-status-card" style="margin-top: 2rem; padding: 1.5rem; border-radius: 16px; border: 1px solid ${isPro ? 'var(--primary-glass)' : 'var(--border)'}; background: ${isPro ? 'rgba(16, 185, 129, 0.03)' : 'var(--bg-sidebar)'};">
                         <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="margin: 0; font-size: 1.1rem; color: ${isPro ? 'var(--primary-light)' : 'var(--white)'};">
                                    ${(() => {
                const tier = Storage.getTier();
                if (tier === 'expert') return 'Pack SoloPrice EXPERT';
                if (isPro) return 'Abonnement SoloPrice PRO';
                return 'Compte Standard';
            })()}
                                </h3>
                                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 4px 0 0 0;">
                                    ${(() => {
                if (!isPro) return 'Limite de 3 clients et 5 devis / mois.';
                const status = Storage.getSubscriptionStatus();
                if (status.isLifetime) return 'Accès Illimité (À vie)';
                return `Expire le ${App.formatDate(status.expiryDate)} (${status.daysLeft} jours restants)`;
            })()}
                                </p>
                            </div>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                ${isPro ? '<span class="pro-badge" style="padding: 4px 10px; font-size: 0.7rem;">ACTIF</span>' : ''}
                                <button class="button-${isPro ? 'secondary' : 'primary'} small" onclick="App.showUpgradeModal()">
                                    ${isPro ? 'Renouveler' : 'Upgrade'}
                                </button>
                            </div>
                         </div>
                    </div>
                </div>

            </div>
        `;
    },

    async save(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const companyData = {
            name: formData.get('name'),
            siret: formData.get('siret') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            address: formData.get('address') || '',
            footer_mentions: formData.get('footer_mentions') || '',
            logo: formData.get('logo') || '',
            portfolio: formData.get('portfolio') || '',
            paypal_email: formData.get('paypal_email') || ''
        };

        try {
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Enregistrement...';
            btn.disabled = true;

            // Handle Logo Upload if pending
            if (window.pendingLogoFile) {
                try {
                    const publicUrl = await Storage.uploadLogo(window.pendingLogoFile);
                    companyData.logo = publicUrl;
                    window.pendingLogoFile = null;
                } catch (uploadErr) {
                    console.error("Logo upload failed, continuing with previous logo:", uploadErr);
                    App.showNotification("Échec de l'upload du logo, mais le reste a été enregistré.", 'warning');
                }
            }

            // On met à jour via Storage qui gère maintenant la normalisation
            await Storage.updateUser({ company: companyData });

            App.renderUserInfo();
            App.showNotification('Profil mis à jour avec succès !', 'success');
            this.render();

            btn.textContent = originalText;
            btn.disabled = false;
        } catch (error) {
            console.error(error);
            App.showNotification('Erreur lors de la sauvegarde.', 'error');
            e.target.querySelector('button[type="submit"]').disabled = false;
        }
    },

    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            App.showNotification('Image trop lourde (500KB max)', 'error');
            return;
        }

        // Store for upload on save
        window.pendingLogoFile = file;

        const reader = new FileReader();
        reader.onload = (event) => {
            const previewBase64 = event.target.result;
            document.getElementById('logo-preview').innerHTML = `<img src="${previewBase64}" style="width:100%; height:100%; object-fit:contain;">`;
            App.showNotification('Logo sélectionné. N\'oubliez pas d\'enregistrer.', 'info');
        };
        reader.readAsDataURL(file);
    },

    removeLogo() {
        window.pendingLogoFile = null;
        const logoInput = document.getElementById('logo-base64');
        if (logoInput) logoInput.value = '';
        document.getElementById('logo-preview').innerHTML = '<i class="fas fa-image" style="font-size: 24px; color: #ccc;"></i>';
        App.showNotification('Logo supprimé dans la prévisualisation. Enregistrez pour confirmer.', 'info');
    }
};

window.Profile = Profile;
