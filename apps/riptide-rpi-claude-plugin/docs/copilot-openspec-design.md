# Core RPI for VS Code GitHub Copilot and OpenSpec

**Status:** Design proposal with representative, copyable files. This document does not install agents, skills, or OpenSpec configuration in this repository. The examples are not a complete starter kit: the remaining agents, skills, and artifact templates still need to be authored.

**Scope:** Research questions → objective research → design/specifications → phased plan → implementation and verification. Separate PRD/TDD workflows, worktree automation, commits, and PR creation are out of scope.

**Compatibility baseline:** OpenSpec **1.16.0** and the VS Code customization documentation reviewed on **2026-11-06**. The examples target the **Copilot harness in VS Code**, not the GitHub-hosted cloud coding agent. Validate discovery, tool availability, and delegation in the VS Code version you actually use before adopting them.

## 1. Recommended architecture

Port the workflow's contracts, not its Claude-specific tool calls.

| Layer | Responsibility | Proposed location |
| --- | --- | --- |
| OpenSpec schema | Artifact names, dependencies, templates, and task tracking | `openspec/schemas/rpi/` |
| Copilot custom agents | Persistent roles and available tools | `.github/agents/*.agent.md` |
| Copilot skills | Explicitly invoked procedures for each stage | `.github/skills/rpi-*/SKILL.md` |
| Change-local records | Inputs, artifacts, verification evidence, and human decisions | `openspec/changes/<change>/` |
| Project instructions | Repository conventions and supported validation commands | Existing project instructions and `openspec/config.yaml` |

**Agents answer “who does this, with which tools?” Skills answer “what procedure should that agent follow?” OpenSpec answers “which artifacts exist and what depends on them?”**

A skill does not automatically switch agents or create a permission boundary. Select the matching custom agent before invoking a stage skill. Keep the schema as the single source for artifact templates; skills should request its instructions instead of embedding another copy.

### Proposed flow

```text
request.md (input from the user; excluded from objective research)
    │
    ▼
research-questions.md → research.md → proposal.md → specs/<capability>/spec.md
                                                      │
                                                      ▼
                                                  design.md
                                                      │
                                            user resolves decisions
                                                      │
                                                      ▼
                                                  plan.md → tasks.md
                                                               │
                                                      user approves plan
                                                               │
                                                               ▼
                       implement ONE phase → checks → human review → repeat
                                                               │
                                                               ▼
                                final verification → explicit archive request
```

The artifact chain ends at `tasks.md`. Implementation is OpenSpec's **apply operation**, not a generated artifact. `verification.md` and `approvals.md` are runtime records, not planning prerequisites. Do not add `requires: [apply]` to an artifact: `apply` is not an artifact ID.

A proposal is intentionally written **after** research. The original request supplies intent, while research supplies facts. The design stage brings those inputs together without making research advocate for a predetermined solution.

## 2. Source-to-target mapping

The source has two parts:

- [RPI skills](../skills/) define the main-session workflows.
- [Bundled agent registration](../../riptide-daemon/src/agents/claudecode/bundled-agents.ts) and its [agent definitions](../../riptide-daemon/src/agents/claudecode/agents/) define the workers. Copying only the plugin's skills would miss these agents.

The source revision reviewed is `f9bd73534a9fb7099a274f951b698b1297122fd9`. See also [how HumanLayer workflow phases fit together](../../docs/explanation/workflow-phases.md).

| HumanLayer source | Copilot procedure | OpenSpec output / behavior |
| --- | --- | --- |
| `create-research-questions`, `iterate-research-questions` | `/rpi-questions` | Create or revise `research-questions.md`; preserve exact context pointers; investigate existing behavior only |
| `create-research`, `iterate-research` | `/rpi-research` | Create or revise `research.md`; objective findings, source citations, testing patterns, and genuine unknowns |
| `create-design-discussion`, `iterate-design-discussion` | `/rpi-design` | Write `proposal`, then `specs`, then `design`, one stage per invocation; keep design choices open until the user decides |
| `create-structure-outline` + `create-plan`, and their iteration variants | `/rpi-plan` | Fold the outline into `plan.md` as vertical phases, then derive `tasks.md` in a subsequent invocation |
| `implement-plan`, `iterate-implementation` | `/rpi-implement` | Delegate one approved phase, run checks, record evidence, and pause for review |
| Phase checks in `implement-plan`; deviation analysis in `implementation-reviewer` | `/rpi-verify` | Compare implementation with specs and plan; record actual check results and outstanding manual checks |
| HumanLayer cloud artifact links | Ordinary workspace paths / Markdown links | No dependency on cloud hooks or `.humanlayer/tasks` symlinks |
| Claude `Agent` / `Task` calls | Copilot native delegation | Use the selected runtime's tool; do not paste Claude call syntax into Copilot instructions |

