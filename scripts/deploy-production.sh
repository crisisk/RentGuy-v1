#!/bin/bash
set -e

# Configuration - Update these for your environment
BLUE_DIR="/var/www/blue"
GREEN_DIR="/var/www/green"
ACTIVE_LINK="/var/www/active"
BACKUP_DIR="/var/db_backups"
SERVICE_NAME="myapp"
HEALTH_CHECK_URL="http://localhost:8080/health"
SLACK_WEBHOOK=""  # Set your webhook URL for Slack notifications

# Internal variables
BACKUP_FILE=""
DEPLOY_STARTED=false

# Slack notification function
notify_slack() {
    local message="$1"
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" "$SLACK_WEBHOOK" > /dev/null
    fi
}

# Health check function
check_health() {
    local url="$1"
    for i in {1..5}; do
        if [ "$(curl -s -o /dev/null -w '%{http_code}' "$url")" -eq 200 ]; then
            return 0
        fi
        sleep 10
    done
    return 1
}

# Rollback procedure
rollback() {
    echo "!!! Initiating rollback !!!"
    
    # Switch back to original environment
    ln -sfn "$original_active" "$ACTIVE_LINK"
    systemctl reload nginx  # Update this for your proxy/server
    
    # Database restore - Update command for your DB
    if [ -f "$BACKUP_FILE" ]; then
        echo "Restoring database from backup..."
        mysql -u USER -pPASSWORD DB_NAME < "$BACKUP_FILE"  # Replace with your command
    fi
    
    notify_slack ":fire: Production deployment FAILED - Rolled back to $(basename "$original_active")"
    exit 1
}

# Set trap for automatic rollback on failure
trap rollback ERR

# 1. Confirm production deploy
read -rp "Confirm production deployment? (Y/n) " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 0
fi

# 2. Backup database
BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d%H%M%S).sql"
mysqldump -u USER -pPASSWORD DB_NAME > "$BACKUP_FILE"  # Replace with your command
echo "Database backup created: $BACKUP_FILE"

# Determine current active environment
original_active=$(readlink -f "$ACTIVE_LINK")
if [ "$original_active" = "$BLUE_DIR" ]; then
    active="blue"
    target="green"
    target_dir="$GREEN_DIR"
else
    active="green"
    target="blue"
    target_dir="$BLUE_DIR"
fi

DEPLOY_STARTED=true
notify_slack ":rocket: Starting production deployment to $target"

# 3-5. Pull code, build, deploy to inactive environment
cd "$target_dir"
git pull origin main           # Update with your source control
npm install                    # Update with your build steps
npm run build                  # Update with your build steps
systemctl restart "${SERVICE_NAME}@${target}.service"  # Update with your service

# 6. Health check validation
if ! check_health "${HEALTH_CHECK_URL}"; then
    echo "Health check FAILED on new deployment"
    exit 1
fi

# 7. Switch traffic
ln -sfn "$target_dir" "$ACTIVE_LINK"
systemctl reload nginx  # Update this for your proxy/server
echo "Traffic switched to $target environment"

# 8. Monitor for 5 minutes
notify_slack ":eyes: New deployment in production - monitoring for 5 minutes"
for i in {1..30}; do
    if ! check_health "$HEALTH_CHECK_URL"; then
        echo "Post-deployment health check FAILED"
        exit 1
    fi
    sleep 10
done

# 9. Success
trap - ERR  # Disable error trap
notify_slack ":white_check_mark: Production deployment to $target completed successfully"
echo "Deployment successful"
