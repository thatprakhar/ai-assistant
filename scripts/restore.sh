#!/bin/bash
# scripts/restore.sh
# Restores the `runs` directory from a specific backup
# Usage: ./scripts/restore.sh [backup_folder_name]

set -e

BACKUP_ROOT="./backups"

if [ -z "$1" ]; then
    echo "Usage: $0 [backup_folder_name]"
    echo "Available backups:"
    ls -1 "$BACKUP_ROOT"
    exit 1
fi

BACKUP_DIR="${BACKUP_ROOT}/$1"
TARGET_DIR="./runs"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup $BACKUP_DIR not found!"
    exit 1
fi

echo "Warning: This will overwrite the current runs/ database and artifacts."
read -p "Are you sure? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Remove Current
    rm -rf "$TARGET_DIR"
    # Restore from Backup (copy contents of runs/ from inside the backup folder back to root)
    cp -r "${BACKUP_DIR}/runs" "./runs"
    echo "Restore completed from $1."
else
    echo "Restore cancelled."
fi
