# Implementation plan: [Change]

## Overview and scope

[What the approved design accomplishes, what is excluded, and the relevant specs/research/design references. Stop if material design questions remain open.]

## Current state and patterns

[Relevant source/test references, existing conventions, and verified constraints.]

## Desired result

[Observable acceptance criteria, tied to specs or the explicit no-behavior-change scope.]

## Phase overview

- Phase 1: [Smallest independently verifiable end-to-end outcome.]
- Phase 2: [Next independently verifiable outcome.]

<!-- Derive this compact outline inside plan.md, then expand every phase below; no separate structure-outline artifact is required. Use as many phases as the change needs. Keep phases vertical and independently verifiable without a later phase. No duplicate implementation checkboxes here; tasks.md is the execution ledger. -->

## Phase 1: [Outcome]

### Result

[One concrete result this phase makes possible without depending on a later phase.]

### Concrete changes

[For every material code/contract change: exact file path and create/modify/remove action, relevant symbol or stable anchor, and a required concrete code/contract sketch—focused diff, signature/type/data/schema/config change, or precise pseudocode. Show enough context, behavior/error/edge cases, compatibility constraints, and the existing pattern with a source reference. “Update the logic” is incomplete; full function bodies/file dumps are not required. For docs/tooling-only work, show the actual affected sections/configuration/commands.]

### Test detail

[Name new/changed test files and provide concrete test cases or skeletons following existing patterns: setup/fixture, action, expected assertion/result. Map affected spec scenarios and important regressions; explain any manual-only coverage. Include tests and needed docs with this slice, not a later catch-all phase.]

### Automated verification

[Exact executable commands, working directories, required services/setup, and expected evidence. Use repository instructions; do not guess commands. Prefer automatable checks over unnecessary manual work.]

### Human verification and stop condition

[Only relevant manual actions and expected results, or state that none are required. After automated checks, report the result and stop for user acceptance and explicit continuation even if no manual test is needed.]

## Phase 2: [Outcome]

### Result

[Next vertical outcome.]

### Concrete changes

[Repeat the required file-level code/contract sketches and existing-pattern references for every material change in this phase.]

### Test detail

[Concrete test files and cases/skeletons for this slice, mapped to scenarios and regressions.]

### Automated verification

[Actual commands and evidence for this phase; no dependency on an unimplemented later phase.]

### Human verification and stop condition

[Relevant manual checks, or none; stop for acceptance and continuation.]

## Risks, migration, and rollback

[Only applicable implementation-level safeguards.]

## Approval required before implementation

Review the completed design/plan/tasks scope with the user. Record real approval and authorized phases in approvals.md with the scope digest. This plan's existence is not approval. Changes to scope require renewed review; code changes also invalidate affected verification and phase acceptance.