`/rpi-verify` is an **adaptation**, not an existing plugin skill with the same name. The source implementation reviewer reports plan deviations for PR descriptions; final verification additionally checks requirement coverage and validation evidence.

Creation and iteration can share a skill. If the output already exists, require an explicit revision request. Revise the owning document in place and identify downstream artifacts that need review; never silently start implementation in response to planning feedback.

### Proposed agent roster

Use these exact names consistently in agent frontmatter and delegation instructions. Omit `model` initially so the user's selected model can be used rather than porting Claude's `sonnet`/`haiku` aliases.

| Agent | Role | Suggested tool aliases |
| --- | --- | --- |
| `rpi-intake` | Capture the request, create the change, and draft descriptive research questions | `read`, `search`, `edit`, `execute` |
| `rpi-researcher` | Coordinate research workers and write the factual synthesis | `read`, `search`, `edit`, `execute`, `agent` |
| `rpi-planner` | Draft proposal/specs/design, resolve user feedback, and produce plan/tasks | `read`, `search`, `edit`, `execute`, `agent` |
| `rpi-implementer` | Coordinate one implementation phase, checks, records, and final verification | `read`, `search`, `edit`, `execute`, `agent` |
| `codebase-locator` | Find source, configuration, and test locations; return a categorized map | `read`, `search` |
| `codebase-analyzer` | Trace current behavior and data flow with file/line evidence | `read`, `search` |
| `codebase-pattern-finder` | Show existing analogous implementations and testing conventions | `read`, `search` |
| `web-search-researcher` | Investigate version-matched official documentation; return source URLs and limitations | `read`, `search`, `web` |
| `implementer-agent` | Implement exactly one designated phase and report real validation results | `read`, `search`, `edit`, `execute` |
| `implementation-reviewer` | Compare the supplied changes with the plan; report deviations without editing | `read`, `search` |

The last six roles correspond to the source's workers, with narrower tools where practical. The four coordinators make roles that were implicit in HumanLayer's main-session skills explicit in Copilot. `outline-implementer-agent` is omitted because the core path always produces a detailed plan.

Keep workers hidden from the picker with `user-invocable: false`, but available for model delegation with `disable-model-invocation: false`. Workers do not need delegation tools themselves.

Read/search-only workers cannot run commands or edit through their listed tools. Coordinators and implementers with `edit` or `execute` are **not** filesystem-sandboxed to certain paths. “Only write research.md” is a behavioral instruction, not an enforced access rule. Keep normal tool approvals enabled and inspect the diff.

## 3. Proposed artifact contracts

```text
.github/
├── agents/                         # The ten roles listed above
└── skills/
    ├── rpi-questions/SKILL.md
    ├── rpi-research/SKILL.md
    ├── rpi-design/SKILL.md
    ├── rpi-plan/SKILL.md
    ├── rpi-implement/SKILL.md
    └── rpi-verify/SKILL.md
openspec/
├── config.yaml
├── schemas/rpi/
│   ├── schema.yaml
│   └── templates/                  # Seven templates listed below
└── changes/<change>/
    ├── .openspec.yaml              # Created by OpenSpec, not hand-invented metadata
    ├── request.md                  # Auxiliary user input
    ├── research-questions.md
    ├── research.md
    ├── proposal.md
    ├── specs/<capability>/spec.md
    ├── design.md
    ├── plan.md
    ├── tasks.md
    ├── approvals.md                # Auxiliary record of actual user decisions
    └── verification.md             # Auxiliary record of actual checks
```

