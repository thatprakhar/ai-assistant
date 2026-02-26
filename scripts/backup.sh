#!/bin/bash
# scripts/backup.sh
# Creates a backup of the SQLite database and run snapshots
# Usage: ./scripts/backup.sh

set -e

SOURCE_DIR="./runs"
BACKUP_ROOT="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/backup_${TIMESTAMP}"

# Create backup dir
mkdir -p "$BACKUP_DIR"

echo "Creating backup at $BACKUP_DIR"

# Check if runs directory exists
if [ -d "$SOURCE_DIR" ]; then
    # Copy the whole runs directory (which includes system.sqlite and all run folders with snapshots)
    cp -r "$SOURCE_DIR" "$BACKUP_DIR/"
    echo "Backup completed successfully."
else
    echo "No runs directory found. Nothing to backup."
fi

# Rotate backups (keep last 5)
cd "$BACKUP_ROOT"
ls -1tr | head -n -5 | xargs -d '\n' rm -rf --
echo "Rotated old backups (kept latest 5)."
