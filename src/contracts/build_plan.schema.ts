import { z } from "zod";
import { Id, Priority, NonEmptyString } from "./common";

export const ImplementationMilestone = z.object({
    milestoneId: Id,          // maps to spec.milestones[].id
    scope: z.array(Id).min(1), // FR/NFR/FLOW ids, etc.
    priority: Priority,
    releaseCriteria: z.array(Id).min(1), // AC ids
});

export const RiskItem = z.object({
    risk: NonEmptyString,
    mitigation: NonEmptyString,
});

export const BuildPlanSchema = z.object({
    implementationMilestones: z.array(ImplementationMilestone).min(1),
    riskList: z.array(RiskItem).default([]),
});

export type BuildPlan = z.infer<typeof BuildPlanSchema>;