import { z } from "zod";
import { NonEmptyString, Id } from "./common";

export const ChangedArea = z.object({
    path: NonEmptyString,
    reason: NonEmptyString,
});

export const CommandToRun = z.object({
    cmd: NonEmptyString,
    expected: NonEmptyString,
});

export const FeatureFlag = z.object({
    name: NonEmptyString,
    default: z.enum(["on", "off"]),
    notes: z.string().default(""),
});

export const RequirementMapping = z.object({
    requirementId: Id, // FR-1, AC-2, etc.
    evidence: NonEmptyString,
});

export const TestingNote = z.object({
    type: z.enum(["unit", "integration", "manual"]),
    notes: NonEmptyString,
});

export const ImplementationSchema = z.object({
    changedAreas: z.array(ChangedArea).min(1),
    commandsToRun: z.array(CommandToRun).min(1),
    featureFlags: z.array(FeatureFlag).default([]),
    knownLimitations: z.array(NonEmptyString).default([]),
    testingNotes: z.array(TestingNote).default([]),
    mapsToRequirements: z.array(RequirementMapping).min(1),
});

export type Implementation = z.infer<typeof ImplementationSchema>;