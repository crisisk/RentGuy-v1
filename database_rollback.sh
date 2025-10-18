#!/bin/bash
# scripts/database_rollback.sh

set -euo pipefail

TIMESTAMP=$(date +%F_%T)
DB_NAME="${DB_NAME:-rentguy_production}"
BACKUP_DIR="/var/backups/rentguy/database"
LOG_FILE="/var/log/rentguy/rollback.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

create_safety_backup() {
    local table_name="$1"
    local safety_table="${table_name}_safety_${TIMESTAMP}"
    
    log "Creating safety backup for table: $table_name"
    mysql -e "CREATE TABLE ${safety_table} LIKE ${table_name};" "$DB_NAME"
    mysql -e "INSERT INTO ${safety_table} SELECT * FROM ${table_name};" "$DB_NAME"
    
    echo "$safety_table"
}

rollback_table() {
    local table_name="$1"
    local backup_file="$2"
    
    log "Starting rollback for table: $table_name"
    
    # Create safety backup
    safety_table=$(create_safety_backup "$table_name")
    
    # Validate backup file
    if ! mysql "$DB_NAME" < "$backup_file" --dry-run 2>/dev/null; then
        log "ERROR: Backup file validation failed for $table_name"
        return 1
    fi
    
    # Perform rollback
    mysql -e "DROP TABLE ${table_name};" "$DB_NAME"
    mysql "$DB_NAME" < "$backup_file"
    
    log "Rollback completed for table: $table_name"
    log "Safety backup available as: $safety_table"
}

# Main rollback function
main() {
    local backup_timestamp="$1"
    
    if [[ -z "$backup_timestamp" ]]; then
        log "ERROR: Backup timestamp required"
        exit 1
    fi
    
    log "Starting database rollback to timestamp: $backup_timestamp"
    
    # Rollback critical tables
    for table in invoices invoice_items equipment_items equipment_reservations; do
        backup_file="${BACKUP_DIR}/${table}_${backup_timestamp}.sql"
        
        if [[ -f "$backup_file" ]]; then
            rollback_table "$table" "$backup_file"
        else
            log "WARNING: Backup file not found: $backup_file"
        fi
    done
    
    log "Database rollback completed"
}

main "$@"
