#!/bin/sh
set -e

echo "============================================"
echo "  KFM Delice - Démarrage du serveur"
echo "============================================"

echo "📋 Exécution des migrations Prisma..."
npx prisma migrate deploy 2>/dev/null || echo "⚠️  Aucune migration à appliquer"

echo "🌱 Initialisation de la base de données..."
npx prisma db seed 2>/dev/null || echo "⚠️  Seed ignoré ou déjà effectué"

echo "🚀 Démarrage de l'application sur le port ${PORT:-3000}..."
exec "$@"
