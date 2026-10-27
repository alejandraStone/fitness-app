# Constitution — Fitness App

## 1. Privacy and Local Data Ownership

- V1 stores user data locally on the device. No accounts, remote databases, cloud storage or synchronization are permitted.
- Personal data must not be exposed unnecessarily or transmitted to external services without an explicitly approved scope change.
- Data access and modifications must follow clear ownership and responsibility boundaries.

## 2. Data Integrity and Historical Accuracy

- Persisted data must remain consistent, accurate and recoverable across normal application operations.
- Historical workouts must preserve the configuration and performance recorded at the time of the workout, independently of subsequent routine edits or deletion.
- Changes to saved performance must propagate to all affected historical views, progression charts, personal records and recommendations.
- Calculations, unit conversions and persisted values must preserve sufficient precision and avoid cumulative rounding errors.
- Operations that must succeed or fail together must be atomic.

## 3. Offline Reliability and Persistence

- All core V1 functionality must work without an internet connection.
- SQLite is the sole persistence layer in V1.
- Saved data must persist across application restarts.
- Successful local operations must not depend on network availability.
- Persistence failures must be handled explicitly without silently losing or corrupting user data.
- No synchronization infrastructure may be introduced without an approved scope change.

## 4. User Agency and Explicit Decisions

- The application must support user decisions rather than make consequential changes on their behalf.
- Recommendations are advisory and must never automatically modify planned training configurations.
- Changes affecting future training must not silently rewrite historical records.
- User actions and their outcomes must be clear and predictable.

## 5. Simplicity and Scope Discipline

- V1 must prioritize a reliable, understandable core experience.
- Implement only functionality included in the approved product scope.
- Future extensibility is not sufficient justification for unnecessary abstractions, dependencies or infrastructure.
- Changes to product scope require an explicit decision and corresponding documentation updates.

## 6. Separation of Responsibilities

- Presentation, business logic and persistence must have clearly defined responsibilities.
- Business rules must not depend on UI components or directly access database infrastructure.
- Features must maintain explicit ownership of their data and domain rules.
- Cross-feature operations must respect these boundaries and use established application interfaces.
- Technical decisions must follow the approved architecture rather than introduce competing patterns.

## 7. Consistency and Verifiability

- The same business rules must produce consistent results across relevant screens and operations.
- Changes must preserve established invariants, including data integrity, historical accuracy and user control.
- Important business rules and calculations must be testable and verifiable.
- Completion must be based on verified behavior, not merely on code being written.

## 8. Language and User Communication

- Code, identifiers, comments, automated tests and technical documentation are written in English.
- Every message shown to the user must be written in Spanish: screen titles, labels, buttons, placeholders, hints, empty, loading, error and validation messages, dialogs, confirmations, notifications and accessibility labels.
- User-facing wording must be clear, respectful and consistent with the approved product tone.

