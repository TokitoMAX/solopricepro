// SoloPrice Pro - Profile Module
// Handles user identity and license management (International-Aware)

const Profile = {
    getCountry(code) {
        return AppConstants.COUNTRIES.find(c => c.code === code) || AppConstants.COUNTRIES[AppConstants.COUNTRIES.length - 1];
    },

    render() {
        const container = document.getElementById('profile-content');
        if (!container) return;

        const user = Storage.getUser() || {};
        const isPro = Storage.isPro();
        const company = user.company || user.user_metadata?.company || {};
        const savedCountry = user.user_metadata?.country || company.country || '';

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Mon Profil</h1>
                <p class="page-subtitle">Gérez votre identité professionnelle et votre licence SoloPrice Pro.</p>
            </div>

            <div class="profile-layout">
                <div class="profile-section">
                    <div class="glass-card" style="padding: 2rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 2rem;">
                        <h2 class="section-title-small" style="margin-bottom: 1.5rem;">Photo de Profil</h2>
                        <div class="avatar-upload-container" style="display: flex; gap: 2rem; align-items: center;">
                            <div id="avatar-preview" style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; background: var(--bg-sidebar); border: 2px solid var(--primary-glass); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                ${user.user_metadata?.avatar_url ? `<img src="${user.user_metadata.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="font-size: 3rem; color: var(--text-muted);"></i>`}
                            </div>
                            <div style="flex: 1;">
                                <input type="file" id="avatar-input" accept="image/png, image/jpeg, image/webp" style="display: none;" onchange="Profile.handleAvatarUpload(event)">
                                <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
                                    <button type="button" class="button-primary small" onclick="document.getElementById('avatar-input').click()">Changer la photo</button>
                                    ${user.user_metadata?.avatar_url ? `<button type="button" class="button-danger small" onclick="Profile.removeAvatar()">Supprimer</button>` : ''}
                                </div>
                                <p class="text-xs text-muted">PNG, JPG ou WebP. Max 10 Mo. Cette photo sera visible dans l'écosystème SoloPrice.</p>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card" style="padding: 2rem; border-radius: 20px; border: 1px solid var(--border);">
                        <h2 class="section-title-small" style="margin-bottom: 1.5rem;">Identité Professionnelle</h2>
                        <form id="company-form" onsubmit="Profile.save(event)">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Prénom *</label>
                                    <input type="text" name="first_name" id="prof-first-name" class="form-input"
                                        value="${user.user_metadata?.first_name || ''}"
                                        placeholder="Jean" required autocomplete="given-name">
                                    <span class="field-error" id="err-first-name" style="display:none;color:#ef4444;font-size:0.75rem;margin-top:4px;"></span>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Nom *</label>
                                    <input type="text" name="last_name" id="prof-last-name" class="form-input"
                                        value="${user.user_metadata?.last_name || ''}"
                                        placeholder="Dupont" required autocomplete="family-name">
                                    <span class="field-error" id="err-last-name" style="display:none;color:#ef4444;font-size:0.75rem;margin-top:4px;"></span>
                                </div>

                                <!-- Country selector (drives company ID label) -->
                                <div class="form-group full-width">
                                    <label class="form-label">Pays / Région *</label>
                                    <select name="country" id="prof-country" class="form-input"
                                        onchange="Profile.onCountryChange(this.value)"
                                        style="cursor:pointer;">
                                        ${(() => {
                let html = '';
                let currentGroup = null;
                AppConstants.COUNTRIES.forEach(c => {
                    if (!c.code && !c.label.includes('Sélectionner')) return;

                    if (c.group && c.group !== currentGroup) {
                        if (currentGroup !== null) html += '</optgroup>';
                        currentGroup = c.group;
                        html += `<optgroup label="${currentGroup}">`;
                    }

                    html += `<option value="${c.code}" ${c.code === savedCountry ? 'selected' : ''}>${c.label}</option>`;
                });
                if (currentGroup !== null) html += '</optgroup>';
                return html;
            })()}
                                    </select>
                                </div>

                                <div class="form-group full-width">
                                    <label class="form-label">Nom Commercial / Entreprise</label>
                                    <input type="text" name="name" class="form-input"
                                        value="${company.name || user.user_metadata?.company_name || ''}"
                                        placeholder="Ex: Mon Agence, Jean Dupont Consulting…">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Email Professionnel *</label>
                                    <input type="email" name="email" id="prof-email" class="form-input"
                                        value="${company.email || user.email || ''}"
                                        placeholder="pro@email.com" required autocomplete="email">
                                    <span class="field-error" id="err-email" style="display:none;color:#ef4444;font-size:0.75rem;margin-top:4px;"></span>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Téléphone <span style="font-size:0.72rem;color:var(--text-muted);">(format international recommandé : +33…)</span></label>
                                    <input type="tel" name="phone" id="prof-phone" class="form-input"
                                        value="${company.phone || ''}"
                                        placeholder="+33 6 00 00 00 00" autocomplete="tel">
                                    <span class="field-error" id="err-phone" style="display:none;color:#ef4444;font-size:0.75rem;margin-top:4px;"></span>
                                </div>
                                <div class="form-group full-width">
                                    <label class="form-label">Adresse Siège Social *</label>
                                    <input type="text" name="address" class="form-input"
                                        value="${company.address || ''}"
                                        placeholder="12 rue de la Paix, 75001 Paris" required autocomplete="street-address">
                                </div>

                                <!-- Company registration number (label changes by country) -->
                                <div class="form-group" id="reg-number-group">
                                    <label class="form-label" id="reg-number-label">Numéro d'enregistrement</label>
                                    <div style="position:relative;">
                                        <input type="text" name="siret" id="prof-siret" class="form-input"
                                            value="${company.siret || ''}"
                                            placeholder="—"
                                            oninput="Profile.onSiretInput(this.value)"
                                            style="padding-right: 2.5rem;">
                                        <span id="siret-status" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:1rem;"></span>
                                    </div>
                                    <span id="reg-number-hint" style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;display:block;"></span>
                                    <span class="field-error" id="err-siret" style="display:none;color:#ef4444;font-size:0.75rem;margin-top:4px;"></span>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Mentions Légales (Pied de page)</label>
                                    <input type="text" name="footer_mentions" class="form-input"
                                        value="${company.footer_mentions || ''}"
                                        placeholder="Ex: TVA Intracom FR…">
                                </div>
                                <div class="form-group full-width">
                                    <label class="form-label">Portfolio / Site Web</label>
                                    <input type="url" name="portfolio" id="prof-portfolio" class="form-input"
                                        value="${company.portfolio || ''}"
                                        placeholder="https://votre-portfolio.com" autocomplete="url">
                                    <span class="field-error" id="err-portfolio" style="display:none;color:#ef4444;font-size:0.75rem;margin-top:4px;"></span>
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
                                                ${isPro ? 'PNG or JPG. Max 10 Mo.' : 'L\'ajout de logo est réservé aux comptes PRO et EXPERT.'}
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
                                        <i class="fas fa-info-circle"></i> Cette adresse est utilisée pour recevoir vos acomptes directement.
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
                if (!isPro) return 'Limite de 5 clients et 3 devis / mois.';
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

        // Initialize country-dependent UI
        this.onCountryChange(savedCountry);
    },

    // Called when country dropdown changes
    onCountryChange(code) {
        const country = this.getCountry(code);
        const label = document.getElementById('reg-number-label');
        const hint = document.getElementById('reg-number-hint');
        const group = document.getElementById('reg-number-group');
        const input = document.getElementById('prof-siret');
        if (!label || !group) return;

        if (!country.regLabel) {
            group.style.display = 'none';
        } else {
            group.style.display = '';
            label.textContent = country.regLabel + (country.verify ? ' *' : ' (optionnel)');
            if (country.pattern) {
                hint.textContent = country.verify
                    ? `Format exigé : ${country.pattern.replace(/[\^$]/g, '')}`
                    : `Format attendu : ${country.pattern.replace(/[\^$]/g, '')}`;
            } else {
                hint.textContent = 'Format libre selon votre pays.';
            }
            if (input) input.placeholder = country.regLabel || '';
            const statusEl = document.getElementById('siret-status');
            if (statusEl) statusEl.textContent = '';
        }

        // Apply language based on country selection
        if (code) {
            const lang = this.LANG_MAP[code] || 'en';
            const previous = localStorage.getItem('sp_lang') || 'fr';
            if (lang !== previous) {
                localStorage.setItem('sp_lang', lang);
                const langLabels = { fr: 'Français 🇫🇷', en: 'English 🇬🇧', es: 'Español 🇪🇸' };
                if (typeof App !== 'undefined' && App.showNotification) {
                    App.showNotification(`Langue détectée : ${langLabels[lang] || lang}`, 'info');
                }
            }
        }
    },


    // Real-time SIRET Luhn check + debounce INSEE API
    _siretTimer: null,
    onSiretInput(val) {
        const code = document.getElementById('prof-country')?.value || '';
        const country = this.getCountry(code);
        if (!country.verify) return;

        const status = document.getElementById('siret-status');
        const errEl = document.getElementById('err-siret');
        const clean = val.replace(/\s/g, '');

        // Reset
        status.textContent = '';
        if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
        clearTimeout(this._siretTimer);

        if (clean.length === 0) return;

        // Only act once we have exactly 14 digits
        if (clean.length === 14 && /^[0-9]{14}$/.test(clean)) {
            if (this.luhn(clean)) {
                status.textContent = '';
                this._siretTimer = setTimeout(() => this.verifySiretApi(clean), 500);
            } else {
                status.textContent = '';
                if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Numéro SIRET invalide (clé de contrôle incorrecte).'; }
            }
        }
        // No indicator while still typing — avoids confusion
    },

    // Luhn algorithm for SIRET validation
    luhn(num) {
        let sum = 0;
        for (let i = 0; i < num.length; i++) {
            let d = parseInt(num[i]);
            if ((num.length - i) % 2 === 0) {
                d *= 2;
                if (d > 9) d -= 9;
            }
            sum += d;
        }
        return sum % 10 === 0;
    },

    // INSEE API verification via our backend proxy
    async verifySiretApi(siret) {
        const status = document.getElementById('siret-status');
        const errEl = document.getElementById('err-siret');
        const nameInput = document.querySelector('input[name="name"]');
        try {
            const result = await NetworkService.validateCompanySiret(siret);
            const data = result.data;
            if (result.ok && data.valid) {
                status.textContent = '';
                // Auto-fill company name if empty
                if (nameInput && !nameInput.value.trim() && data.name) {
                    nameInput.value = data.name;
                    App.showNotification(`Entreprise trouvée : ${data.name}`, 'success');
                }
            } else {
                status.textContent = '';
                if (errEl) { errEl.style.display = 'block'; errEl.textContent = data.message || 'SIRET introuvable dans la base INSEE.'; }
            }
        } catch {
            status.textContent = '️';
        }
    },

    // International validations
    validateName(val) {
        if (!val || val.trim().length < 2) return 'Minimum 2 caractères.';
        // Allow: letters (any script), spaces, hyphens, apostrophes
        if (/[0-9<>{}[\]\\|]/.test(val)) return 'Le nom ne doit pas contenir de chiffres ou caractères spéciaux.';
        return null;
    },

    validatePhone(val) {
        if (!val) return null; // Optional
        const clean = val.replace(/[\s\-().]/g, '');
        // Accept +countrycode... or local 7-15 digits
        if (!/^(\+[1-9][0-9]{6,14}|[0-9]{7,15})$/.test(clean)) {
            return 'Téléphone invalide. Format recommandé : +33 6 xx xx xx xx';
        }
        return null;
    },

    validateUrl(val) {
        if (!val) return null; // Optional
        try { new URL(val); return null; } catch { return 'URL invalide. Ex : https://votre-site.com'; }
    },

    showFieldError(id, msg) {
        const el = document.getElementById(id);
        if (!el) return;
        if (msg) { el.style.display = 'block'; el.textContent = msg; }
        else { el.style.display = 'none'; el.textContent = ''; }
    },

    async save(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const firstName = (formData.get('first_name') || '').trim();
        const lastName = (formData.get('last_name') || '').trim();
        const country = formData.get('country') || '';
        const phone = (formData.get('phone') || '').trim();
        const portfolio = (formData.get('portfolio') || '').trim();
        const siret = (formData.get('siret') || '').replace(/\s/g, '');
        const email = (formData.get('email') || '').trim();

        // Clear all errors
        ['err-first-name', 'err-last-name', 'err-email', 'err-phone', 'err-portfolio', 'err-siret'].forEach(id => this.showFieldError(id, null));

        let hasError = false;

        // Name validation
        const firstErr = this.validateName(firstName);
        if (firstErr) { this.showFieldError('err-first-name', firstErr); hasError = true; }
        const lastErr = this.validateName(lastName);
        if (lastErr) { this.showFieldError('err-last-name', lastErr); hasError = true; }

        // Email validation (RFC-compliant)
        const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        if (!email || !emailRegex.test(email)) {
            this.showFieldError('err-email', "Format d'email invalide.");
            hasError = true;
        }

        // Phone validation
        const phoneErr = this.validatePhone(phone);
        if (phoneErr) { this.showFieldError('err-phone', phoneErr); hasError = true; }

        // URL validation
        const urlErr = this.validateUrl(portfolio);
        if (urlErr) { this.showFieldError('err-portfolio', urlErr); hasError = true; }

        // Company registration number validation (format check)
        const countryObj = this.getCountry(country);
        if (countryObj.verify && siret) {
            if (!this.luhn(siret) || !/^[0-9]{14}$/.test(siret)) {
                this.showFieldError('err-siret', 'Numéro SIRET invalide (14 chiffres, clé de contrôle).');
                hasError = true;
            }
            const statusEl = document.getElementById('siret-status');
            if (statusEl && statusEl.textContent === '') {
                this.showFieldError('err-siret', 'Ce SIRET n\'est pas reconnu par la base INSEE.');
                hasError = true;
            }
        } else if (countryObj.pattern && siret) {
            const re = new RegExp(countryObj.pattern);
            if (!re.test(siret)) {
                this.showFieldError('err-siret', `Format incorrect : ${countryObj.regLabel}`);
                hasError = true;
            }
        }

        if (hasError) {
            App.showNotification('Veuillez corriger les champs en erreur.', 'error');
            return;
        }

        // Country required
        if (!country) {
            App.showNotification('Veuillez sélectionner votre pays.', 'error');
            return;
        }

        const companyData = {
            name: formData.get('name') || '',
            siret,
            country,
            email,
            phone,
            address: formData.get('address') || '',
            footer_mentions: formData.get('footer_mentions') || '',
            logo: formData.get('logo') || '',
            portfolio,
            paypal_email: formData.get('paypal_email') || ''
        };

        try {
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Enregistrement…';
            btn.disabled = true;

            // Handle Avatar Upload First
            let avatarUrl = user.user_metadata?.avatar_url || '';
            if (window.pendingAvatarFile) {
                try {
                    avatarUrl = await Storage.uploadAvatar(window.pendingAvatarFile);
                    window.pendingAvatarFile = null;
                } catch (err) {
                    console.error('Avatar upload failed:', err);
                    App.showNotification("Échec de l'upload de la photo.", 'error');
                }
            } else if (window.removeAvatarPending) {
                avatarUrl = '';
                window.removeAvatarPending = false;
            }

            // Handle Logo Upload Next
            if (window.pendingLogoFile) {
                try {
                    const publicUrl = await Storage.uploadLogo(window.pendingLogoFile);
                    companyData.logo = publicUrl;
                    window.pendingLogoFile = null;
                } catch (uploadErr) {
                    console.error('Logo upload failed:', uploadErr);
                    App.showNotification("Échec de l'upload du logo, le reste a été enregistré.", 'warning');
                }
            }

            // Update user with both metadata (including avatar) and company data
            await Storage.updateUser({
                first_name: firstName,
                last_name: lastName,
                avatar_url: avatarUrl,
                company: companyData
            });

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

    handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { App.showNotification('Image trop lourde (10 Mo max)', 'error'); return; }

        window.pendingAvatarFile = file;
        window.removeAvatarPending = false;

        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('avatar-preview').innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
            App.showNotification("Photo sélectionnée. N'oubliez pas d'enregistrer.", 'info');
        };
        reader.readAsDataURL(file);
    },

    removeAvatar() {
        window.pendingAvatarFile = null;
        window.removeAvatarPending = true;
        document.getElementById('avatar-preview').innerHTML = `<i class="fas fa-user" style="font-size: 3rem; color: var(--text-muted);"></i>`;
        App.showNotification('Photo supprimée. Enregistrez pour confirmer.', 'info');
    },

    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { App.showNotification('Image trop lourde (10 Mo max)', 'error'); return; }
        window.pendingLogoFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('logo-preview').innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:contain;">`;
            App.showNotification("Logo sélectionné. N'oubliez pas d'enregistrer.", 'info');
        };
        reader.readAsDataURL(file);
    },

    removeLogo() {
        window.pendingLogoFile = null;
        const logoInput = document.getElementById('logo-base64');
        if (logoInput) logoInput.value = '';
        document.getElementById('logo-preview').innerHTML = '<i class="fas fa-image" style="font-size: 24px; color: #ccc;"></i>';
        App.showNotification('Logo supprimé. Enregistrez pour confirmer.', 'info');
    }
};

window.Profile = Profile;
