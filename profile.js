// SoloPrice Pro - Profile Module
// Handles user identity and license management

const Profile = {
    render() {
        const container = document.getElementById('profile-content');
        if (!container) return;

        const user = Storage.getUser();
        const isPro = Storage.isPro();

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
                                    <input type="text" name="name" class="form-input" value="${user.company?.name || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Email Professionnel *</label>
                                    <input type="email" name="email" class="form-input" value="${user.company?.email || user.email || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Téléphone</label>
                                    <input type="tel" name="phone" class="form-input" value="${user.company?.phone || ''}">
                                </div>
                                <div class="form-group full-width">
                                    <label class="form-label">Adresse Siège Social *</label>
                                    <input type="text" name="address" class="form-input" value="${user.company?.address || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">SIRET</label>
                                    <input type="text" name="siret" class="form-input" value="${user.company?.siret || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Mentions Légales (Pied de page)</label>
                                    <input type="text" name="footer_mentions" class="form-input" value="${user.company?.footer_mentions || ''}" placeholder="Ex: TVA Intracom FR...">
                                </div>
                                
                                <div class="form-group full-width">
                                    <label class="form-label">Logo de l'entreprise</label>
                                    <div class="logo-upload-container" style="display: flex; gap: 1rem; align-items: center; background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 12px; border: 1px dashed var(--border);">
                                        <div id="logo-preview" style="width: 80px; height: 80px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid var(--border);">
                                            ${user.company?.logo ? `<img src="${user.company.logo}" style="width: 100%; height: 100%; object-fit: contain;">` : '<i class="fas fa-image" style="font-size: 24px; color: #ccc;"></i>'}
                                        </div>
                                        <div style="flex: 1;">
                                            <input type="file" id="logo-input" accept="image/*" style="display: none;" onchange="Profile.handleLogoUpload(event)">
                                            <div style="display: flex; gap: 0.5rem;">
                                                <button type="button" class="button-primary small" onclick="document.getElementById('logo-input').click()">Charger Logo</button>
                                                ${user.company?.logo ? `<button type="button" class="button-danger small" onclick="Profile.removeLogo()">Supprimer</button>` : ''}
                                            </div>
                                            <p class="text-xs text-muted" style="margin-top: 0.5rem;">PNG or JPG. Max 500KB.</p>
                                            <input type="hidden" name="logo" id="logo-base64" value="${user.company?.logo || ''}">
                                        </div>
                                    </div>
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
                                    ${isPro ? 'Abonnement SoloPrice PRO' : 'Compte Standard'}
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
            name: formData.get('name'), // Changed from 'companyName' to 'name' to match form input
            siret: formData.get('siret'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            // website: formData.get('website'), // 'website' field is not in the form, removed
            footer_mentions: formData.get('footer_mentions') || '', // Added back footer_mentions
            logo: formData.get('logo') || '' // Changed from hardcoded to formData.get('logo')
        };

        try {
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Enregistrement...';
            btn.disabled = true;

            // Update via Cloud Storage
            await Storage.updateUser({ company: companyData });

            App.renderUserInfo(); // Kept from original, as it updates user info in UI
            App.showNotification('Profil mis à jour avec succès !', 'success');
            this.render(); // Render the profile again to reflect changes

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

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            document.getElementById('logo-base64').value = base64;
            document.getElementById('logo-preview').innerHTML = `<img src="${base64}" style="width:100%; height:100%; object-fit:contain;">`;
            App.showNotification('Logo chargé. N\'oubliez pas d\'enregistrer.', 'info');
        };
        reader.readAsDataURL(file);
    },

    removeLogo() {
        document.getElementById('logo-base64').value = '';
        document.getElementById('logo-preview').innerHTML = '<i class="fas fa-image" style="font-size: 24px; color: #ccc;"></i>';
        App.showNotification('Logo supprimé. N\'oubliez pas d\'enregistrer.', 'info');
    }
};

window.Profile = Profile;
