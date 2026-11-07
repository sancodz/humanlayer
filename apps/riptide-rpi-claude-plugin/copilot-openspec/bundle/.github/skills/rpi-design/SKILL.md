---
name: rpi-design
description: Create or explicitly revise one RPI proposal, capability specification, or design discussion for user review.
argument-hint: "<change-name> [proposal|specs|design]"
disable-model-invocation: true
---

# Design and specifications

Read [the workflow contract](../../rpi/workflow.md), [artifact procedure](../../rpi/artifact-procedure.md), and [record formats](../../rpi/records.md). Select **rpi-planner** before invoking this skill; a skill does not switch agents.

1. Require one explicit change name. This skill may write only `proposal`, `specs`, or `design`, one artifact per invocation. Honor an explicit selection; otherwise select the first missing, ready artifact in that set in schema order. If all exist, report that and ask which one to revise. An existing artifact requires explicit revision feedback, not an automatic rewrite.
2. Follow the shared artifact procedure, including successful current status/instructions, schema rpi, dependency checks, and the intended repo-local root. If specs are explicitly skipped for a no-behavior-change change, report the skip and stop that invocation; do not fabricate a delta or silently start design.
3. Read completed research, request.md, relevant existing capability specs, and completed proposal/spec/design artifacts as needed. Exclude research questions. Confirm material factual gaps with the user or a focused descriptive research worker; do not assume an unknown constraint is harmless. Review research before turning its observations into design assumptions.
4. For **proposal**, define Why, What Changes, Capabilities (new/modified), and Impact. Inventory existing capabilities with `openspec list --specs`, then read relevant specs fully before selecting exact capability paths. Separate user-visible goals from internal implementation. Do not invent behavioral changes for pure docs/tooling/refactoring work; when eligible, explain `skip_specs: true` and obtain the user's deliberate scope decision before editing change metadata.
5. For **specs**, create the capability deltas named in proposal using the schema's spec template and exact paths. Reuse existing capability names. Each requirement describes observable behavior with SHALL/MUST and at least one four-hash Scenario with WHEN/THEN. Include complete updated blocks for MODIFIED requirements, reasons/migration for removals, and a meaningful Purpose for new capabilities. Write files one at a time; only revise existing deltas when explicitly requested. Run strict change validation and report/repair format failures. This is one logical specs artifact even when it has several files.
6. For **design**, explain current versus target architecture, goals/non-goals, contracts/data shapes, testing approach, risks, and migration/rollback when relevant. Present options and trade-offs for every material choice. All initial questions remain **open**; a recommendation is not a decision. Use focused diagrams or diffs only where they help the user choose.
7. When the user actually resolves a design question, record the accepted option, rationale, and rejected alternatives. Only genuine non-material unknowns may be explicitly deferred; do not treat a skipped material question as resolved. Record actual decisions/approval in approvals.md only when supported by user feedback; never approve a new artifact on the user's behalf.
8. Finish the shared artifact procedure and revision checklist: address each feedback item, revise the owning document in place, keep newly surfaced material questions open, identify affected downstream review/stale approvals, and return output paths, open questions, and the review needed. Do not start another artifact, create a plan, implement code, or infer approval from existence/status.
