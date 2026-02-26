# Disaster Drill Procedures (Milestone 6)

## Simulation 1: Local DB Corruption
1. **Trigger:** `rm runs/system.sqlite` during an active subagent task.
2. **Detection:** Scheduler attempts to record progress and throws SQLite error.
3. **Mitigation/Recovery:** 
   - Observe crash.
   - Run `./scripts/restore.sh` to recover from the latest timestamped backup.
   - Run system back up with `dev:runner`. Subagents should resume from last complete Checkpoint.

## Simulation 2: Master Orchestrator Crash
1. **Trigger:** Manually `kill -9` the NodeJS process while a "design" artifact generation is inflight.
2. **Detection:** No further webhooks reach WhatsApp.
3. **Mitigation/Recovery:**
   - Restart server.
   - `ResumeEngine` is invoked on startup, scanning for 'active' Runs with no active PIDs.
   - Engine automatically enqueues the run again from the last saved `snapshot_pointer`.
