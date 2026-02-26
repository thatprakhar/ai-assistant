import { z } from "zod";
import { Id, NonEmptyString } from "./common";

export const TestResult = z.object({
    testId: Id,
    status: z.enum(["pass", "fail", "blocked"]),
    notes: z.string().default(""),
});

export const Regression = z.object({
    area: NonEmptyString,
    symptom: NonEmptyString,
    severity: z.enum(["low", "med", "high"]),
});

export const RequiredFix = z.object({
    issue: NonEmptyString,
    owner: z.literal("eng"),
    severity: z.enum(["low", "med", "high"]),
});

export const QAReportSchema = z.object({
    results: z.array(TestResult).min(1),
    regressions: z.array(Regression).default([]),
    shipRecommendation: z.enum(["ship", "ship_with_known_issues", "do_not_ship"]),
    requiredFixes: z.array(RequiredFix).default([]),
});

export type QAReport = z.infer<typeof QAReportSchema>;