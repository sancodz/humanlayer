# Planning detail guide

Read [the workflow contract](./workflow.md) and the current OpenSpec plan instructions/template. This guide applies to `/rpi-plan`; it does not authorize implementation or replace user decisions.

## Derive the outline inside the plan

There is **no separate structure-outline artifact or prerequisite** in this schema. After material design choices are resolved, derive a compact vertical-phase outline inside `plan.md`, then expand every phase in that same plan artifact. Use the outline to review ordering and coverage before writing tasks in a later invocation.

Prefer thin end-to-end slices that can be verified without a later phase. Adapt to the actual work; do not force unrelated layers into a slice.

- Horizontal silos: build all database tables → build every API endpoint → build the UI → add tests.
- Vertical slices: create the simplest item end-to-end with tests → edit one field end-to-end with tests → expose the first validation error end-to-end with tests.

Each phase needs a concrete outcome, its required code/contracts/tests/docs, executable checks, relevant human checks, and a stop condition. Phase N must not depend on unimplemented Phase N+1 for verification.

## Concrete changes are required

For **every material code or contract change**, include:

1. The exact file path and whether it is created, modified, or removed; identify the relevant symbol/component or a stable nearby anchor (and current line range when useful).
2. A **concrete code/contract sketch**: focused diff, signature/type change, data shape, schema/config keys, or precise pseudocode showing the intended transformation. Show enough surrounding context to locate and understand the change.
3. The behavior being introduced, important error/edge cases, compatibility constraints, and the existing pattern to follow with a source reference.

A list such as “update the service logic” or “wire up the UI” is not a detailed plan. Signatures and file trees are useful scaffolding, but material logic needs implementation-level detail. Full function bodies and exhaustive file dumps are not required. If the exact shape cannot be determined, resolve the factual gap or return the material choice to design; do not hide uncertainty in vague prose.

For a pure documentation/tooling change, show the actual sections, configuration, commands, or tool behavior affected instead of inventing application code.

## Tests and verification belong to each slice

For each phase, name the new or changed test files and follow the testing patterns found in research. Include **concrete test cases or skeletons** with the relevant setup/fixture, action, and expected assertion/result. Cover the affected spec scenarios and important regressions; explain any scenario that needs a manual check instead. Deliver tests with the slice, not in a final catch-all phase.

For every automated check, record the exact command, working directory, required services/setup, and expected evidence. Verify commands against repository instructions. Prefer automation over unnecessary manual work. Include manual actions and expected outcomes only where human judgment is genuinely needed, and always stop for acceptance/continuation according to the workflow.

## Keep plan and tasks aligned

`plan.md` owns the reasoning, sketches, test detail, and verification design. `tasks.md` is the sole implementation checkbox ledger: derive unique `N.Y` tasks from the reviewed plan without adding scope. A phase outline is not another completion ledger.

On feedback, follow the [revision checklist](./artifact-procedure.md#revision-checklist). Update affected sketches, test cases, commands, phase ordering, and downstream tasks together; verify changed source claims. A requested plan edit is not permission to code, and a changed scope needs renewed approval.