| Artifact ID | Template | Required content |
| --- | --- | --- |
| `research-questions` | `research-questions.md` | Usually 2–7 descriptive questions; exact links, paths, and dependency names from intake; UI/design-system questions when relevant |
| `research` | `research.md` | Commit/branch/date, current-state narrative, file/line evidence, data flow, existing tests and fixtures, unanswered factual questions; no change recommendations |
| `proposal` | `proposal.md` | Why, What Changes, Capabilities (new/modified), Impact; reconcile the request with research and existing capability specs |
| `specs` | `spec.md` | One delta per affected capability; normative observable behavior and testable scenarios, not implementation detail |
| `design` | `design.md` | Current/target architecture, goals/non-goals, alternatives, risks, open choices, and decisions explicitly made by the user |
| `plan` | `plan.md` | Vertical phases, concrete file/code changes, tests, runnable automated checks, relevant manual checks, and stop conditions |
| `tasks` | `tasks.md` | `N.Y` checkboxes grouped by plan phase; each task includes how it is verified |

`tasks.md` is the **only implementation checkbox ledger**. Keep detailed reasoning and examples in `plan.md`. Store manual acceptance separately so running a test never masquerades as human sign-off.

OpenSpec stores current capability specs under `openspec/specs/`; change-local `specs/` contains deltas. For changes with no spec-level behavior change, OpenSpec 1.16.0 supports `skip_specs: true` in change metadata. Use it deliberately for eligible docs/tooling/refactor changes; honor the returned `skipped` status rather than inventing a requirement just to satisfy validation.

### Context and approval boundaries

1. **Intake → research:** Start a new research chat with only the change name and research questions. Skills load inline by default; switching agents in the same conversation does not erase task intent already in context. Pass only descriptive questions and context pointers to research workers. Do not attach `request.md`, proposal, or design. Shared project instructions/config must also avoid embedding change-specific intent.
2. **Research → design:** Review factual findings and unresolved questions. The planner may now read the original request alongside the research and existing specs.
3. **Design → plan:** All material design questions remain open until the user resolves them. A recommendation is not approval.
4. **Plan → implementation:** Require explicit approval of the current design/plan/tasks revision. A request to edit the plan is not permission to code.
5. **Phase → next phase:** Run checks, report manual steps if relevant, and wait for explicit continuation. Even a phase with no manual test still needs continuation unless the user explicitly authorized a bounded set of phases.
6. **Verification → archive:** Confirm requirement coverage, test evidence, and human acceptance; archive only when explicitly requested.

Record actual decisions in `approvals.md`, including scope, date, and the artifact revision or digest approved. Record checks in `verification.md` with phase, code revision/diff scope, command, exit result, failures or skips, and manual status. Never fabricate a user decision, passing test, or approval timestamp. Changed artifacts make affected approvals stale; reconcile and reapprove before continuing. Changes to the code also invalidate affected verification evidence.

### What OpenSpec does and does not enforce

The schema tracks artifact **existence and dependencies**, and apply instructions parse task checkboxes. It does not prove research quality, resolve design questions, validate human approval, or invalidate downstream artifacts automatically when an input changes.

In OpenSpec 1.16.0, `status.isPlanningComplete` (and its compatibility alias `isComplete`) means the planning artifacts exist, **not that implementation is finished**. Inspect `instructions apply` for task progress, then inspect verification and approval records separately. `state: all_done` is still not human acceptance.

For an MVP, approval checks are prompt-level contracts plus human review. A later hardened version can add a hook/CI check tied to artifact digests and trusted approval evidence. A Markdown “approved” label alone is not an enforceable gate.

Do not copy HumanLayer's “latest plan wins” rule as permission to override behavioral specs. Research describes existing code; specs own intended behavior; approved design and plan refine implementation; tasks track execution. If those disagree, stop and reconcile the affected artifacts with the user.

## 4. Representative OpenSpec files

The following schema is structurally complete. Its referenced templates are specified above but are **not all provided** here; create them before installation. The agent and skill examples below are representative, not the entire roster.

### `openspec/config.yaml`

