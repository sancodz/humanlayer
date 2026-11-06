# RPI starter kit for VS Code Copilot and OpenSpec

A portable implementation of the [approved core RPI design](../docs/copilot-openspec-design.md): research questions → objective research → reviewed proposal/specs/design → detailed vertical-phase plan/tasks → phased implementation → verification.

The kit contains **10 custom agents**, **6 explicit-only skills**, a **7-artifact OpenSpec schema with all templates**, shared workflow/record guidance, and a planning-scope fingerprint helper. Nothing in this directory activates HumanLayer's root workspace. Install into a project only when you choose to.

## Requirements

- VS Code with the **Copilot harness**, custom agents, skills, and native delegation available. Select the harness before testing; `target: github-copilot` interprets a file but does not switch the running harness. These files are not the Local-harness profile or the GitHub-hosted cloud coding agent.
- OpenSpec **1.16.0** on your PATH, using **Node.js 22.12 or newer**. For a Bun-managed installation: `bun add --global @fission-ai/openspec@1.16.0`. Keep normal tool approvals enabled.
- An existing project directory. The installer itself uses only Node built-ins, with no package install or network access. Bun **1.4.2 or newer** is needed only to run this kit's tests/bootstrap tooling.

## Install without overwriting project files

From this repository's root, preview the exact paths first:

```bash
node apps/riptide-rpi-claude-plugin/copilot-openspec/tools/install.mjs --target "/path/to/project" --dry-run
node apps/riptide-rpi-claude-plugin/copilot-openspec/tools/install.mjs --target "/path/to/project"
```

You can also copy this entire kit directory elsewhere and run `node tools/install.mjs --target ...` from it. Keep `manifest.json`, `bundle/`, and `tools/` together.

The installer:

- Copies the manifest's files, including hidden `.github` content, and creates missing parent directories.
- Preserves any existing **`openspec/config.yaml` byte-for-byte**, even if its default schema is not `rpi`. Review/merge project context and artifact rules yourself; there is no YAML rewrite.
- Leaves identical owned files unchanged, so repeated installation is safe.
- Rejects differing existing owned files, directory/file conflicts, and symbolic-link paths before copying anything. There is no `--force` option. Resolve an intentional upgrade manually after reviewing diffs/backups.
- Uses exclusive file creation to avoid overwriting files that appear after preflight. On a write failure, it attempts to remove only files/directories this invocation created. It is not a filesystem sandbox or protection against malicious concurrent filesystem changes.
- Does not run OpenSpec init, install dependencies, write global settings, edit project instructions, create cloud workflows, or perform git operations.

In the target project:

```bash
openspec --version
openspec schema validate rpi
openspec new change my-feature --schema rpi
```

Use `--schema rpi` when creating changes even if an existing config defaults to `spec-driven`. Do not force an existing change to another schema via a status flag. Do not create the change twice: alternatively, let `/rpi-questions` create it after you supply the name and actual request.

The supplied config uses generic project guidance. Replace that guidance with **repository conventions and real validation commands**, not the current ticket/request. Preserve existing project instructions and service-test setup requirements. Check `openspec schema which rpi` if another schema appears to resolve.

### Optional official OpenSpec integration

The custom RPI skills work with the CLI; official `openspec-*` skills are not vendored. If you want those, including the generated archive workflow, initialize/configure them separately in the target project with `openspec init --tools github-copilot --no-copilot-cloud`, reviewing its diff. Prefer doing that before installing this kit into a new project. Do not overwrite an established project's context/config just to get default integration files.

Keep custom `rpi-*` files separate from generated `openspec-*` files, which OpenSpec updates may regenerate. Generated propose/fast-forward/apply workflows can bypass this kit's prompt-level review policy; use the RPI stage skills for RPI changes. After final verification and acceptance, archive only on explicit user request through the official archive workflow/CLI. No GitHub cloud-agent workflow is required.

## Run the workflow

A skill does **not** switch agents. Choose the role shown below, invoke the skill explicitly, and review the result before the next invocation.

| Step | Select agent | Invoke |
| --- | --- | --- |
| Capture request and questions | `rpi-intake` | `/rpi-questions my-feature` and supply the actual request |
| Objective research, in a **new chat** | `rpi-researcher` | `/rpi-research my-feature` |
| Proposal | `rpi-planner` | `/rpi-design my-feature proposal` |
| Capability deltas | `rpi-planner` | `/rpi-design my-feature specs` |
| Design discussion | `rpi-planner` | `/rpi-design my-feature design` |
| Resolve material design choices | `rpi-planner` | Give explicit feedback on the open choices |
| Detailed vertical phases | `rpi-planner` | `/rpi-plan my-feature plan` |
| Derived task ledger | `rpi-planner` | `/rpi-plan my-feature tasks` |
| Approve and authorize scope | `rpi-planner` | Review current artifacts and explicitly approve the selected phase(s) |
| Implement one phase | `rpi-implementer` | `/rpi-implement my-feature 1` |
| Review and continue | `rpi-implementer` | Confirm relevant manual checks/acceptance and explicitly authorize the next phase |
| Verify final result | `rpi-implementer` | `/rpi-verify my-feature` |

