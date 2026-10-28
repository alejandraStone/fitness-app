# AGENTS.md — Fitness App

## 1. Before Starting Any Task

1. Read `docs/constitution.md` and `docs/PRD.md`.
2. Read the relevant architecture and design documents.
3. Read the active feature's `spec.md`, `plan.md` and `tasks.md`.
4. Compare the implementation with the applicable requirements and acceptance criteria before making changes.

Treat the current approved documentation and repository as the sources of truth. Do not revive superseded decisions, specifications or implementations.

## 2. General Development Rules

- Implement only the requested task and its necessary dependencies.
- Inspect before implementing. Reuse existing code, components, dependencies and infrastructure.
- Make the smallest change that satisfies the requirements.
- Do not duplicate functionality, introduce unnecessary abstractions or install redundant dependencies.
- Do not perform unrelated refactors or implement future features prematurely.
- Never overwrite unrelated user changes or execute destructive operations without authorization.
- Do not make unapproved product or architectural decisions.
- Write code, identifiers, comments, file names and technical documentation in English. Write all user-facing copy shown in the application in Spanish (see section 5).
- Ask for clarification when ambiguity materially affects requirements, data integrity or architecture.

## 3. Architecture and Feature Boundaries

- Follow `docs/constitution.md` and the relevant documents in `docs/architecture/` and `docs/design/`.
- Respect the established folder structure, dependency direction, naming conventions and TypeScript configuration.
- Keep business logic out of UI components.
- Access SQLite through the documented repository and application layers; never query the database directly from UI components.
- Respect feature ownership. Use established application interfaces to coordinate operations between features.
- Do not duplicate domain rules or bypass feature boundaries through direct database writes.
- Reuse existing navigation, components, hooks, state management and utilities.
- Do not introduce competing architectures or infrastructure.

## 4. Persistence and Data Integrity

- SQLite is the only persistence store in V1. Do not introduce a backend, remote database, authentication, cloud storage or synchronization.
- Inspect the existing schema, migrations, repositories and constraints before changing persistence.
- Preserve stable identifiers, relationships, historical snapshots and existing user data.
- Use database transactions for operations that must succeed or fail together.
- Add migrations when required by the existing migration strategy. Never modify applied migrations in a way that breaks existing installations.
- Never reset, drop or recreate a database containing user data without explicit authorization.
- Preserve the distinction between current configurations and historical records.
- Follow the documented deletion, update and historical-retention rules.
- Ensure persisted changes are reflected in affected UI through the established reactive data flow.

Do not introduce speculative infrastructure for features outside the approved V1 scope.

## 5. UI and Design Consistency

- Read the relevant design documents before changing screens or interactions.
- Write every user-facing message in Spanish: screen titles, labels, buttons, placeholders, hints, empty, loading, error and validation messages, dialogs, confirmations, notifications and accessibility labels. Code, identifiers, comments, tests and technical documentation remain in English.
- Reuse existing design tokens, components, navigation and interaction patterns.
- Follow established loading, validation, error and empty-state conventions.
- Prevent duplicate submissions and handle persistence failures appropriately.
- Keep shared state consistent without introducing competing sources of truth.
- Do not require screen reloads or navigation away and back to reflect successful mutations.
- Do not introduce additional UI libraries or state-management solutions without an approved reason.

## 6. Dependencies and Tooling

Before adding, upgrading, replacing or removing a dependency:

1. Inspect `package.json`, the lockfile and relevant configuration.
2. Check whether the required capability already exists.
3. Verify compatibility with the current project.
4. Make only the necessary change.

Use the project's existing scripts and tools. Do not change package managers, regenerate lockfiles unnecessarily or install additional tooling for unrelated tasks.

## 7. Specification-Driven Development

- Follow the active feature's documented workflow and task dependencies.
- Treat `spec.md` as the source of feature requirements and acceptance criteria.
- Treat `plan.md` as the implementation plan and `tasks.md` as the work tracker.
- Consult shared architecture and design documents whenever relevant.
- Implement incrementally and verify each task before marking it complete.
- Update documentation only when an approved requirement or implementation change requires it.
- Do not rewrite unrelated documents or mark unimplemented requirements as complete.
- Resolve conflicts between documentation and code explicitly; never silently introduce materially different behavior.

Initialization tasks are conditional. Verify whether the required setup already exists before creating or replacing configuration, directories, dependencies or infrastructure.

## 8. Testing and Validation

- Inspect existing tests and testing tools before introducing new ones.
- Add tests for new behavior and regression tests for defects.
- Cover relevant business rules, validation, persistence, transaction integrity and failure cases.
- Verify that changes preserve historical data and feature boundaries where applicable.
- Run relevant project checks and tests.
- Report actual results and distinguish existing failures from regressions.
- Never claim that a command, test or build passed unless it was executed successfully.

## 9. Before Completing Any Task

1. Verify the applicable acceptance criteria against the implementation.
2. Review the diff for unintended changes, duplicated logic and unnecessary complexity.
3. Verify data integrity and architectural compliance where relevant.
4. Run the applicable tests and validation commands.
5. Update task statuses and necessary documentation.
6. Identify incomplete work, blockers and unresolved decisions.

Provide a concise completion report containing:

- Changes implemented.
- Existing code and infrastructure reused.
- Tests and commands executed, with actual results.
- Remaining work, known issues and blockers.

Do not claim completion while required acceptance criteria remain unverified.

## Guiding Principle

**Inspect first. Follow the current specifications. Reuse what works. Preserve data integrity. Implement only what is required. Verify before reporting completion.**