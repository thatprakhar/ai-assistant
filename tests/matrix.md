# System Test Matrix (Milestone 6)

## Core Workflows
| ID | Workflow | Execution | Expected Outcome | Status |
|---|---|---|---|---|
| M6-1 | Developer asks a simple question (`"What is our stack?"`) | WhatsApp Ingress -> Master Agent (Sync) -> WhatsApp Egress | Agent replies quickly without spawning subagents. State completes. | Pending |
| M6-2 | Developer requests a new feature (`"Build a login page"`) | WhatsApp Ingress -> Master Agent (Async) -> PM -> Design -> Eng -> QA -> WhatsApp Egress | Agent spawns asynchronous sub-agents. Sends progress webhooks to WhatsApp. Completes with an Implementation Artifact. | Pending |
| M6-3 | Agent hits a blocker | Subagent -> Master Agent -> WhatsApp Egress (OpenQuestion) | Agent halts execution, sends an OpenQuestion to the user on WhatsApp, waits for user reply. | Pending |

## Tool Constraints
| ID | Workflow | Execution | Expected Outcome | Status |
|---|---|---|---|---|
| M6-4 | PM Agent attempts to run a bash command | PM Agent -> ToolRunner (Bash) | ToolRunner throws strictly enforced `Permission Denied` error. | Pending |
| M6-5 | Engine crashes during subagent execution | Process killed | Egress webhook alerts user of task failure, does not hang indefinitely. | Pending |

## Execution idempotency
| ID | Workflow | Execution | Expected Outcome | Status |
|---|---|---|---|---|
| M6-6 | Same message sent twice to Webhook | Fastify Ingress -> Duplicate Check | Second message immediately dropped with 200 OK. No duplicate run created. | Pending |