```yaml
schema: rpi
context: |
  Use the repository's documented coding conventions and validation commands.
  Project context describes the repository, not the current change request.
rules:
  research:
    - Describe existing behavior with source evidence; do not recommend changes.
  plan:
    - Make every phase independently verifiable and include its tests.
```

When adapting this to HumanLayer, validation commands come from the repository's instructions: `bun --bun run typecheck`, `bun --bun run quality`, and `bun run test`. Respect its service-test setup requirements; do not replace them with direct package test commands. Other projects should supply their own real commands.

### `openspec/schemas/rpi/schema.yaml`

```yaml
name: rpi
version: 1
description: Evidence-first research, reviewed planning, and phased implementation
artifacts:
  - id: research-questions
    generates: research-questions.md
    description: A descriptive investigation plan
    template: research-questions.md
    instruction: |
      Use intake to ask how the system works today, not how to change it.
      Preserve exact context pointers. Include existing testing patterns and,
      for frontend work, the design system. Do not embed proposed solutions.
    requires: []

  - id: research
    generates: research.md
    description: Evidence-backed documentation of the current system
    template: research.md
    instruction: |
      Read only the research questions as change-specific input.
      Document current behavior, data flow, tests, and factual unknowns.
      Verify citations against source. Do not read request.md or propose fixes.
    requires: [research-questions]

  - id: proposal
    generates: proposal.md
    description: Change intent and affected capabilities
    template: proposal.md
    instruction: |
      Combine the user request with research. Write Why, What Changes,
      Capabilities (new and modified), and Impact. Inspect existing specs
      before naming capabilities. Do not invent behavior to satisfy tooling.
    requires: [research]

  - id: specs
    generates: "specs/**/*.md"
    description: Capability-level behavioral delta specifications
    template: spec.md
    instruction: |
      Write a delta for each affected capability using ADDED, MODIFIED,
      REMOVED, or RENAMED Requirements sections as appropriate.
      Requirements use SHALL or MUST and have at least one scenario.
      Scenario headings use exactly four hashes and include WHEN and THEN.
      A MODIFIED requirement includes its complete updated requirement block.
      New capabilities include a meaningful Purpose section.
    requires: [proposal]

  - id: design
    generates: design.md
    description: Technical choices for user review
    template: design.md
    instruction: |
      Explain the target architecture, alternatives, risks, and testing approach.
      Keep material choices open until the user explicitly decides.
      Record accepted decisions and rationale without inventing approval.
    requires: [research, proposal, specs]

  - id: plan
    generates: plan.md
    description: A detailed, vertically phased implementation plan
    template: plan.md
    instruction: |
      Require user resolution of material design questions before planning.
      Include concrete files, changes, tests, and runnable checks per phase.
      Separate automated verification from human acceptance. Do not code.
    requires: [design]

  - id: tasks
    generates: tasks.md
    description: Trackable tasks grouped by implementation phase
    template: tasks.md
    instruction: |
      Derive numbered N.Y checkbox tasks from plan.md without adding scope.
      Include verification in each task. Keep phase numbers aligned with the
      plan. Human approvals belong in approvals.md, not inferred checkmarks.
    requires: [plan]

apply:
  requires: [research-questions, research, proposal, specs, design, plan, tasks]
  tracks: tasks.md
  instruction: |
    Require approval of the current design and plan before changing source.
    Implement only the selected phase and run its automated checks.
    Record actual results, leave human acceptance pending, and stop for review.
    Do not commit, push, switch branches, or archive without explicit instruction.
```

Explicitly requiring all planning artifacts at apply time avoids treating an accidentally pre-created `tasks.md` as sufficient readiness. These are still existence checks, not approval checks.

### Representative `tasks.md` template

```markdown
## 1. Phase 1: Smallest end-to-end result

- [ ] 1.1 Implement the first vertical slice; verify the specified behavior test passes.
- [ ] 1.2 Add this slice's regression coverage; verify the focused suite passes.

## 2. Phase 2: Next independently testable result

- [ ] 2.1 Extend the slice for the next behavior; verify its scenario test passes.
- [ ] 2.2 Run the phase's integration checks; record actual command results.
```

