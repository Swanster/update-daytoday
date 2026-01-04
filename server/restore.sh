#!/bin/bash

# Restore MongoDB Backup Script
# Usage: ./restore.sh <backup_file.tar.gz>

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file.tar.gz>"
    echo ""
    echo "Available backups:"
    ls -lht /var/backups/mongodb/*/*.tar.gz 2>/dev/null | head -10
    exit 1
fi

BACKUP_FILE=$1
MONGO_DB="project-tracker"
TEMP_DIR="/tmp/mongo_restore_$$"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "======================================"
echo "MongoDB Restore Script"
echo "======================================"
echo "Date: $(date)"
echo "Backup: $BACKUP_FILE"
echo "Database: $MONGO_DB"
echo ""

read -p "⚠️  This will REPLACE the current database. Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Create temp directory
mkdir -p "$TEMP_DIR"

# Extract backup
echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

if [ $? -ne 0 ]; then
    echo "❌ Failed to extract backup"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Find the extracted folder
BACKUP_FOLDER=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "backup_*" | head -1)

if [ -z "$BACKUP_FOLDER" ]; then
    echo "❌ Invalid backup format"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Restore the database
echo "Restoring database..."
mongorestore --drop --db "$MONGO_DB" "$BACKUP_FOLDER/$MONGO_DB" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✅ Database restored successfully!"
    echo "======================================"
else
    echo "❌ Restore failed!"
fi

# Cleanup
rm -rf "$TEMP_DIR"
