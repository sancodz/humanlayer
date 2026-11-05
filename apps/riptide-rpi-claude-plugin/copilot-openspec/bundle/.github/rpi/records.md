# Change-local records

These auxiliary records are not OpenSpec planning artifacts and are not an authorization system. Use the resolved change directory. Create a record only when the corresponding information exists; do not initialize records with fictitious approvals, timestamps, or passing checks. Keep useful history and mark superseded entries explicitly.

## `request.md`

Intake records the user's request without inventing scope. The planner may read it; the objective researcher may not.

```markdown
# Request

## User request

[Actual request or a faithful summary clearly identified as such.]

## Context pointers

[Exact supplied URLs, repository names, file paths, and package names.]

## Clarifications

[Actual answers and unresolved intake questions; do not assume answers.]
```

## `approvals.md`

An approval entry needs actual user feedback and the artifact scope it covers. A task progress checkbox is not an approval. Ask the user to review the artifacts before recording approval of their current scope.

Run `node .github/rpi/snapshot.mjs "<resolved-change-directory>"` and record its `scopeDigest`. Keep its file-digest list available for comparison. The helper ignores progress markers in numbered `N.Y` task checkboxes and excludes approvals/verification; it does not ignore changes to the task description, phase order, plan, specs, or inputs. Required inputs/readiness must still be checked with OpenSpec.

```markdown
# Approvals

## [Actual decision or planning-approval identifier]

- Kind: [design decision / planning approval / phase acceptance / continuation]
- Recorded at: [Actual ISO timestamp with timezone]
- User evidence: [Exact user statement or a link to the actual review]
- Scope digest: [Actual snapshot digest, never a placeholder in a real approval]
- Scope: [Decision ID or design/plan/tasks and authorized phase numbers]
- Code evidence: [For phase acceptance: reviewed commit plus worktree/diff evidence]
- Manual checks: [Actual confirmed results, not required, or pending]
- Continuation authorized: [Exact phase or bounded phase range, or none]
- Status: [Current or superseded; say why when superseded]
```

A design decision is not approval of the whole plan. Passing automated checks is not human acceptance. “Looks good” applies to the artifact actually reviewed, not future tasks/code the user has not seen. If a task description, input, spec, design, or plan changes, compare scope and seek renewed approval. Progress-only checkbox edits retain the planning digest. Code changes invalidate affected phase acceptance and verification independently of that digest.

## `verification.md`

Record results after checks actually run. For an automated command, include the exact command, working directory, exit code, and evidence/log reference or concise observed outcome. A check not run has no successful exit code. Do not claim `verified` if required evidence is missing.

```markdown
# Verification

## Phase [N] / final verification

- Outcome: [verified / failed / blocked/not run]
- Recorded at: [Actual ISO timestamp with timezone]
- Planning scope digest: [Actual snapshot digest]
- Code evidence: [Commit and staged/unstaged/untracked diff scope actually checked]
- Worktree baseline: [How unrelated pre-existing changes were distinguished]

### Automated checks

| Command | Working directory | Exit code | Result / evidence |
| --- | --- | --- | --- |
| [Actual command] | [Actual directory] | [Actual code, or not run] | [Observed result and limitations] |

### Requirement and plan coverage

| Capability / requirement / scenario or plan task | Test or human check | Evidence | Status |
| --- | --- | --- | --- |
| [Exact scenario/task] | [Actual check] | [Actual result] | [verified / failed / blocked/not run] |

### Plan deviations

[Fresh review: implemented as planned; deviations; additions; planned but absent.]

### Human acceptance

[Pending until the user confirms this code revision. Reference the actual approval entry after confirmation.]

### Open items

[Failures, missing evidence, relevant manual checks, and decisions still needed, or None.]
```

Use testable scenarios as the coverage checklist. For a deliberate spec skip, state the no-behavior-change scope and check the plan and diff instead. Repeat affected checks after repairs, record the new code evidence, and retain earlier failures as history rather than relabeling them as passes. Final archive is a separate user-requested action, not a test result.
