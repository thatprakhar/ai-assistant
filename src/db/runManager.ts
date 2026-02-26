import { db } from "./schema";
import { v4 as uuidv4 } from "uuid";

export type RunState = "active" | "completed" | "blocked" | "failed";
export type StepStatus = "pending" | "running" | "success" | "error";

export interface Run {
    id: string;
    thread_key: string;
    state: RunState;
    created_at: string;
    updated_at: string;
}

export interface Step {
    id: string;
    run_id: string;
    tool_or_subtask: string;
    status: StepStatus;
    created_at: string;
    updated_at: string;
}

/**
 * RunManager
 * 
 * System Authority Boundaries:
 * - DB Record (`runs`, `steps`): Canonical for active status, step history, and lifecycle
 * - Filesystem Artifacts (`runs/<id>/artifacts/`): Canonical for content and contract data
 * - Checkpoint Snapshots (`runs/<id>/snapshots/`): Canonical for LangGraph state resumability
 */
export class RunManager {
    /**
     * Creates a new run for a given conversation thread.
     */
    static createRun(threadKey: string): Run {
        const id = uuidv4();
        const stmt = db.prepare(`
            INSERT INTO runs (id, thread_key, state)
            VALUES (?, ?, 'active')
            RETURNING *
        `);
        return stmt.get(id, threadKey) as Run;
    }

    /**
     * Loads an existing run by its ID.
     */
    static loadRun(runId: string): Run | undefined {
        const stmt = db.prepare(`SELECT * FROM runs WHERE id = ?`);
        return stmt.get(runId) as Run | undefined;
    }

    /**
     * Transitions a run's state.
     */
    static updateRunState(runId: string, state: RunState): void {
        const stmt = db.prepare(`
            UPDATE runs 
            SET state = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
        stmt.run(state, runId);
    }

    /**
     * Appends a new execution step to an existing run.
     */
    static appendStep(runId: string, toolOrSubtask: string): Step {
        const id = uuidv4();
        const stmt = db.prepare(`
            INSERT INTO steps (id, run_id, tool_or_subtask, status)
            VALUES (?, ?, ?, 'pending')
            RETURNING *
        `);
        return stmt.get(id, runId, toolOrSubtask) as Step;
    }

    /**
     * Updates the status of an execution step.
     */
    static updateStepStatus(stepId: string, status: StepStatus): void {
        const stmt = db.prepare(`
            UPDATE steps 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
        stmt.run(status, stepId);
    }

    /**
     * Retrieves all steps for a given run ordered chronologically.
     */
    static getStepsForRun(runId: string): Step[] {
        const stmt = db.prepare(`
            SELECT * FROM steps 
            WHERE run_id = ? 
            ORDER BY created_at ASC
        `);
        return stmt.all(runId) as Step[];
    }
}
