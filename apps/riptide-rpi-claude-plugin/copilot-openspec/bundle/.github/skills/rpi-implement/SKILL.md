---
name: rpi-implement
description: Implement one approved RPI phase, verify it, and stop for human review.
argument-hint: <change-name> [phase-number]
disable-model-invocation: true
---

# Phased implementation

Read [the workflow contract](../../rpi/workflow.md), [artifact procedure](../../rpi/artifact-procedure.md), and [record formats](../../rpi/records.md). A skill does not switch agents; stop and ask for the designated agent if the wrong role is selected.

1. Use rpi-implementer. Require an explicit change name. Inspect repository
   instructions and the existing worktree diff; preserve unrelated user changes.
2. Run `openspec status --change <change-name> --json` and
   `openspec instructions apply --change <change-name> --json`.
   Require schema rpi and the intended repo-local root. Stop on command failure,
   invalid JSON, blocked state, or unresolved warnings affecting readiness.
   Consume current project context and applicable operation guidance. Read the
   returned contextFiles needed for implementation, excluding research-questions.
3. Run `node .github/rpi/snapshot.mjs "<resolved-change-directory>"` and check readiness separately. Read approvals.md and require actual approval of the current design/plan/tasks
   scope digest and explicit authorization of the selected phase(s). Progress-only N.Y checkbox edits retain scope; changes to task text or other planning inputs require renewed approval. Ask if approval is absent or stale. Resolve material contradictions
   between the specs, design, plan, and code before editing anything.
4. Select only the requested phase, or the first pending phase when prior phase
   acceptance and explicit continuation are recorded for the checked code. Match task IDs N.Y to Phase N in plan.md. If apply says
   all_done, report remaining verification/acceptance instead of inventing tasks.
5. Delegate to implementer-agent using Copilot's native delegation. Supply the
   resolved change/plan paths, phase number, task IDs, approved scope digest, code comparison baseline, and boundaries. For an explicitly authorized bounded phase sequence, use a separate worker and automated checks per phase and pause after that sequence; stop earlier on any failure.
   Request that phase only and actual automated check results. If the worker
   is unavailable, stop and explain; do not silently run an unbounded apply.
6. Inspect the worker's diff against scope and specs. Run required checks not
   already evidenced. Mark a task complete only after its work and stated
   verification succeed. A failed or unavailable check stays unresolved.
7. Update tasks.md and verification.md with the actual result. Report changed
   files, checks passed/failed/not run, deviations, and relevant manual checks.
   Keep human acceptance pending until the user confirms it.
8. Stop. Do not proceed to the next phase, commit, push, change branches, or
   archive without explicit instruction. Even if all task boxes are checked,
   do not claim final acceptance. For reported defects, repair the current
   scope and rerun affected checks; changed requirements go back to planning.