Omitting the artifact selector chooses the first missing ready artifact **within that skill**, not every remaining artifact. Existing output requires explicit revision feedback. `/rpi-design` and `/rpi-plan` write one artifact per invocation. A skipped specs invocation reports the skip and stops; invoke design separately. If the change does not alter spec-level behavior, deliberately set `skip_specs: true` in its OpenSpec metadata rather than inventing a requirement.

The default implementation invocation runs one phase. Only explicit authorization of a bounded phase sequence permits several phases, with a separate worker and checks for each. It never implies permission to commit, push, switch branches, open a PR, or archive. Reported defects stay in the current approved scope; changed requirements return to planning.

### Review and revision records

Shared contracts are installed under `.github/rpi/`:

- [Workflow boundaries and phase/approval rules](bundle/.github/rpi/workflow.md).
- [Single-artifact procedure](bundle/.github/rpi/artifact-procedure.md), which fetches templates from OpenSpec rather than copying them into skills.
- [Request, approval, and verification record formats](bundle/.github/rpi/records.md).

Intake stores user intent in change-local `request.md`; objective research never reads that file or runs the snapshot helper. Switching agents in the same conversation does not erase intent: start a fresh research chat containing only the change name/questions. Source and test findings need verifiable citations; unavailable tools/sources remain explicit gaps.

Planning decisions and approval go in `approvals.md`, and real command/scenario/phase evidence goes in `verification.md`. To identify reviewed planning scope:

```bash
node .github/rpi/snapshot.mjs "/resolved/project/openspec/changes/my-feature"
```

The JSON includes file digests, a `scopeDigest`, missing fixed inputs, and the spec file count. It normalizes numbered task checkbox markers so checking off unchanged `N.Y` tasks does not invalidate approved scope. Task text/order, included change-local inputs, or specs changing **does** change the digest. Code changes need separate revision/diff evidence; this helper does not hash application code or project-level configuration, validate readiness, grant approval, or prove tests passed. An incomplete snapshot must not be approved just because it has a digest.

## Agents included

Four visible coordinators: `rpi-intake`, `rpi-researcher`, `rpi-planner`, and `rpi-implementer`.

Six hidden-but-delegatable workers: `codebase-locator`, `codebase-analyzer`, `codebase-pattern-finder`, `web-search-researcher`, `implementer-agent`, and `implementation-reviewer`.

Read/search-only workers do not have editing or terminal tools. `web-search-researcher` additionally has web tools; the phase implementer has editing and execution tools. The factual deviation reviewer cannot obtain a git diff or run checks itself: its coordinator supplies the complete diff and checks evidence. Tool availability and delegation must be verified in your actual Copilot runtime. No model IDs, Claude tool call syntax, Local-only `agents` allowlists, or `handoffs` are required.

## Limits and acceptance checks

The review gates are **advisory instructions plus human supervision**, not enforced access control. An agent with `execute`/`edit` is not restricted to certain filesystem paths. Digests and Markdown approvals are not trusted authorization. OpenSpec tracks artifact existence and task progress, not research quality, staleness, or human acceptance. `isPlanningComplete`/`isComplete` and `all_done` are not a verified outcome. Keep normal approvals enabled, inspect diffs, and add trusted hooks/CI if you need enforcement.

Automated tests below exercise files, installation, digests, and the actual CLI. They cannot establish that a model follows instructions. Before real use, run a small two-phase change in VS Code and check:

- Ten agents and six explicit-only skills are discovered without frontmatter errors; hidden workers delegate by exact name with the expected tools.
- Fresh research sees only questions/source pointers and returns no implementation suggestions.
- Design choices remain open until actual feedback, and planning feedback does not start coding.
- Missing/stale approval, a failed/unavailable check, a missing worker, a mismatched plan, or an ambiguous change causes a clear stop.
- A phase stops for acceptance/continuation and does not mark manual checks passed or move on automatically.
- Final verification accounts for scenarios, task scope, uncommitted changes, and unresolved gaps; archive occurs only on request.

VS Code/model behavior has **not** been runtime-tested by the CLI suite. This is the remaining manual acceptance step.

## Test the kit

Run from this repository's root; no root dependency install or application services are required:

```bash
bun test apps/riptide-rpi-claude-plugin/copilot-openspec/test/unit
bun apps/riptide-rpi-claude-plugin/copilot-openspec/tools/test-openspec.mjs
```

The second command installs pinned OpenSpec 1.16.0 with lifecycle scripts disabled into an isolated temporary directory, runs the integration suite, and removes the temporary install afterward. It needs access to the package registry. To use an existing installation instead, set `RPI_OPENSPEC_CLI` to its absolute `bin/openspec.js` path; the suite checks the version and fails rather than silently skipping CLI tests. Both commands propagate test failures and keep fixtures/dependencies out of this repository.

The dedicated CI workflow runs the same commands on kit changes. The tests cover the manifest, YAML/frontmatter, dependency graph, templates and local links, tool restrictions, dry-run/idempotent/no-clobber installs, symlink/path conflicts, rollback after a file race, scope digests, actual CLI state/instructions/strict validation, two-phase task progress with real fixture checks, and spec skipping.

This kit adapts HumanLayer's Apache-2.0 RPI workflow. Its installed [license](bundle/.github/rpi/LICENSE) and [notice](bundle/.github/rpi/NOTICE) are retained without replacing the target project's root license.
