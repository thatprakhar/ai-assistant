import { z } from "zod";

export const IsoDateString = z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid ISO date string");

export const AgentRole = z.enum(["founder", "pm", "design", "eng", "qa"]);
export type AgentRole = z.infer<typeof AgentRole>;

export const ArtifactStatus = z.enum(["draft", "ready", "blocked"]);
export type ArtifactStatus = z.infer<typeof ArtifactStatus>;


export const Priority = z.enum(["P0", "P1", "P2"]);
export type Priority = z.infer<typeof Priority>;

export const RequirementPriority = z.enum(["must", "should", "could"]);
export type RequirementPriority = z.infer<typeof RequirementPriority>;

export const Id = z
    .string()
    .min(1)
    .max(128);

export const NonEmptyString = z.string().min(1);

export const StringArray = z.array(z.string());

export const ToolName = z.enum(["bash", "browser", "mcp", "files"]);
export type ToolName = z.infer<typeof ToolName>;