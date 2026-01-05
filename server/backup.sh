#!/bin/bash

# MongoDB Backup Script for Daily Activity Infrastructure Engineer
# Usage: ./backup.sh [daily|weekly|manual] [--no-cloud]

# Configuration
BACKUP_DIR="/var/backups/mongodb"
MONGO_DB="project-tracker"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_TYPE=${1:-manual}
RETENTION_DAYS=30

# Cloud backup settings
RCLONE_REMOTE="gdrive"  # Name of your rclone remote (configure with 'rclone config')
CLOUD_BACKUP_DIR="NUC-Backups/mongodb"  # Folder in Google Drive
ENABLE_CLOUD_BACKUP=true  # Set to false to disable cloud uploads

# Check for --no-cloud flag
if [[ "$2" == "--no-cloud" ]] || [[ "$1" == "--no-cloud" ]]; then
    ENABLE_CLOUD_BACKUP=false
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/manual"

# Determine backup folder
case $BACKUP_TYPE in
    daily)
        BACKUP_PATH="$BACKUP_DIR/daily"
        RETENTION_DAYS=7
        ;;
    weekly)
        BACKUP_PATH="$BACKUP_DIR/weekly"
        RETENTION_DAYS=30
        ;;
    *)
        BACKUP_PATH="$BACKUP_DIR/manual"
        RETENTION_DAYS=90
        ;;
esac

BACKUP_NAME="backup_${MONGO_DB}_${BACKUP_TYPE}_${DATE}"

echo "======================================"
echo "MongoDB Backup Script"
echo "======================================"
echo "Date: $(date)"
echo "Type: $BACKUP_TYPE"
echo "Database: $MONGO_DB"
echo "Output: $BACKUP_PATH/$BACKUP_NAME"
echo "Cloud Backup: $ENABLE_CLOUD_BACKUP"
echo ""

# Create MongoDB dump
echo "Creating backup..."
mongodump --db "$MONGO_DB" --out "$BACKUP_PATH/$BACKUP_NAME" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database dump completed"
    
    # Compress the backup
    echo "Compressing backup..."
    cd "$BACKUP_PATH"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"
    
    echo "✅ Backup compressed: ${BACKUP_NAME}.tar.gz"
    
    # Show backup size
    BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    echo "   Size: $BACKUP_SIZE"
    
    # Upload to cloud if enabled
    if [ "$ENABLE_CLOUD_BACKUP" = true ]; then
        echo ""
        echo "Uploading to cloud..."
        
        # Check if rclone is installed
        if command -v rclone &> /dev/null; then
            # Check if remote is configured
            if rclone listremotes | grep -q "^${RCLONE_REMOTE}:"; then
                rclone copy "${BACKUP_NAME}.tar.gz" "${RCLONE_REMOTE}:${CLOUD_BACKUP_DIR}/${BACKUP_TYPE}/" --progress
                
                if [ $? -eq 0 ]; then
                    echo "✅ Uploaded to Google Drive: ${CLOUD_BACKUP_DIR}/${BACKUP_TYPE}/"
                    
                    # Clean up old cloud backups (keep last 10)
                    echo "Cleaning old cloud backups..."
                    rclone delete "${RCLONE_REMOTE}:${CLOUD_BACKUP_DIR}/${BACKUP_TYPE}/" --min-age ${RETENTION_DAYS}d 2>/dev/null
                else
                    echo "⚠️  Cloud upload failed - backup saved locally only"
                fi
            else
                echo "⚠️  rclone remote '$RCLONE_REMOTE' not configured"
                echo "   Run: rclone config"
                echo "   Backup saved locally only"
            fi
        else
            echo "⚠️  rclone not installed - backup saved locally only"
            echo "   Install with: curl https://rclone.org/install.sh | sudo bash"
        fi
    fi
    
    # Clean up old local backups
    echo ""
    echo "Cleaning up local backups older than $RETENTION_DAYS days..."
    find "$BACKUP_PATH" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    echo "✅ Cleanup completed"
    
    # List recent backups
    echo ""
    echo "Recent local backups:"
    ls -lht "$BACKUP_PATH"/*.tar.gz 2>/dev/null | head -5
    
    echo ""
    echo "======================================"
    echo "✅ Backup completed successfully!"
    echo "======================================"
else
    echo "❌ Backup failed!"
    exit 1
fi

