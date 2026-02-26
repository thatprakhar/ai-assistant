# Performance & Security Sanity (Milestone 6)

## I3: Performance Sanity
- [ ] Ensure SQLite WAL mode is active for higher write concurrency without locking the DB.
- [ ] Measure token limits in Context Retriever (`truncateOrSummarize`). Prevent API exhaustion by trimming context packs rigorously.
- [ ] Ensure Long Jobs do not block the Fastify event loop. Scheduler MUST spawn async tasks off the main thread or out-of-process.

## I4: Security Sanity
- [ ] **Webhook Authentication:** Fastify `POST /webhook` MUST validate the `X-Hub-Signature-256` HMAC via `crypto.timingSafeEqual` over the raw payload buffers.
- [ ] **Agent Sandboxing:** Tools must strictly enforce `PermissionManager.isAllowed(role, tool)`. A PM agent must NEVER have write access to the filesystem outside of artifacts or trigger `bash`.
- [ ] **Data Residency:** All memory is local. Check `./runs/` and `company-memory/`. No data should be stored in third-party services outside of the requested LLM endpoints.