The real task descriptions name actual files and checks from the plan. There are no duplicate phase-completion checkboxes. A task marked done means its work and stated verification are complete; it does not authorize the next phase. Do not add archive as a tracked task, because final task completion is a prerequisite to normal archive.

## 5. Representative Copilot agents

Current VS Code distinguishes the Copilot and Local harnesses. For Copilot, use `target: github-copilot`, supported tool aliases, and native delegation. `target` controls file interpretation; it does not select the running harness. Local-only `agents` allowlists and `handoffs` are intentionally absent. A list of permitted worker names in an agent's body is a behavioral restriction, not a Copilot runtime allowlist.

### `.github/agents/rpi-researcher.agent.md`

````markdown
---
name: rpi-researcher
description: Coordinate objective codebase research and write an evidence-backed report.
target: github-copilot
tools: ['read', 'search', 'edit', 'execute', 'agent']
---

Work only on objective research explicitly requested through /rpi-research.
If this chat already contains the change request or design, ask the user to
start a fresh research chat with just the change name and research questions.

Use only codebase-locator, codebase-analyzer, codebase-pattern-finder, and,
when external documentation is needed, web-search-researcher as workers.
Use Copilot's native delegation tool, not Claude Agent/Task syntax or Local's
agent/runSubagent. Pass descriptive questions and source pointers, not task intent.
Await all workers and verify important claims in source before synthesizing.

Use execute only for necessary OpenSpec queries and read-only metadata commands.
Write only the selected research artifact; never change application source.
If a required worker or tool is unavailable, report that limitation and ask
whether to proceed with direct research rather than claiming delegation occurred.

Do not design, recommend refactors, implement, commit, or advance stages.
````

### `.github/agents/codebase-analyzer.agent.md`

````markdown
---
name: codebase-analyzer
description: Explain existing implementation and data flow with precise source references.
target: github-copilot
user-invocable: false
disable-model-invocation: false
tools: ['read', 'search']
---

You document how the current system works, not how it should change.
Read the supplied research question and relevant source and tests.
Do not read request.md, tickets, proposals, or design artifacts unless the
user explicitly requests that input; report if it conflicts with objective research.

Trace entry points, transformations, side effects, errors, and dependencies.
Return a coherent explanation, file:line evidence, existing testing patterns,
and genuine unanswered factual questions. Distinguish observed code from inference.
Do not critique, recommend changes, invent missing behavior, or claim tests ran.
````

### `.github/agents/implementer-agent.agent.md`

````markdown
---
name: implementer-agent
description: Implement one explicitly approved phase and report actual automated checks.
target: github-copilot
user-invocable: false
disable-model-invocation: false
tools: ['read', 'search', 'edit', 'execute']
---

Require the change directory, plan path, phase number, exact task IDs, and
confirmation from the coordinator that the current plan revision was approved.
Read the plan, relevant specs/design/research, repository instructions, and
relevant source. Implement only the assigned phase, including its tests.

Stop on a material mismatch between code, specs, and plan. Return the expected
state, observed state, and decision needed; do not silently redesign the change.
Run the phase's documented automated checks and report commands and outcomes.
Do not mark human checks complete or infer acceptance from passing tests.

Return changed files, proposed completed task IDs, actual check results,
remaining checks, and deviations. The coordinator owns tasks.md and review records.
Do not edit those records, start the next phase, delegate further, commit, push,
switch branches, or archive.
````

## 6. Representative Copilot skills

Use lowercase hyphenated skill names matching their directory names. Do not put `rpi:` in `name`: namespace punctuation is not valid for these workspace skill names. `disable-model-invocation: true` makes stage entry explicit instead of relying only on a description that says “use when invoked.”

### `.github/skills/rpi-research/SKILL.md`

````markdown
---
name: rpi-research
description: Create or explicitly revise objective research for an RPI OpenSpec change.
argument-hint: <change-name>
disable-model-invocation: true
---

# Objective research

1. Use rpi-researcher in a fresh chat containing no original change request.
   Require one explicit change name; ask rather than guessing among changes.
2. Run `openspec status --change <change-name> --json`. Require schema rpi and
   the intended repo-local root. Stop on nonzero exit or invalid JSON.
   If research is blocked, report the missing prerequisites. If research exists,
   require an explicit revision request before overwriting it.
