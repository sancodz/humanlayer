# Research execution and report guide

Read [the workflow contract](./workflow.md) first. This guide restores investigation and writing detail without relaxing the objective-research boundary. Research describes the existing system; it does not advocate a requested change.

## Decompose and delegate

- Read the complete descriptive questions and exact source pointers before delegating. Do not read the request, proposal, design, plan, or intent-bearing project context.
- Map questions to coherent codebase areas. When locations are unknown, use `codebase-locator` first, then send promising paths to `codebase-analyzer` or `codebase-pattern-finder`. Parallelize independent areas; group related questions instead of creating one worker per question.
- Aim for roughly 2–6 well-scoped workers when the investigation warrants it. This is a planning heuristic, not a quota: a small question may need fewer, and unavailable workers remain a reported limitation. Ask focused questions rather than duplicating each worker's search procedure.
- Await every worker. Live source is the primary evidence for current behavior. Verify every source citation used in the report, or explicitly label an unverified claim as a gap. Use [the web-research guide](./web-research.md) for external documentation and version checks.
- After drafting, make at most one additional focused pass for unresolved factual questions. Update the relevant findings with answers; leave genuine remaining gaps visible instead of inventing closure.

## Worker evidence contracts

**Locator:** return a categorized map of implementation, contracts/types, configuration, callers, documentation, and tests/fixtures. Include entry points, useful directory clusters/counts, and exact references where visible. State search scope and whether each list is exhaustive or a sample. Do not infer behavior from names or recommend new locations.

**Analyzer:** trace entry points through calls, transformations, validation, state changes, side effects, errors, configuration, and external dependencies. Explain important logic and show before/after data shapes where useful. Cite exact file ranges, distinguish observation from inference, and include existing tests. Do not critique or propose fixes.

**Pattern finder:** find concrete analogous implementations and their callers, fixtures, and tests. Show multiple variations when they actually exist, with enough surrounding code to understand and reuse the pattern. Include exact references and usage context; distinguish common conventions from isolated examples and label explicitly deprecated code. Do not rank patterns or invent a preferred architecture.

## Write a self-contained technical explainer

The report is a coherent story about how the system works, **not a question-by-question answer list or a file index**. A reader should understand the researched area from the report without replaying the investigation. Technical depth takes precedence over brevity; remove repetition, not necessary explanation.

- Organize findings by behavior or concept. Give sections and important sub-points **takeaway headers** that state what is true.
  - Weak topic label: `Session storage`.
  - Weak question: `How are sessions persisted?`
  - Useful takeaway: `Sessions persist before the handler acknowledges the write`.
- Lead with the concept, then support it with prose and parenthetical file:line citations. Use ranges for adjacent lines. Every material factual claim must be traceable to source or an attributable external document; inference and uncertainty must be labeled.
- Keep paragraphs short. Place each visual beside the explanation it supports rather than collecting visuals at the end. Choose the smallest useful set:
  - Tables for comparisons, configuration, or capability matrices.
  - Sequence/data-flow diagrams for interactions and transformations.
  - Call-stack trees for important control flow; file trees for responsibility boundaries.
  - Component trees for frontend composition and state ownership.
  - Type signatures, endpoint/message shapes, or schema excerpts for contracts.
  - Pseudocode for complex logic that prose would obscure.
- Describe current state only. Do not use proposed diffs or change markers in objective research.
- Make **Code references** comprehensive enough to navigate the researched area. Group related files/directories and state whether coverage is exhaustive or illustrative.
- Under **each** finding, document existing testing patterns: test locations, unit/integration/e2e approach, mocks, fixtures/utilities, documented commands, and current coverage. If no tests were found, state that and the search scope; do not imply the search proved absence or that tests ran.
- Connect cross-component behavior and architectural relationships. Preserve genuine open factual questions, investigation limits, and relevant external-source conflicts.

## Revise without creating a changelog

Follow the [revision checklist](./artifact-procedure.md#revision-checklist). Read the existing report and descriptive feedback, verify corrections, and rework affected sections into the existing narrative. Update citations, testing findings, metadata, and resolved open questions together. Preserve valid unrelated findings. Do not append a chronological list of edits or read task intent to explain the feedback. Identify downstream documents and evidence needing renewed review, then stop for review.
