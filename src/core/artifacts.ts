// src/core/artifacts.ts
//
// Workstream B: Artifact system + run folder layout
// - Enforces artifact format: JSON header + markdown body (separated by "---\n")
// - Writes both .json and .md artifacts
// - Creates run folder structure deterministically
//
// Assumptions:
// - Runs live under ./runs (gitignored)
// - Artifacts live under ./runs/<runId>/artifacts
// - Scratch folders live under ./runs/<runId>/scratch/<role>

import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { AgentRole, ArtifactStatus } from "../contracts/common";
import type { ZodSchema } from "zod";

export type ArtifactType =
    | "context"
    | "spec"
    | "build_plan"
    | "design"
    | "implementation"
    | "qa_plan"
    | "qa_report"
    | "open_question"
    | "decision_proposal"
    | string;

export type ArtifactHeader = {
    runId: string;
    artifactType: string;
    authorRole: AgentRole;
    version: number;
    status: ArtifactStatus;
    createdAt: string;
};

export type JsonArtifact<TBody = unknown> = {
    header: ArtifactHeader;
    body: TBody;
    meta?: {
        sha256?: string;
        bytes?: number;
    };
};

export type WriteArtifactInput<TBody> = {
    runId: string;
    artifactType: ArtifactType;
    authorRole: AgentRole;

    body: TBody; // the structured contract body
    markdown: string; // human-readable artifact

    schema?: ZodSchema<TBody>; // recommended: validate body before write

    status?: ArtifactStatus; // default "draft"
    version?: number; // default 1
    dependsOn?: string[];
    notes?: string;

    // default: ./runs
    runsRootDir?: string;
    // if true, will also create a "runs/<runId>/artifacts/index.json" entry (optional)
    updateIndex?: boolean;
};

export type ReadArtifactResult<TBody = unknown> = {
    json: JsonArtifact<TBody>;
    markdown: {
        header: ArtifactHeader;
        body: string;
        raw: string;
    };
    paths: {
        jsonPath: string;
        mdPath: string;
    };
};

const DEFAULT_RUNS_ROOT = "runs";
const MD_SEPARATOR = "\n---\n";

export function getRunDir(runId: string, runsRootDir = DEFAULT_RUNS_ROOT) {
    return path.join(runsRootDir, runId);
}
export function getArtifactsDir(runId: string, runsRootDir = DEFAULT_RUNS_ROOT) {
    return path.join(getRunDir(runId, runsRootDir), "artifacts");
}
export function getScratchDir(runId: string, runsRootDir = DEFAULT_RUNS_ROOT) {
    return path.join(getRunDir(runId, runsRootDir), "scratch");
}

export async function ensureRunFolders(runId: string, runsRootDir = DEFAULT_RUNS_ROOT) {
    if (!runId) throw new Error("ensureRunFolders: runId is required");

    const runDir = getRunDir(runId, runsRootDir);
    const artifactsDir = getArtifactsDir(runId, runsRootDir);
    const scratchDir = getScratchDir(runId, runsRootDir);

    await fs.mkdir(runDir, { recursive: true });
    await fs.mkdir(artifactsDir, { recursive: true });

    // Per-role scratch
    const roles: AgentRole[] = ["founder", "pm", "design", "eng", "qa"];
    await fs.mkdir(scratchDir, { recursive: true });
    await Promise.all(
        roles.map((r) => fs.mkdir(path.join(scratchDir, r), { recursive: true }))
    );
}

export function artifactPaths(
    runId: string,
    artifactType: ArtifactType,
    runsRootDir = DEFAULT_RUNS_ROOT
) {
    const baseDir = getArtifactsDir(runId, runsRootDir);
    return {
        jsonPath: path.join(baseDir, `${artifactType}.json`),
        mdPath: path.join(baseDir, `${artifactType}.md`),
    };
}

function sha256(buf: Buffer) {
    return crypto.createHash("sha256").update(buf).digest("hex");
}

export async function writeArtifact<TBody>(
    input: WriteArtifactInput<TBody>
): Promise<{ jsonPath: string; mdPath: string; sha: string }> {
    const {
        runId,
        artifactType,
        authorRole,
        body,
        markdown,
        schema,
        status = "draft",
        version = 1,
        dependsOn,
        notes,
        runsRootDir = DEFAULT_RUNS_ROOT,
        updateIndex = true,
    } = input;

    if (!runId) throw new Error("writeArtifact: runId is required");
    if (!artifactType) throw new Error("writeArtifact: artifactType is required");
    if (!authorRole) throw new Error("writeArtifact: authorRole is required");

    // Ensure folder structure exists
    await ensureRunFolders(runId, runsRootDir);

    // Validate schema (fail fast; never write invalid artifacts)
    if (schema) {
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            throw new Error(
                `writeArtifact: schema validation failed for ${artifactType}\n${parsed.error.toString()}`
            );
        }
    }

    const header: ArtifactHeader = {
        runId,
        artifactType,
        authorRole,
        version,
        status,
        createdAt: new Date().toISOString(),
        ...(dependsOn?.length ? { dependsOn } : {}),
        ...(notes ? { notes } : {}),
    };

    const mdContent = `${JSON.stringify(header, null, 2)}${MD_SEPARATOR}${markdown}\n`;

    // Compute sha on the markdown content (useful for indexing/audit)
    const mdBuf = Buffer.from(mdContent, "utf8");
    const mdSha = sha256(mdBuf);

    const jsonArtifact: JsonArtifact<TBody> = {
        header,
        body,
        meta: {
            sha256: mdSha,
            bytes: mdBuf.byteLength,
        },
    };

    const { jsonPath, mdPath } = artifactPaths(runId, artifactType, runsRootDir);

    // Atomic-ish write: write temp then rename
    await atomicWriteFile(jsonPath, JSON.stringify(jsonArtifact, null, 2) + "\n");
    await atomicWriteFile(mdPath, mdContent);

    if (updateIndex) {
        await upsertArtifactsIndex(runId, runsRootDir, {
            artifactType,
            jsonPath,
            mdPath,
            header,
            sha256: mdSha,
        });
    }

    return { jsonPath, mdPath, sha: mdSha };
}

