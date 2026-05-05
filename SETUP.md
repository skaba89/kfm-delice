# KFM Delice — Installation

## Prerequis
- Node.js 18+ (https://nodejs.org)
- npm (inclus avec Node.js)

## Installation

```bash
# 1. Cloner le repo
git clone https://github.com/skaba89/kfm-delice.git
cd kfm-delice

# 2. Installer les dependances
npm install

# 3. Configurer la base de donnees
cp .env.example .env
# Editer .env si necessaire (DATABASE_URL par defaut: file:./db/dev.db)

# 4. Creer la base de donnees
npx prisma db push

# 5. Peupler la base de donnees (donnees de demo)
npx prisma db seed

# 6. Lancer le serveur de developpement
npm run dev
```

Le serveur sera disponible sur http://localhost:3000

## Comptes de test
- **Super Admin**: admin@kfm.com / admin123
- **Manager**: manager@kfm.com / manager123
- **Cuisine**: kitchen@kfm.com / kitchen123
- **Livreur**: driver@kfm.com / driver123
- **Client**: customer@kfm.com / customer123
