/**
 * SoloPrice Pro - Ratings Module (Uber-style)
 */

const Ratings = {
    async submitRating(ratedUserId, score, comment = '') {
        try {
            const res = await fetch(`${Auth.apiBase}/api/ratings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.token}`
                },
                body: JSON.stringify({ rated_user_id: ratedUserId, score, comment })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Erreur lors de l\'envoi de la note');
            }

            App.showNotification('Note envoyée avec succès !', 'success');
            return true;
        } catch (err) {
            console.error('[RATINGS] Submit error:', err);
            App.showNotification(err.message, 'error');
            return false;
        }
    },

    async getUserRatings(userId) {
        try {
            const res = await fetch(`${Auth.apiBase}/api/ratings/${userId}`, {
                headers: { 'Authorization': `Bearer ${Auth.token}` }
            });
            if (!res.ok) return { average: 0, count: 0, ratings: [] };
            return await res.json();
        } catch (err) {
            console.error('[RATINGS] Fetch error:', err);
            return { average: 0, count: 0, ratings: [] };
        }
    },

    showRatingModal(expertId, expertName) {
        let modal = document.getElementById('rating-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'rating-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content glass" style="max-width: 450px;">
                <button type="button" class="modal-close" onclick="Ratings.hideModal()"></button>
                <div class="modal-header" style="text-align: center;">
                    <h2 style="margin-bottom: 0.5rem;">Noter ${expertName}</h2>
                    <p class="text-muted">Comment s'est passée votre collaboration ?</p>
                </div>
                <div class="modal-body" style="padding: 1.5rem 0;">
                    <div class="stars-container" style="display: flex; justify-content: center; gap: 0.75rem; margin-bottom: 2rem;">
                        ${[1, 2, 3, 4, 5].map(num => `
                            <i class="far fa-star rating-star" data-value="${num}" 
                               style="font-size: 2.5rem; color: #fbceb1; cursor: pointer; transition: transform 0.2s;"
                               onclick="Ratings.setStarRating(${num})"
                               onmouseover="Ratings.hoverStars(${num})"
                               onmouseout="Ratings.resetStars()"></i>
                        `).join('')}
                    </div>
                    <input type="hidden" id="rating-score" value="0">
                    <div class="form-group">
                        <label class="form-label">Votre avis (optionnel)</label>
                        <textarea id="rating-comment" class="form-input" rows="3" placeholder="Excellent travail, très réactif..."></textarea>
                    </div>
                    <button type="button" class="button-primary full-width" style="margin-top: 1.5rem; padding: 1rem;" onclick="Ratings.processSubmit('${expertId}')">
                        Envoyer ma note
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    hideModal() {
        document.getElementById('rating-modal')?.classList.remove('active');
    },

    setStarRating(val) {
        document.getElementById('rating-score').value = val;
        this.hoverStars(val);
        // Persist colors
        document.querySelectorAll('.rating-star').forEach(s => {
            const v = parseInt(s.dataset.value);
            if (v <= val) {
                s.classList.remove('far');
                s.classList.add('fas');
                s.style.color = '#f59e0b';
            } else {
                s.classList.remove('fas');
                s.classList.add('far');
                s.style.color = '#fbceb1';
            }
        });
    },

    hoverStars(val) {
        document.querySelectorAll('.rating-star').forEach(s => {
            const v = parseInt(s.dataset.value);
            if (v <= val) {
                s.style.color = '#f59e0b';
                s.style.transform = 'scale(1.1)';
            } else {
                s.style.color = '#fbceb1';
                s.style.transform = 'scale(1)';
            }
        });
    },

    resetStars() {
        const currentScore = parseInt(document.getElementById('rating-score').value);
        if (currentScore > 0) {
            this.setStarRating(currentScore);
        } else {
            document.querySelectorAll('.rating-star').forEach(s => {
                s.style.color = '#fbceb1';
                s.style.transform = 'scale(1)';
            });
        }
    },

    async processSubmit(expertId) {
        const score = parseInt(document.getElementById('rating-score').value);
        const comment = document.getElementById('rating-comment').value;

        if (score === 0) {
            App.showNotification('Veuillez sélectionner une note (1-5 étoiles)', 'warning');
            return;
        }

        const success = await this.submitRating(expertId, score, comment);
        if (success) {
            this.hideModal();
            // Refresh ecosystem view if active
            if (typeof Network !== 'undefined' && App.currentPage === 'network') {
                Network.renderEcosystem(document.getElementById('cercle-dynamic-content'));
            }
        }
    },

    renderStars(average) {
        const fullStars = Math.floor(average);
        const halfStar = average % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;

        let html = '';
        for (let i = 0; i < fullStars; i++) html += '<i class="fas fa-star" style="color:#f59e0b; font-size: 0.8rem;"></i>';
        if (halfStar) html += '<i class="fas fa-star-half-alt" style="color:#f59e0b; font-size: 0.8rem;"></i>';
        for (let i = 0; i < emptyStars; i++) html += '<i class="far fa-star" style="color:#ccc; font-size: 0.8rem;"></i>';

        return `<span class="rating-stars">${html}</span> <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 4px;">(${average})</span>`;
    }
};

window.Ratings = Ratings;
