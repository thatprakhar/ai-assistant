import { z } from "zod";
import { Id, NonEmptyString, RequirementPriority, AgentRole } from "./common";

export const FunctionalRequirement = z.object({
    id: Id, // e.g. "FR-1"
    text: NonEmptyString,
    priority: RequirementPriority,
});

export const NonFunctionalRequirement = z.object({
    id: Id, // e.g. "NFR-1"
    text: NonEmptyString,
    priority: RequirementPriority,
});

export const OpenQuestion = z.object({
    id: Id, // e.g. "Q-1"
    question: NonEmptyString,
    owner: AgentRole,
});

export const AcceptanceCriterion = z.object({
    id: Id, // e.g. "AC-1"
    text: NonEmptyString,
});

export const Milestone = z.object({
    id: Id, // e.g. "M1"
    name: NonEmptyString,
    definitionOfDone: z.array(NonEmptyString).min(1),
});

export const SpecSchema = z.object({
    problemStatement: NonEmptyString,
    targetUser: NonEmptyString.default("single-user (founder)"),
    userJourney: z.array(NonEmptyString).min(1),
    functionalRequirements: z.array(FunctionalRequirement).min(1),
    nonFunctionalRequirements: z.array(NonFunctionalRequirement).default([]),
    outOfScope: z.array(NonEmptyString).default([]),
    openQuestions: z.array(OpenQuestion).default([]),
    acceptanceCriteria: z.array(AcceptanceCriterion).min(1),
    milestones: z.array(Milestone).min(1),
});

export type Spec = z.infer<typeof SpecSchema>;