3. Run `openspec instructions research --change <change-name> --json`.
   Consume its context, rules, instruction, template, and dependency paths.
   Read the research-questions dependency completely. Do not read request.md,
   proposal, design, or implementation plans. Stop if project context contains
   task intent that would compromise the objective-research boundary.
4. Delegate independent areas to the named research workers. Group related
   questions; use web research only when needed. Workers return source evidence
   and uncertainties, not recommendations. Report unavailable tools/sources.
5. Await every worker, verify important citations, and synthesize the system's
   current behavior, data flow, and existing testing patterns. Make at most one
   additional focused pass for unresolved questions, then document remaining gaps.
6. Write only to resolvedOutputPath from the instruction response. Gather real
   date, branch, and commit metadata; do not leave invented values or placeholders.
7. Re-read the result and refresh status. Report the output path, factual gaps,
   and that research is ready for review. Do not create the proposal or code.
   On revision, identify downstream documents requiring renewed review; OpenSpec
   will not automatically mark them stale.
````

### `.github/skills/rpi-implement/SKILL.md`

````markdown
---
name: rpi-implement
description: Implement one approved RPI phase, verify it, and stop for human review.
argument-hint: <change-name> [phase-number]
disable-model-invocation: true
---

# Phased implementation

1. Use rpi-implementer. Require an explicit change name. Inspect repository
   instructions and the existing worktree diff; preserve unrelated user changes.
2. Run `openspec status --change <change-name> --json` and
   `openspec instructions apply --change <change-name> --json`.
   Require schema rpi and the intended repo-local root. Stop on command failure,
   invalid JSON, blocked state, or unresolved warnings affecting readiness.
   Consume current project context and applicable operation guidance. Read the
   returned contextFiles needed for implementation, excluding research-questions.
3. Read approvals.md and require actual approval of the current design/plan/tasks
   revision. Ask if approval is absent or stale. Resolve material contradictions
   between the specs, design, plan, and code before editing anything.
4. Select only the requested phase, or the first pending phase when prior phase
   acceptance is recorded. Match task IDs N.Y to Phase N in plan.md. If apply says
   all_done, report remaining verification/acceptance instead of inventing tasks.
5. Delegate to implementer-agent using Copilot's native delegation. Supply the
   resolved change/plan paths, phase number, task IDs, and approved revision.
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
````

The final `/rpi-verify` procedure should use the same current CLI inputs, request a fresh `implementation-reviewer` comparison against the supplied diff and artifacts, map each spec scenario to test/manual evidence, run outstanding checks, and write a consolidated report. Its outcomes should distinguish **verified**, **failed**, and **blocked/not run**. It must not treat skipped checks as passing or let the reviewer approve its own design changes.

## 7. Coexistence with generated OpenSpec skills

OpenSpec already supports the `github-copilot` tool target. A later installation can use `openspec init --tools github-copilot --no-copilot-cloud`; this generates integration files and therefore is **not a design-only command**. Preserve existing config and project instructions when installing into an established project.

Keep custom files named `rpi-*`. Do not edit generated `openspec-*` skills to implement the RPI policy; updates can regenerate those files. Use the custom stage skills for gated RPI work. Generated propose/fast-forward/apply workflows are not substitutes for the one-stage/one-phase review policy and can bypass it if invoked separately.

Reuse the generated archive workflow, when installed, only after verification and an explicit user request. Do not manually move the change or copy deltas into main specs as a substitute for OpenSpec's archive/sync behavior. No GitHub cloud-agent setup workflow is required for this VS Code-only design.

### Intended interaction after the full kit exists

```text
Select rpi-intake:
  /rpi-questions add-session-timeout
  [Supply request; review the questions.]

Start a fresh chat; select rpi-researcher:
  /rpi-research add-session-timeout
  [Review the current-state report.]

Select rpi-planner:
  /rpi-design add-session-timeout
  [Proposal, specs, and design are separate invocations and reviews.]
  [Resolve all material choices.]
  /rpi-plan add-session-timeout
  [Plan, then tasks are separate invocations. Approve the current revision.]

Select rpi-implementer:
  /rpi-implement add-session-timeout 1
  [Run relevant manual checks; confirm acceptance and continuation.]
  /rpi-implement add-session-timeout 2
  /rpi-verify add-session-timeout
  [Request archive explicitly when satisfied.]
```

