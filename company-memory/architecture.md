# AI Company Architecture

This document serves as the high-level memory of the architecture of the AI Company execution engine.

For foundational principles and overarching design, see `./SYSTEM_OVERVIEW.md` and `./Engineering-Design.txt`.

## Agent Contracts

The system enforces strict structural determinism. All communications between agents (Founder, PM, Design, Eng, QA) are facilitated entirely through structured Zod schema artifacts. Free-form text communication is prohibited between agents.

The detailed, human-readable documentation for all schemas is maintained alongside the code. 
**Please refer to `src/contracts/README.md` for the comprehensive Contract Documentation.**

### Contract Workflow Summary
1. **Founder** creates `Context` (objective, constraints, success criteria).
2. **PM** creates `Spec` (requirements, journey, acceptance criteria) and `Build Plan` (milestones, risks).
3. **Design** translates spec into `Design` (flows, states, copy, IA).
4. **Eng** executes the build plan and generates `Implementation` (changed files, commands, requirement mapping).
5. **QA** generates `QA Plan` (test matrix) and `QA Report` (test results, ship recommendation).
