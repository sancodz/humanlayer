---
name: rpi-questions
description: Capture a request and create or explicitly revise descriptive research questions for an RPI change.
argument-hint: "<change-name>"
disable-model-invocation: true
---

# Research questions

Read [the workflow contract](../../rpi/workflow.md), [artifact procedure](../../rpi/artifact-procedure.md), and [record formats](../../rpi/records.md). Select **rpi-intake** before invoking this skill. Stop and ask for the correct agent if another role is selected.

1. Require one explicit change name and the actual user request. If only a slug is supplied, ask for the request. Read fully the files the user explicitly supplies; do not pull in unrelated task/design artifacts. Preserve exact URLs, repositories, dependencies, and source paths.
2. Run `openspec list --json` in the intended project and require a successful valid response. If that exact change does not exist and the user is asking to start it, run `openspec new change <change-name> --schema rpi --json`. A lookup failure is not permission to create or replace a change. Never hand-invent `.openspec.yaml`.
3. Use the shared artifact procedure for `research-questions`. Require schema rpi, the intended repo-local root, and a ready artifact (or explicit revision feedback if it exists). Fetch current instructions/template before writing.
4. Capture the actual request, supplied context pointers, and clarifications in change-local `request.md` using the record format. Preserve existing input; revise it only to reflect explicit new user feedback, never your own design. Ask when input is ambiguous.
5. Use lightweight, read-only source inspection to contextualize questions. This intake agent has no delegation tool: do not claim to have run subagents. Usually draft 2–7 focused descriptive questions about existing behavior, entry points, data flow, dependencies, edge cases, and testing patterns. For frontend work, include design system, components, typography/colors/theming, and existing UI tests.
6. Do not ask how to implement the request, embed a proposed solution, critique existing code, or write research/design/code. Context pointers are starting points, not permission to leak task intent into the question wording.
7. Write only the selected questions artifact and request input. Re-read them, refresh status, and report their exact paths and unresolved intake questions. On revision, identify downstream artifacts/approvals needing review without deleting them.
8. Stop for review. Ask the user to start a **fresh chat** with rpi-researcher and `/rpi-research <change-name>` after reviewing the questions; do not run research in the intent-bearing intake chat.
