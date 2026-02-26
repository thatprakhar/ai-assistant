import { z } from "zod";
import { NonEmptyString, StringArray, ToolName } from "./common";

export const ContextSchema = z.object({
    objective: NonEmptyString,
    nonGoals: StringArray.default([]),
    constraints: z.object({
        timeBudgetSec: z.number().int().positive().default(60),
        toolsAllowed: z.array(ToolName).default(["files", "bash"]),
        externalSideEffectsAllowed: z.boolean().default(false),
    }),
    successCriteria: z.array(NonEmptyString).min(1),
    currentState: NonEmptyString.default(""),
    references: z.object({
        companyDocs: StringArray.default([]),
        repoPaths: StringArray.default([]),
        links: StringArray.default([]),
    }),
});

export type Context = z.infer<typeof ContextSchema>;