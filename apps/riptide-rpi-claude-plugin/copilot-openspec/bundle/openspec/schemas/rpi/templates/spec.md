<!-- One change-local delta per capability named in proposal. Select only applicable operation sections: ADDED, MODIFIED, REMOVED, RENAMED Requirements. The sample below is ADDED; do not leave empty operation sections. -->
<!-- For a NEW capability only, include Purpose (50+ meaningful characters). For an existing capability, omit Purpose and preserve its exact path. -->

## Purpose

[Explain the durable behavior this new capability provides and why its callers rely on it.]

## ADDED Requirements

### Requirement: [Observable behavior name]

The system SHALL [one externally observable behavior, input/output, constraint, or error condition].

#### Scenario: [Specific condition and outcome]

- **WHEN** [the triggering condition]
- **THEN** [the observable result]

<!-- Every requirement needs at least one exactly four-hash Scenario with WHEN/GIVEN and THEN. Keep requirement descriptions concise; move examples/edge cases to scenarios. -->
<!-- MODIFIED: read the current main spec; include the complete updated requirement and all scenarios, not a partial diff. REMOVED: include Reason and Migration. RENAMED: use paired - FROM: and - TO: entries naming the exact `### Requirement: Old name` and `### Requirement: New name` headers. Describe behavior, not internal classes, libraries, or task steps. -->
