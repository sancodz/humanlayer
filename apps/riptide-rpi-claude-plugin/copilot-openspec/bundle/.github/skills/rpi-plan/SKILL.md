---
name: rpi-plan
description: Create or explicitly revise one detailed vertical-phase plan or its derived task ledger without coding.
argument-hint: "<change-name> [plan|tasks]"
disable-model-invocation: true
---

# Detailed phased planning

Read [the workflow contract](../../rpi/workflow.md), [artifact procedure](../../rpi/artifact-procedure.md), and [record formats](../../rpi/records.md). Select **rpi-planner** before invoking this skill.

1. Require one explicit change name. This skill writes only `plan` or `tasks`, one per invocation. Honor the selected artifact, otherwise choose its first missing, ready artifact in schema order. Existing output needs explicit revision feedback. Do not overwrite a plan or generate tasks just because a plan file exists without review.
2. Use the shared artifact procedure and current CLI instructions. Require schema rpi, the intended repo-local root, and satisfied dependencies. Read completed research, request, proposal/specs (unless skipped), design, and relevant source/test files; do not reread research questions. Follow repository instructions for actual commands and service-test setup.
3. Check design questions and actual user decisions. If a question could change requirements, architecture, or task breakdown, stop and resolve it with the user. Do not silently select the recommended option. Non-material deferrals need explicit rationale. Stop on contradictions between specs, design, plan, and code; reconcile them before writing.
4. For **plan**, incorporate the structural outline into independently verifiable **vertical phases**. Each Phase N has a concrete outcome, affected files and code/contracts, existing patterns to follow, tests delivered with that phase, runnable automated checks, relevant manual checks, and a stop/acceptance condition. A phase must not require a later phase before its own verification can work. Avoid database/API/UI/test horizontal silos. Include risks/migration/rollback only where applicable and clear non-goals.
5. For **tasks**, derive only the reviewed plan's work. Group checkboxes under numbered phase headings and use unique `N.Y` IDs matching Phase N. Each `- [ ] N.Y` task states concrete work and how completion is checked. Include each phase's tests/docs when needed, not a final testing catch-all. Do not add unplanned scope, duplicate phase-completion boxes, approval checkboxes, or a tracked archive task. tasks.md is the sole implementation checkbox ledger.
6. Use the returned schema template, with real paths and executable checks, not placeholders. Run strict spec validation when applicable; it does not validate plan quality or approvals. On feedback, edit the owning artifact, verify changed claims, and identify downstream artifacts and approvals needing renewed review. Never interpret planning feedback as permission to implement.
7. After tasks and design/plan are reviewable, ask the user to approve the **current complete scope** and explicitly authorize the phase(s) to implement. Record the actual statement and scope digest only after that feedback, using the snapshot helper and record format. Do not approve tasks the user has not seen or include future content in a prior approval.
8. Report the output path, phase outline, unresolved items, and required review. Stop; do not generate the other artifact automatically, change source, mark implementation done, commit, or start implementation.
