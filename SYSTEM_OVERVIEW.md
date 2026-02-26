🧠 AI COMPANY SYSTEM — MASTER ARCHITECTURE DOCUMENT
(Canonical reference for when everything gets confusing)

1. Core vision
We are building a single-user AI company that runs like a real engineering org:
Founder → PM → Design → Eng → QA
All coordinated through artifacts and runs
Triggered from WhatsApp
The system must:
think in structured steps
produce artifacts like a real org
support long-running complex tasks
be resumable and auditable
eventually run semi-autonomously
This is not a chatbot.
This is an operating system for execution.

2. Foundational philosophy (never violate these)
2.1 Artifacts are the source of truth
Agents do not talk directly.
They communicate only via artifacts:
context → spec → build_plan → design → implementation → qa_report

If something is not written as an artifact:
it does not exist
This ensures:
replayability
auditability
clarity
determinism of structure (not output)

2.2 Runs are the unit of execution
Every request = one run.
A run contains:
runs/<runId>/
  run.json
  artifacts/
  logs/
  scratch/

Everything must attach to a run:
artifacts
logs
tool calls
subagents
errors
If it doesn’t attach to a run:
it’s a bug

2.3 Contracts define reality
All outputs must match Zod schemas.
Agents cannot emit freeform garbage.
Contracts exist in:
src/contracts/

They define:
allowed structure
allowed fields
allowed transitions
Core code enforces them.

2.4 Determinism of structure, not output
We do NOT require:
deterministic LLM output
We DO require:
deterministic artifact structure
deterministic run lifecycle
deterministic state transitions
This is the difference between:
toy agent system
and
real execution engine

3. High-level architecture
WhatsApp
   ↓
Ingress Gateway
   ↓
Run Manager
   ↓
Master Agent (LangGraph)
   ↓
Subagents (optional)
   ↓
Tools layer
   ↓
Artifacts + Memory + Logs

Everything ties back to:
runId

4. Memory model
We have 3 memory layers.
4.1 Global company memory
Long-lived, rarely changes.
memory/company/
  vision.md
  roadmap.md
  architecture.md
  decisions.md

Used for:
long-term reasoning
consistency across runs

4.2 Per-run memory
Lives inside run folder.
runs/<runId>/artifacts/

Contains:
context
spec
design
implementation
qa
This is the “working memory” of the run.

4.3 Scratch memory (per role)
Temporary notes.
runs/<runId>/scratch/
  founder/
  pm/
  design/
  eng/
  qa/

Can be discarded safely.

5. Artifact lifecycle
Every run follows this chain:
1. Context
Created by founder agent
Defines:
objective
constraints
success criteria
2. Spec
Created by PM
Defines:
requirements
milestones
acceptance criteria
3. Build plan
Defines:
execution order
grouping
risks
4. Design
Defines:
flows
UX behavior
interaction model
5. Implementation
Defines:
changed files
commands to run
mapping to requirements
6. QA report
Defines:
pass/fail
regressions
ship recommendation
Nothing skips stages.

6. Master agent responsibilities
Master agent decides:
trivial task
→ call tools directly
→ respond
complex task
→ create run
→ generate context
→ spawn subagents
→ checkpoint progress
→ respond when complete
Definition of complex:
multi-step reasoning
code edits
browsing
parallel work
30–60s runtime

7. Tooling layer
Unified interface:
Tool.call(input) → ToolResult

Tool types:
bash (local commands)
files (read/write/patch)
browser (Playwright)
MCP servers
All tools must:
timeout
validate output
never crash master
return structured result

8. Sub-agent model
For long jobs:
Master spawns worker process:
child_process.spawn()

Contract:
input:
  runId
  subtaskId
  instructions
  context pointers

output:
  ok
  result
  artifacts
  logs

Workers:
can run minutes
can call tools
return results to master

9. Persistence model
SQLite (later):
runs
steps
tool_calls
subtasks
messages
checkpoints
memory
Filesystem:
artifacts
logs
snapshots
Backups:
periodic DB + run snapshot copy

10. Failure semantics
If tool fails:
→ retry bounded
→ fallback
→ report
If subagent fails:
→ master retries or reports
If master crashes:
→ resume from checkpoint
System must never:
silently lose progress

11. Observability (minimal but sufficient)
Every log includes:
runId
stepId
role
node
timestamp

Logs stored:
runs/<runId>/logs/system.log

Goal:
replay any run from logs + artifacts

12. Current build status
Completed
Contracts (Zod schemas)
Artifact system
Validation layer
Next
Run manager + lifecycle
Then:
Master agent graph
Then:
WhatsApp integration
Everything else builds on that.

13. Non-goals (for now)
Do NOT build:
fancy dashboards
distributed infra
auth
multi-user
cloud scaling
vector DB memory
analytics UI
Single machine.
Single user.
Rock solid core.

14. Guiding principle when confused
If ever lost, ask:
1. What run is this tied to?
If none → bug
2. What artifact should exist next?
If unclear → spec missing
3. Which agent is responsible?
If multiple → design wrong
4. Can this be replayed?
If no → architecture violation

15. What success looks like (v1)
You send WhatsApp message:
“Build X feature”
System:
creates run
produces spec
produces plan
edits files
runs tests
reports result
All inside:
runs/<runId>/

Fully traceable.
That is v1 success.

Final note
This system will feel:
over-structured
slow to set up
almost bureaucratic
Good.
Real execution engines are boringly structured.
Once this foundation is solid, everything else —
agents, autonomy, parallelism, memory —
becomes almost trivial to layer on.
Save this document.
When things get messy, this is your compass.

