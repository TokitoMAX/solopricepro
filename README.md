# SoloPrice Pro

**Chiffrage & Facturation Premium pour Freelances & Consultants**  
*Propulsé par DomTomConnect*

---

## 🎯 Mission

SoloPrice Pro est un **SaaS de pilotage financier** conçu pour les indépendants qui veulent arrêter de sous-facturer et gérer leur activité avec des chiffres réels. L'outil couvre l'intégralité du cycle commercial : de l'estimation d'un projet à l'encaissement, en passant par la facturation et la gestion du réseau.

---

## 🛠️ Stack Technique

| Couche | Technologie |
|---|---|
| Frontend | HTML / CSS / Vanilla JS (SPA) |
| Backend | Node.js + Express |
| Auth & BDD | Supabase (PostgreSQL + Auth) |
| Paiements | PayPal (abonnement PRO) |
| PDF | Génération côté client (html2canvas / jsPDF) |
| Déploiement | Vercel (+ local `node server.js`) |

---

## ✨ Fonctionnalités

### 💰 Pilotage Financier
- **Calculateur TJM** : définissez votre tarif journalier en fonction de vos charges réelles et objectifs de revenu
- **Trésorerie Nette** : dashboard factuel (Encaissé Brut − Dépenses − Provisions URSSAF) — zéro simulation
- **Suivi des Dépenses** : registre de charges avec catégories
- **Vue Stratégique** : tableau de bord de rentabilité et projections

### 📋 Chiffrage & Documents
- **Project Scoper** : estimateur d'incertitude Min/Max avec marge de sécurité automatique
- **Devis professionnels** : création rapide, signature électronique client, conversion en facture 1 clic
- **Factures** : numérotation automatique, suivi de paiement, relances
- **Exports PDF/HTML** : documents imprimables au design soigné

### 📊 Pipeline Commercial (Kanban)
- Colonnes : Prospects → Devis envoyés → À récupérer (facturé) → Encaissé
- Dashboard trésorerie nette en temps réel au-dessus du pipeline

### 👥 Mon Cercle (Réseau)
- **Mes Clients** : CRM léger intégré
- **Mes Prospects** : suivi des leads
- **Mes Partenaires Privés** : carnet d'adresses confidentiel (sous-traitants, collaborateurs)
- **L'Écosystème** : annuaire d'experts validés DomTomConnect
- **Rejoindre** : formulaire de candidature pour intégrer l'écosystème

### 📓 Journal de Bord
- Carnet de notes quotidien (victoires, leçons, notes libres)
- Timeline chronologique de l'activité

### ⚙️ Compte & Paramètres
- Authentification sécurisée (Supabase Auth)
- Modèle **Freemium / PRO** (paiement PayPal)
- Profil prestataire (nom, entreprise, SIRET, pays)
- Paramètres fiscaux (URSSAF, TVA)

---

## 🚀 Démarrage Local

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Remplir SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, PAYPAL_*

# 3. Lancer le serveur
node server.js
# → http://localhost:5050
```

---

## 🗂️ Structure Principale

```
├── server.js          # Serveur Express
├── backend/routes/    # API Auth, Data, Payments, Admin, Marketplace
├── index.html         # Entry point SPA
├── app_v5.js          # Routeur principal de l'application
├── auth.js            # Module d'authentification frontend
├── storage.js         # Abstraction Supabase ↔ LocalStorage
├── calculator.js      # Calculateur TJM
├── scoper.js          # Project Scoper + Journal de Bord
├── quotes.js          # Devis & Factures
├── kanban.js          # Pipeline + Trésorerie Nette
├── clients.js         # CRM Clients
├── leads.js           # Prospects
├── network.js         # Mon Cercle & Écosystème
├── expenses.js        # Dépenses & Charges
├── pdf-generator.js   # Génération PDF
├── taxes.js           # Moteur fiscal (URSSAF, TVA)
└── styles.css         # Design system global
```

---

**Conçu pour ceux qui veulent piloter leur activité avec des chiffres réels.** 🚀
