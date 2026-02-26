import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const PROJECT_ROOT = process.cwd();
const DB_DIR = path.join(PROJECT_ROOT, "runs");
const DB_PATH = path.join(DB_DIR, "system.sqlite");

// Ensure the directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize SQLite Database
export const db: Database.Database = new Database(DB_PATH, { verbose: console.log });
db.pragma("journal_mode = WAL");

// Setup Schema (Idempotent)
export function initDB() {
    db.exec(`
        -- 1. Inbound Events (Webhook Deduplication)
        CREATE TABLE IF NOT EXISTS inbound_events (
            id TEXT PRIMARY KEY,
            message_id TEXT NOT NULL,
            chat_id TEXT NOT NULL,
            ts DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT NOT NULL, -- 'pending', 'processed', 'failed'
            run_id TEXT,          -- Links to the run created for this event
            UNIQUE(chat_id, message_id)
        );

        -- 2. Runs (Conversational Threads / Job Executions)
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            thread_key TEXT NOT NULL, -- tie single user to one thread usually, or tie to a project
            state TEXT NOT NULL,      -- 'active', 'completed', 'blocked', 'failed'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 3. Steps (Granular Execution Tracking within a Run)
        CREATE TABLE IF NOT EXISTS steps (
            id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            tool_or_subtask TEXT NOT NULL,
            status TEXT NOT NULL,     -- 'pending', 'running', 'success', 'error'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(run_id) REFERENCES runs(id)
        );

        -- 4. Checkpoints (State Snapshots for Resumability)
        CREATE TABLE IF NOT EXISTS checkpoints (
            id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            step_id TEXT NOT NULL,
            snapshot_pointer TEXT NOT NULL, -- Path to the saved state JSON on disk
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(run_id) REFERENCES runs(id),
            FOREIGN KEY(step_id) REFERENCES steps(id)
        );

        -- 5. Outbound Messages (Egress Deduplication & Queueing)
        CREATE TABLE IF NOT EXISTS outbound_messages (
            id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            chat_id TEXT NOT NULL,
            payload TEXT NOT NULL, -- JSON serialized message payload
            status TEXT NOT NULL,  -- 'queued', 'sent', 'failed'
            send_id TEXT,          -- WhatsApp's assigned message ID from their API response
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(run_id) REFERENCES runs(id)
        );
    `);
}
