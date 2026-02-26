import { RunManager, Run } from "./runManager";
import { CheckpointWriter, Checkpoint } from "./checkpoint";

export interface ResumePayload {
    run: Run;
    latestCheckpoint?: Checkpoint;
    state?: any; // The deserialized agent state from the disk
}

export class ResumeEngine {
    /**
     * Prepares a run to be resumed by loading its DB record and latest checkpoint state.
     * 
     * @param runId The ID of the run to resume
     */
    static async prepareResume(runId: string): Promise<ResumePayload> {
        const run = RunManager.loadRun(runId);

        if (!run) {
            throw new Error(`Cannot resume: Run ${runId} not found.`);
        }

        if (run.state === "completed") {
            // Technically resumé-able if we want to run follow-ups, but basic logic blocks it
            console.warn(`Run ${runId} is already marked as completed.`);
        }

        const latestCheckpoint = CheckpointWriter.getLatestCheckpoint(runId);

        let state: any = undefined;
        if (latestCheckpoint) {
            state = await CheckpointWriter.loadStateData(latestCheckpoint);
        }

        // Once prepared, ensure run is marked as active before returning control
        if (run.state !== "active") {
            RunManager.updateRunState(runId, "active");
            run.state = "active";
        }

        const payload: ResumePayload = { run };
        if (latestCheckpoint) payload.latestCheckpoint = latestCheckpoint;
        if (state) payload.state = state;

        return payload;
    }
}
