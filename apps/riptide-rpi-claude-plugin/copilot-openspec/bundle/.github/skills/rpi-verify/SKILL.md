---
name: rpi-verify
description: Verify an RPI change against specs, plan, actual checks, and human acceptance without implementing or archiving.
argument-hint: "<change-name>"
disable-model-invocation: true
---

# Final verification

Read [the workflow contract](../../rpi/workflow.md) and [record formats](../../rpi/records.md). Select **rpi-implementer** before invoking this skill. Verification is not authorization to edit application source.

1. Require one explicit change name. Run `openspec status --change <change-name> --json` and `openspec instructions apply --change <change-name> --json`. Require successful valid JSON, schema rpi, the intended repo-local root, and consistent change paths. On lookup failure, stop without creating a phantom change/report.
2. Consume current project context, applicable operation guidance, contextFiles, task progress, and warnings. Read research, proposal, specs (unless explicitly skipped), design, plan, tasks, approvals.md, and previous verification.md; exclude research questions. Missing prerequisites, unresolved material decisions, stale planning approval, or pending tasks prevent final verification from being called complete. You may document a blocked result without inventing approval or starting implementation.
3. Run the planning snapshot helper, compare the approved scope, and distinguish current code from the code covered by earlier checks/acceptance. Obtain an agreed comparison baseline; ask if it is unknown. Inspect all relevant committed changes plus staged, unstaged, and untracked files, preserving unrelated user work. A HEAD SHA or committed-only diff is not a complete worktree snapshot.
4. Invoke a **fresh implementation-reviewer** with the resolved artifact paths, complete relevant diff, baseline, and code revision evidence. Ask for implemented-as-planned, deviations, additions, planned-but-absent, and evidence gaps. This worker is read/search-only: supply the diff and do not claim it ran checks. If required review is unavailable, record that limitation as blocked rather than silently treating self-review as equivalent.
5. Map every affected capability/requirement/scenario to actual automated or user-confirmed manual evidence. Check each plan phase/task too. For a deliberate spec skip, verify the no-behavior-change scope against plan and diff instead of inventing scenarios. Missing test coverage or unsupported claims are gaps, not passes; check correctness conclusions yourself rather than treating a factual deviation review as proof.
6. Run required checks not already evidenced against this code, using repository-documented commands and setup. Run `openspec validate <change-name> --type change --strict --no-interactive` too. Record exact commands, working directories, exit codes, results, and checks not run. Do not truncate/filter away test failures. Failed checks yield **failed**; missing prerequisites, unavailable checks, or pending required manual evidence yield **blocked/not run**.
7. Write verification.md using the shared format and actual scope/code evidence. Keep required human acceptance pending until the user confirms the checked revision, then record the genuine response in approvals.md. Report **verified** only when required checks and coverage are evidenced, deviations reconciled, and required human acceptance actually exists. A planning digest, all_done, or a test pass cannot supply that acceptance.
8. Report the outcome, report path, failures/gaps, deviations, and remaining user actions. Do not repair code, silently rewrite plans/specs, change task scope, commit, push, sync specs, or archive. Repairs go through the owning planning/implementation stage; archive is a separate explicit user request using the installed official workflow.
