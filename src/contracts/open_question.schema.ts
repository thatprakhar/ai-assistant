import { z } from "zod";
import { NonEmptyString, AgentRole, Id } from "./common";

export const OpenQuestionArtifactSchema = z.object({
    questionId: Id,
    fromRole: AgentRole,
    toRole: AgentRole,
    question: NonEmptyString,
    context: z.string().default(""),
    suggestedOptions: z.array(NonEmptyString).default([]),
});

export type OpenQuestionArtifact = z.infer<typeof OpenQuestionArtifactSchema>;