---
name: rpi-research
description: Create or explicitly revise objective research for an RPI OpenSpec change.
argument-hint: <change-name>
disable-model-invocation: true
---

# Objective research

Read [the workflow contract](../../rpi/workflow.md), [artifact procedure](../../rpi/artifact-procedure.md), [record formats](../../rpi/records.md), and [the research execution/report guide](../../rpi/research-guide.md). A skill does not switch agents; stop and ask for the designated agent if the wrong role is selected.

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
4. Apply the research guide's decomposition strategy: locate unknown areas first,
   then analyze promising paths and existing patterns. Group related questions,
   parallelize independent areas, and use the 2–6 worker heuristic only when warranted.
   Use web research when needed under its bounded procedure. Workers return source
   evidence and uncertainties, not recommendations. Report unavailable tools/sources.
5. Await every worker and verify every source citation used in the report. Synthesize
   a self-contained technical explainer with takeaway headers, appropriate visuals,
   comprehensive grouped references, and testing patterns under each finding—not a
   question-by-question answer list or file index. Make at most one additional focused
   pass for unresolved questions, integrate answers into affected sections, and document gaps.
6. Do not run the planning snapshot helper during objective research: it reads request and design inputs. Write only to resolvedOutputPath from the instruction response. Gather real
   date, branch, and commit metadata; do not leave invented values or placeholders.
7. Re-read the result and refresh status. Report the output path, factual gaps,
   and that research is ready for review. Do not create the proposal or code.
   On revision, follow the shared revision checklist: address each feedback item,
   rework affected sections cohesively rather than appending a changelog, and update
   citations, tests, metadata, and answered open questions. Identify downstream review;
   OpenSpec will not automatically mark documents stale.
