# 🍛 KFM Délice — Système de Gestion Restaurant

Plateforme complète de gestion et livraison de repas pour **KFM Délice**, Conakry, Guinée.

## 🚀 Fonctionnalités

### Portail Client
- Menu en ligne avec photos et prix en Franc Guinéen (FG)
- Commande en ligne (sur place, à emporter, livraison par moto-taxi)
- Paiement Mobile Money (Orange Money, MTN MoMo, Wave)
- Suivi de commande en temps réel
- Réservation de table
- Programme de fidélité

### Portail Administration
- Tableau de bord avec KPIs en temps réel
- Gestion du menu (plats, catégories, disponibilité)
- Gestion des commandes et statuts
- Point de vente (POS)
- Gestion du stock et alertes
- Suivi des dépenses
- Gestion des réservations
- Gestion du personnel

### Portail Cuisine
- Visualisation des commandes en attente
- Mise à jour du statut de préparation
- Statistiques de production

### Portail Livreur
- Assignation et suivi des livraisons
- Gains et statistiques
- Disponibilité en ligne/hors ligne

## 🛠️ Technologies

| Techno | Usage |
|--------|-------|
| Next.js 16 (App Router) | Frontend + API |
| TypeScript | Langage principal |
| Prisma ORM | Base de données |
| PostgreSQL | Base de données |
| Tailwind CSS 4 | Styles |
| shadcn/ui | Composants UI |
| Socket.io | Temps réel |
| CinetPay | Paiements Mobile Money |
| JWT (jose) | Authentification |
| Recharts | Graphiques |
| Docker | Déploiement |

## 📦 Installation

### Prérequis
- Node.js 20+
- PostgreSQL 16+
- npm

### Configuration

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/skaba89/kfm-delice.git
   cd kfm-delice
   npm install
   ```

2. **Variables d'environnement :**
   ```bash
   cp .env.example .env
   # Éditez .env avec vos clés
   ```

3. **Base de données :**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

4. **Lancer en développement :**
   ```bash
   npm run dev
   ```

### Docker

```bash
docker-compose up --build
```

## 🔑 Comptes de Test

| Rôle | Email | Mot de passe | Accès |
|------|-------|-------------|-------|
| Super Admin | admin@kfmdelice.gn | Pass123! | /admin/dashboard |
| Manager | manager@kfmdelice.gn | Pass123! | /admin/dashboard |
| Cuisine | cuisine@kfmdelice.gn | Pass123! | /kitchen/orders |
| Livreur | livreur@kfmdelice.gn | Pass123! | /driver/dashboard |
| Client | client@exemple.gn | Pass123! | /customer/menu |

## 🌍 Localisation Guinée

- **Devise :** Franc Guinéen (GNF / FG)
- **Ville :** Conakry (Kaloum, Dixinn, Matam, Ratoma, Matoto)
- **Paiements :** Orange Money, MTN MoMo, Wave, Espèces
- **Livraison :** Moto-taxi
- **Téléphone :** +224

## 📊 Structure du Projet

```
src/
├── app/                    # Pages et API routes
│   ├── (admin)/           # Portail administration (30 pages)
│   ├── (customer)/        # Portail client (12 pages)
│   ├── (kitchen)/         # Portail cuisine (5 pages)
│   ├── (driver)/          # Portail livreur (6 pages)
│   └── api/               # API REST (49 endpoints)
├── components/            # Composants React
│   ├── admin/             # Composants backoffice
│   ├── customer/          # Composants client
│   ├── driver/            # Composants livreur
│   ├── kitchen/           # Composants cuisine
│   ├── kfm-ui/            # Composants métier KFM
│   └── ui/                # Composants shadcn/ui
├── lib/                   # Utilitaires et services
│   ├── auth-context.tsx   # Contexte authentification
│   ├── cart.ts            # Gestion panier
│   ├── payments/          # Services paiement CinetPay
│   └── rate-limit.ts      # Rate limiting
├── hooks/                 # Hooks React personnalisés
└── prisma/
    ├── schema.prisma      # Schéma (23 modèles)
    └── seed.ts            # Données de test
```

## 🧪 Tests

```bash
# Lancer tous les tests
npx vitest run

# Lancer les tests en mode watch
npx vitest

# Couverture de tests
npx vitest run --coverage
```

## 🚢 Déploiement VPS

1. Cloner sur le serveur
2. Configurer `.env`
3. `docker-compose up -d --build`
4. Configurer Nginx reverse proxy
5. SSL avec Let's Encrypt

## 📄 Licence

Projet privé — KFM Délice © 2024
