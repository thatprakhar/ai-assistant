import { AgentRole, ToolName } from "../contracts/common";

/**
 * Global role-based tool allowlist.
 * Prevents unauthorized agents from using destructive tools.
 */
export const RolePermissions: Record<AgentRole, ToolName[]> = {
    founder: ["mcp", "files"], // Founder mostly queries and reviews
    pm: ["mcp", "browser", "files"], // PM browses, edits markdown specs, talks to MCP
    design: ["mcp", "files"], // Design edits design specs
    eng: ["bash", "files", "browser"], // Eng has bash access to build and edit code
    qa: ["bash", "files", "browser"], // QA runs automated checks
};

export class PermissionManager {
    static isAllowed(role: AgentRole, tool: ToolName): boolean {
        const allowedTools = RolePermissions[role] || [];
        return allowedTools.includes(tool);
    }

    static checkPermission(role: AgentRole, tool: ToolName): void {
        if (!this.isAllowed(role, tool)) {
            throw new Error(`Permission Denied: Role '${role}' is not allowed to use tool '${tool}'`);
        }
    }
}
