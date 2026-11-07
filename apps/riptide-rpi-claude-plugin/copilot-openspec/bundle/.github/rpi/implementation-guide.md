# Phase implementation and debugging guide

Read [the workflow contract](./workflow.md). The coordinator supplies the resolved change/plan paths, approved scope digest, phase/task IDs, and code baseline. This guide does not grant approval or permission to expand scope.

## Before editing

Read the assigned phase completely, relevant specs/design/research, repository instructions, and the source/test files needed to understand the change. Read relevant files in full when partial context would hide callers, contracts, or side effects. Inspect the existing worktree and preserve unrelated work. Follow the plan's concrete sketches and existing code/test patterns; implement the phase's tests with its code.

The worker returns proposed task completion and actual check evidence. The coordinator owns `tasks.md`, `approvals.md`, and `verification.md`. On resume, compare recorded completion with the current code and checks rather than blindly trusting checkboxes or redoing verified work.

## Bounded defect investigation

When a check fails or reported behavior does not match the approved scope:

1. **Reproduce and capture evidence.** Run the relevant documented check and retain the complete failure output. Identify the failing scenario/task, expected result, observed result, and code revision. Do not filter away failures or label an unavailable check as passing.
2. **Trace the cause.** Read the implicated code, tests, configuration, and available local logs. Use documented read-only database/service diagnostics when relevant and authorized. Distinguish an implementation defect from an environment/setup problem, stale test expectation, or plan/code mismatch.
3. **Ask for missing evidence.** If reproduction needs user-only logs, credentials, UI interaction, or service state, ask the coordinator for the specific missing evidence and reproduction steps. Never request secrets in chat or mutate production data to diagnose a problem.
4. **Repair within the approved scope.** Make the smallest justified correction and add/update regression coverage. Rerun the failed check and affected related checks. If multiple material approaches exist, requirements change, or the plan/specs no longer match reality, stop and return the decision needed instead of silently redesigning.
5. **Report persistent failures.** If the cause or fix remains unresolved, return the attempts, full evidence references, remaining hypotheses, and blocked task IDs. Do not mark the phase complete or continue to another phase.

Diagnostic source edits such as temporary logging must be within the assigned scope, removed before completion unless intentionally approved as part of the change, and covered by renewed checks. Do not use debugging as permission for unrelated refactors.

The coordinator reviews the diff, obtains any checks the worker could not run, records real outcomes, and stops for human acceptance and explicit continuation. Workers do not delegate further, edit approval/task records, commit, push, switch branches, or archive.
