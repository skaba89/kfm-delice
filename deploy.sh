#!/bin/bash
# ============================================
# KFM Delice - Production Deployment Script
# ============================================
# Usage:
#   ./deploy.sh              # Full deployment (build + migrate + restart)
#   ./deploy.sh --skip-build # Skip build, just migrate + restart
#   ./deploy.sh --rollback   # Rollback to previous version
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - .env file configured
#   - SSH access to the server
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ============================================
# Helper Functions
# ============================================

print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════╗"
    echo "║     KFM Delice - Deployment Script       ║"
    echo "╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker compose &> /dev/null && ! docker-compose --version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    if [ ! -f ".env" ]; then
        log_error ".env file not found. Copy .env.example to .env and configure it."
        log_info "  cp .env.example .env"
        exit 1
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "$COMPOSE_FILE not found."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

backup_before_deploy() {
    log_info "Creating backup before deployment..."
    mkdir -p "$BACKUP_DIR"

    if docker compose ps app &> /dev/null; then
        docker compose exec -T postgres pg_dump -U kfm_admin kfm_delice > "$BACKUP_DIR/backup_${TIMESTAMP}.sql" 2>/dev/null || true
        log_success "Database backup saved to $BACKUP_DIR/backup_${TIMESTAMP}.sql"
    else
        log_warn "No running app container found, skipping database backup"
    fi
}

# ============================================
# Deployment Steps
# ============================================

step_pull_latest() {
    log_info "Pulling latest code..."
    git pull origin main || log_warn "Git pull failed (may be on detached HEAD or uncommitted changes)"
    log_success "Code updated"
}

step_build() {
    log_info "Building Docker images..."
    docker compose build --no-cache app
    log_success "Build completed"
}

step_migrate() {
    log_info "Running database migrations..."
    docker compose run --rm app npx prisma migrate deploy
    log_success "Migrations applied"
}

step_seed() {
    log_info "Seeding database (if empty)..."
    docker compose run --rm app npx prisma db seed || log_warn "Seed skipped (data may already exist)"
    log_success "Seed check completed"
}

step_restart() {
    log_info "Restarting services..."
    docker compose up -d --force-recreate app
    log_success "Services restarted"
}

step_health_check() {
    log_info "Waiting for application to start..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
            log_success "Application is healthy (attempt $attempt/$max_attempts)"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo ""
    log_error "Health check failed after $max_attempts attempts"
    log_info "Check logs with: docker compose logs --tail=100 app"
    return 1
}

rollback() {
    log_info "Starting rollback..."

    if [ -z "$(ls -A $BACKUP_DIR/*.sql 2>/dev/null)" ]; then
        log_error "No backup files found in $BACKUP_DIR"
        exit 1
    fi

    LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.sql | head -1)
    log_info "Restoring from: $LATEST_BACKUP"

    docker compose exec -T postgres psql -U kfm_admin -d kfm_delice < "$LATEST_BACKUP"
    log_success "Database restored. Restarting app..."
    docker compose restart app
    log_success "Rollback completed"
}

# ============================================
# Main
# ============================================

print_banner
check_prerequisites

case "${1:-}" in
    --skip-build)
        log_info "Running deployment (skip build mode)..."
        backup_before_deploy
        step_migrate
        step_restart
        step_health_check
        ;;
    --rollback)
        rollback
        ;;
    --migrate-only)
        step_migrate
        ;;
    *)
        log_info "Running full deployment..."
        backup_before_deploy
        step_pull_latest
        step_build
        step_migrate
        step_seed
        step_restart
        step_health_check
        ;;
esac

echo ""
log_success "========================================="
log_success "  Deployment completed successfully!"
log_success "========================================="
echo ""
log_info "Application URL: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
log_info "View logs:       docker compose logs -f app"
log_info "Check status:    docker compose ps"
echo ""
