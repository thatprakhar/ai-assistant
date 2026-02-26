# Agent Contracts

This directory contains the Zod schemas that define the absolute source of truth for all agent communication in the AI Company system.

**Foundational Philosophy:**
- Agents do not talk directly to each other; they communicate exclusively via these structured artifacts.
- If something is not written as an artifact that matches these schemas, it does not exist.
- Contracts ensure deterministic artifact structure, replayability, and auditability.

## Schemas Overview

### 1. Context (`context.schema.ts`)
Created by the **Founder** agent.
Defines the high-level bounds of the run.
- `objective`: The main goal.
- `nonGoals`: What to explicitly avoid.
- `constraints`: Time budget, allowed tools, and whether external side effects are permitted.
- `successCriteria`: Clear metric(s) for success.
- `currentState`: The starting point or background.
- `references`: Relevant company docs, repo paths, and links.

### 2. Spec (`spec.schema.ts`)
Created by the **PM** agent.
Defines the requirements and user journey.
- `problemStatement` & `targetUser`: Who this is for and why.
- `userJourney`: Step-by-step user experience.
- `functionalRequirements` & `nonFunctionalRequirements`: Prioritized list of requirements (`must`, `should`, `could`).
- `openQuestions`: Any questions needing clarification from other roles.
- `acceptanceCriteria`: Specific criteria that must be met to pass QA.
- `milestones`: Logical groupings of work with definitions of done.

### 3. Build Plan (`build_plan.schema.ts`)
Created by the **PM** or **Eng** agent.
Defines the execution strategy.
- `implementationMilestones`: Maps to spec milestones, detailing scope and release criteria.
- `riskList`: Identified risks and mitigation strategies.

### 4. Design (`design.schema.ts`)
Created by the **Design** agent.
Defines UI/UX behavior.
- `uxGoals` & `informationArchitecture`: High-level structural goals.
- `flows`: Step-by-step UX flows with edge cases.
- `copy`: Content keys and tone notes.
- `interactionRules`: Specific interactive behaviors.
- `states`: Expected surface states (e.g., WhatsApp loading/success/error/partial states).
- `designDecisions` & `handoffNotesForEng`: Tradeoffs made and specific instructions for engineering.

### 5. Implementation (`implementation.schema.ts`)
Created by the **Eng** agent.
Defines the actual technical changes.
- `changedAreas`: Which files were modified and why.
- `commandsToRun`: Scripts/commands executed during the build.
- `featureFlags`: Any toggles introduced.
- `testingNotes`: How the engineer verified the changes.
- `mapsToRequirements`: Explicit links tracing code changes back to spec requirements.
- `knownLimitations`: Explicit callouts of what wasn't addressed.

### 6. QA Plan & Report (`qa_plan.schema.ts`, `qa_report.schema.ts`)
Created by the **QA** agent.
Defines the testing strategy and results.
- **QA Plan:** `testMatrix` mapping test cases to Acceptance Criteria, plus `riskBasedTests`.
- **QA Report:** Validation `results` (pass/fail/blocked), identified `regressions`, required fixes for Eng, and the final `shipRecommendation` (ship / ship with known issues / do not ship).

### 7. Open Question (`open_question.schema.ts`)
Used dynamically when an agent gets blocked.
- Defines the `fromRole`, `toRole`, the `question`, `context`, and optional `suggestedOptions` for how to proceed.

## Common Types (`common.ts`)
Shared types standardizing IDs, priorities (`P0`, `P1`, `must`, `should`), and system constants (`AgentRole`, `ToolName`, `ArtifactStatus`).