export async function readArtifact<TBody = unknown>(
    runId: string,
    artifactType: ArtifactType,
    runsRootDir = DEFAULT_RUNS_ROOT
): Promise<ReadArtifactResult<TBody>> {
    const { jsonPath, mdPath } = artifactPaths(runId, artifactType, runsRootDir);

    const [jsonRaw, mdRaw] = await Promise.all([
        fs.readFile(jsonPath, "utf8"),
        fs.readFile(mdPath, "utf8"),
    ]);

    const json = JSON.parse(jsonRaw) as JsonArtifact<TBody>;
    const markdownParsed = parseMarkdownArtifact(mdRaw);

    // Sanity: header should match
    if (json.header.runId !== markdownParsed.header.runId) {
        throw new Error(
            `readArtifact: header mismatch (json.runId=${json.header.runId}, md.runId=${markdownParsed.header.runId})`
        );
    }
    if (json.header.artifactType !== markdownParsed.header.artifactType) {
        throw new Error(
            `readArtifact: header mismatch (json.type=${json.header.artifactType}, md.type=${markdownParsed.header.artifactType})`
        );
    }

    return {
        json,
        markdown: markdownParsed,
        paths: { jsonPath, mdPath },
    };
}

export async function listArtifacts(
    runId: string,
    runsRootDir = DEFAULT_RUNS_ROOT
): Promise<{ artifactType: string; jsonPath: string; mdPath: string }[]> {
    const dir = getArtifactsDir(runId, runsRootDir);
    const entries = await fs.readdir(dir, { withFileTypes: true });

    // Pair .json with .md by basename
    const jsonFiles = new Set(
        entries
            .filter((e: any) => e.isFile() && e.name.endsWith(".json"))
            .map((e: any) => e.name.slice(0, -".json".length))
    );

    const mdFiles = new Set(
        entries
            .filter((e: any) => e.isFile() && e.name.endsWith(".md"))
            .map((e: any) => e.name.slice(0, -".md".length))
    );

    const types = [...new Set([...jsonFiles, ...mdFiles])].sort();

    return types
        .filter((t) => jsonFiles.has(t) && mdFiles.has(t))
        .map((t) => ({
            artifactType: t as string,
            jsonPath: path.join(dir, `${t}.json`),
            mdPath: path.join(dir, `${t}.md`),
        }));
}

export function parseMarkdownArtifact(mdRaw: string): {
    header: ArtifactHeader;
    body: string;
    raw: string;
} {
    const idx = mdRaw.indexOf(MD_SEPARATOR);
    if (idx === -1) {
        throw new Error(
            `parseMarkdownArtifact: missing separator "${MD_SEPARATOR.replace(/\n/g, "\\n")}"`
        );
    }
    const headerStr = mdRaw.slice(0, idx).trim();
    const body = mdRaw.slice(idx + MD_SEPARATOR.length).trimEnd();

    let header: ArtifactHeader;
    try {
        header = JSON.parse(headerStr) as ArtifactHeader;
    } catch (e) {
        throw new Error(`parseMarkdownArtifact: header is not valid JSON: ${(e as Error).message}`);
    }
    return { header, body, raw: mdRaw };
}

async function atomicWriteFile(filePath: string, content: string) {
    const dir = path.dirname(filePath);
    const tmp = path.join(dir, `.${path.basename(filePath)}.${crypto.randomUUID()}.tmp`);
    await fs.writeFile(tmp, content, "utf8");
    await fs.rename(tmp, filePath);
}

type ArtifactsIndexEntry = {
    artifactType: string;
    jsonPath: string;
    mdPath: string;
    header: ArtifactHeader;
    sha256: string;
};

async function upsertArtifactsIndex(
    runId: string,
    runsRootDir: string,
    entry: ArtifactsIndexEntry
) {
    const indexPath = path.join(getArtifactsDir(runId, runsRootDir), "index.json");
    let index: { runId: string; updatedAt: string; artifacts: ArtifactsIndexEntry[] } = {
        runId,
        updatedAt: new Date().toISOString(),
        artifacts: [],
    };

    try {
        const raw = await fs.readFile(indexPath, "utf8");
        index = JSON.parse(raw);
    } catch {
        // index doesn't exist yet; that's fine
    }

    const i = index.artifacts.findIndex((a) => a.artifactType === entry.artifactType);
    if (i >= 0) index.artifacts[i] = entry;
    else index.artifacts.push(entry);

    index.updatedAt = new Date().toISOString();
    index.artifacts.sort((a, b) => a.artifactType.localeCompare(b.artifactType));

    await atomicWriteFile(indexPath, JSON.stringify(index, null, 2) + "\n");
}