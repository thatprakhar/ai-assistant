import { v4 as uuidv4 } from "uuid";
import { EgressGateway } from "../gateways/egress";

export interface JobPayload {
    runId: string;
    chatId: string;
    initialMessageId: string;
    taskType: string;
    agentRole: string;
    payload: any;
}

export class Scheduler {
    /**
     * H2: Scheduler + IPC
     * In a production system, this would push to a Redis/RabbitMQ queue.
     * For our MVP, we simulate a queue using an async worker loop or simple Promises.
     */
    static async enqueueJob(job: JobPayload): Promise<string> {
        const jobId = uuidv4();
        console.log(`[Scheduler] Enqueued job ${jobId} for role ${job.agentRole}`);

        // Notify the user via Outbound Channel (H4)
        await EgressGateway.sendMessage(
            job.runId,
            job.chatId,
            `⏳ Starting background task: ${job.taskType}`
        );

        // Simulated background processing
        setTimeout(() => {
            this.processJob(jobId, job).catch((err) => {
                console.error(`[Scheduler] Job ${jobId} failed:`, err);
                this.handleFailure(job, err);
            });
        }, 100);

        return jobId;
    }

    private static async processJob(jobId: string, job: JobPayload) {
        console.log(`[Scheduler] Processing job ${jobId}...`);

        // Here we would invoke the actual subagent based on job.agentRole

        // H4: Progress Events
        await EgressGateway.sendMessage(
            job.runId,
            job.chatId,
            `✅ Completed background task: ${job.taskType}`
        );
    }

    /**
     * H5: Failure Handling
     */
    private static async handleFailure(job: JobPayload, error: Error) {
        console.log(`[Scheduler] Handling failure for run ${job.runId}`);
        await EgressGateway.sendMessage(
            job.runId,
            job.chatId,
            `❌ The background task "${job.taskType}" failed: ${error.message}`
        );
        // Additional IPC to notify Master orchestrator to retry or mark run as blocked
    }
}
