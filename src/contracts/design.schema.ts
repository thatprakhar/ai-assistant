import { z } from "zod";
import { Id, NonEmptyString } from "./common";

export const UXFlow = z.object({
    id: Id, // "FLOW-1"
    name: NonEmptyString,
    steps: z.array(NonEmptyString).min(1),
    edgeCases: z.array(NonEmptyString).default([]),
});

export const CopyItem = z.object({
    key: NonEmptyString, // e.g. "error.generic"
    text: NonEmptyString,
    toneNotes: z.string().default(""),
});

export const InteractionRule = z.object({
    rule: NonEmptyString,
    rationale: z.string().default(""),
});

export const WhatsAppSurfaceState = z.object({
    surface: z.literal("whatsapp"),
    state: z.enum(["loading", "success", "error", "partial", "needs_clarification"]),
    behavior: NonEmptyString,
});

export const DesignDecision = z.object({
    decision: NonEmptyString,
    tradeoff: NonEmptyString,
});

export const DesignSchema = z.object({
    uxGoals: z.array(NonEmptyString).min(1),
    informationArchitecture: z.array(
        z.object({
            area: NonEmptyString,
            contents: z.array(NonEmptyString).min(1),
        })
    ).default([]),
    flows: z.array(UXFlow).min(1),
    copy: z.array(CopyItem).default([]),
    interactionRules: z.array(InteractionRule).default([]),
    states: z.array(WhatsAppSurfaceState).min(1),
    designDecisions: z.array(DesignDecision).default([]),
    handoffNotesForEng: z.array(NonEmptyString).default([]),
});

export type Design = z.infer<typeof DesignSchema>;