## 8. Acceptance criteria for building the full kit

### CLI and artifact checks

Run in a temporary fixture project, not by initializing this repository during design review:

```bash
openspec schema validate rpi
openspec new change rpi-smoke-test --schema rpi
openspec status --change rpi-smoke-test --json
openspec instructions research --change rpi-smoke-test --json
openspec instructions apply --change rpi-smoke-test --json
# After writing valid proposal and delta specs:
openspec validate rpi-smoke-test --type change --strict --no-interactive
```

Confirm that:

- The seven templates exist and the schema has no unresolved IDs or cycles.
- Only research questions are initially ready; research depends only on those questions.
- Apply stays blocked when any required artifact is missing, even if tasks already exist.
- Once artifacts exist, apply returns the expected numbered tasks and updates progress from `tasks.md`.
- A legitimate `skip_specs: true` change can proceed without fabricated delta specs.
- `isPlanningComplete`/`isComplete`, task completion, and human acceptance are handled as different states.

### VS Code behavior checks

These require the actual editor/runtime; CLI schema validation cannot establish them:

- All ten agents and six skills are discovered without frontmatter errors in the Copilot harness.
- Hidden workers can be delegated to by exact name; they cannot edit/run commands unless their listed tools allow it.
- Stage skills remain explicit-only, and selecting a skill does not unexpectedly change the agent's tools.
- A fresh research run does not receive request/design text and produces no proposed implementation.
- Writing a design document does not resolve its questions or approve the plan automatically.
- A phase run stops after checks, leaves manual acceptance pending, and does not start the next phase.
- Missing approvals, stale artifacts, failed tests, unavailable workers, and material code/plan mismatches stop work clearly.
- Two active changes do not get mixed; ambiguous selection triggers a question.
- Revisions preserve unrelated changes and reopen affected approvals/evidence.
- Final verification reports gaps; archive occurs only on request.

### Suggested build order

1. Review this artifact model, agent roster, and approval policy.
2. Author all seven templates and six worker agents, then exercise the research boundary.
3. Add the four coordinators and six stage skills, sharing one schema-driven artifact procedure.
4. Validate the full workflow on a small change with two vertical phases in VS Code.
5. Add durable approval enforcement only if prompt-level gates and human supervision are insufficient.

### Validation performed for this design

The schema sample was extracted into an isolated fixture and checked with OpenSpec 1.16.0 using temporary template fixtures. Artifact readiness, blocked apply with prematurely created tasks, completed planning versus task progress, spec skipping, and strict change validation were exercised. The examples have **not** been run in VS Code; agent discovery, permissions, and delegation remain acceptance tests for the full kit.

## References

- [OpenSpec 1.16.0 customization](https://github.com/Fission-AI/OpenSpec/blob/v1.16.0/docs/customization.md): project-local schemas, artifact rules, and templates.
- [OpenSpec 1.16.0 agent contract](https://github.com/Fission-AI/OpenSpec/blob/v1.16.0/docs/agent-contract.md): exact status/instruction fields and completion semantics.
- [OpenSpec 1.16.0 supported tools](https://github.com/Fission-AI/OpenSpec/blob/v1.16.0/docs/supported-tools.md): Copilot integration and separate cloud-agent opt-in.
- [VS Code custom agent file reference](https://github.com/microsoft/vscode-docs/blob/493a3d976971e1712b04fe07c579ded7e036e879/docs/agents/reference/custom-agent-file-reference.md): Copilot/Local differences, tools, and invocation controls.
- [VS Code agent skills](https://github.com/microsoft/vscode-docs/blob/493a3d976971e1712b04fe07c579ded7e036e879/docs/agent-customization/agent-skills.md): file locations, valid names, explicit invocation, and inline context.
- [VS Code subagents](https://github.com/microsoft/vscode-docs/blob/493a3d976971e1712b04fe07c579ded7e036e879/docs/agents/run/subagents.md): native Copilot delegation versus Local `runSubagent`.
