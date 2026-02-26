import { db } from "./schema";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

const PROJECT_ROOT = process.cwd();

export interface Checkpoint {
    id: string;
    run_id: string;
    step_id: string;
    snapshot_pointer: string;
    created_at: string;
}

export class CheckpointWriter {
    /**
     * Saves a snapshot of an agent's state to disk and logs the checkpoint in SQLite.
     * 
     * @param runId The ID of the run
     * @param stepId The ID of the step this checkpoint corresponds to
     * @param state The JSON serializable state object to snapshot
     */
    static async saveCheckpoint(runId: string, stepId: string, state: any): Promise<Checkpoint> {
        const id = uuidv4();

        // Define path: runs/<runId>/snapshots/
        const snapshotDir = path.join(PROJECT_ROOT, "runs", runId, "snapshots");
        await fs.mkdir(snapshotDir, { recursive: true });

        const snapshotFileName = `${stepId}-${id}.json`;
        const snapshotPointer = path.join(snapshotDir, snapshotFileName);

        // Write to disk
        await fs.writeFile(snapshotPointer, JSON.stringify(state, null, 2), "utf-8");

        // Write pointer to SQLite
        const stmt = db.prepare(`
            INSERT INTO checkpoints (id, run_id, step_id, snapshot_pointer)
            VALUES (?, ?, ?, ?)
            RETURNING *
        `);
        return stmt.get(id, runId, stepId, snapshotPointer) as Checkpoint;
    }

    /**
     * Retrieves the latest checkpoint for a run to resume from.
     */
    static getLatestCheckpoint(runId: string): Checkpoint | undefined {
        const stmt = db.prepare(`
            SELECT * FROM checkpoints
            WHERE run_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        `);
        return stmt.get(runId) as Checkpoint | undefined;
    }

    /**
     * Loads the actual state data from a checkpoint pointer.
     */
    static async loadStateData(checkpoint: Checkpoint): Promise<any> {
        try {
            const data = await fs.readFile(checkpoint.snapshot_pointer, "utf-8");
            return JSON.parse(data);
        } catch (error: any) {
            throw new Error(`Failed to load checkpoint state from ${checkpoint.snapshot_pointer}: ${error.message}`);
        }
    }
}
