import { z } from "zod";
import { Id, NonEmptyString } from "./common";

export const TestCase = z.object({
    id: Id, // "T-1"
    type: z.enum(["unit", "integration", "manual"]),
    covers: z.array(Id).min(1), // AC-1, FLOW-1, FR-2
    steps: z.array(NonEmptyString).min(1),
    expected: NonEmptyString,
});

export const RiskBasedTest = z.object({
    risk: NonEmptyString,
    tests: z.array(Id).min(1),
});

export const QAPlanSchema = z.object({
    testMatrix: z.array(TestCase).min(1),
    riskBasedTests: z.array(RiskBasedTest).default([]),
});

export type QAPlan = z.infer<typeof QAPlanSchema>;