---
type: research
date: "[Actual ISO date/time with timezone]"
git_commit: "[Actual commit hash]"
branch: "[Actual branch name]"
---

# Research: [Topic]

## Questions investigated

[The descriptive questions supplied for this research, not the original task request.]

## Method and boundaries

This report describes the codebase as it exists. It does not recommend changes or select a future design. Statements distinguish observed source behavior from inference and unanswered questions.

## Summary

[Synthesize the main behavior, architectural relationships, and data flow in focused paragraphs. The report must be self-contained: a reader should understand the researched area without replaying the investigation.]

## Findings

<!-- Organize by behavior/concept, not by file or as a question-by-question answer list. Every section and important sub-point uses a takeaway header stating what is true, not a topic label or restated question. Preserve technical depth; remove repetition rather than necessary explanation. -->

### 1. [A takeaway stating how the existing system works]

[Lead with the concept, then give a coherent explanation supported by exact file:line ranges. Every material claim is traceable to source or an attributable external document; label inference and uncertainty. Keep paragraphs short and place each visual beside the prose it explains.]

<!-- Choose only useful views: tables for comparisons/config; sequence/data-flow diagrams; important call-stack trees; responsibility file trees; frontend component/state trees; type/endpoint/message/schema shapes; pseudocode for complex logic. Describe current state only—no proposed diffs or change markers. -->

#### Existing testing patterns

[Test file locations, unit/integration/e2e approach, mocks, fixtures/utilities, actual documented verification commands, and current coverage for this finding. If no tests were found, state that and the search scope; do not claim proven absence or test execution without evidence.]

<!-- Repeat finding/test sections as needed. Connect cross-component behavior and architectural relationships instead of producing a file index. -->

## Code references

[Comprehensive grouped files/directories and exact line references sufficient to navigate the researched area. State whether each group's coverage is exhaustive or illustrative.]

## External documentation

[When needed: official URLs, relevant versions, findings, and limitations. Omit if not applicable.]

## Open factual questions

[Genuine unanswered questions about how the current system works, with investigation limits, or None. Do not ask what should be built. On revision, integrate answers into the relevant findings and remove only answered questions; do not append an edit changelog.]
