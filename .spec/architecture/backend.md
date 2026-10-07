# Backend Architecture

## 1. Purpose

The backend provides remote persistence, authentication and the services required to synchronize application data.

It is implemented using Supabase and is accessed through the Data layer rather than directly by the Presentation or Domain / Application layers.

The backend is responsible for storing and securing remote application data, while business rules remain independent of the backend technology.

---

## 2. Responsibilities

The backend is responsible for providing the remote services required by the application.

It is responsible for:

* authenticating users and managing accounts;
* providing remote persistence for application data;
* enforcing data access and security policies;
* exposing the data required by the application through the Data layer;
* supporting synchronization between local and remote data;
* providing backend capabilities required by the application as the product evolves.

The backend must not:

* contain UI or Presentation logic;
* be accessed directly by the Presentation layer;
* contain business rules that belong to the Domain / Application layer;
* determine how the application behaves when operating offline.

Business logic remains independent of the backend and must be executable without requiring a network connection.

---

## 3. Services

The backend uses the following Supabase services for V1:

### 3.1 Authentication

Supabase Auth manages user authentication and account identity.

It is responsible for:

* user registration and sign-in;
* session management;
* authentication state;
* identifying the authenticated user for data access control.

Authentication details must remain encapsulated within the Data layer.

### 3.2 PostgreSQL

Supabase PostgreSQL provides remote persistence for application data.

It stores data such as:

* user-owned routines;
* workout records;
* exercise data;
* progression-related historical data.

The database structure and relationships are defined in `database.md`.

### 3.3 Row Level Security

PostgreSQL Row Level Security (RLS) controls access to user-owned data at the database level.

Policies must ensure that an authenticated user can only access data they are authorized to access.

RLS policies are part of the backend security model and must not be replaced by client-side checks alone.

### 3.4 Backend Extensions

Additional Supabase services or backend capabilities may be introduced when required by future product features.

They should only be added when they solve a concrete requirement and must not introduce unnecessary backend complexity into V1.

---

## 4. Security

Security is enforced at both the application and database levels.

### 4.1 Authentication

Supabase Auth is responsible for user authentication and session management.

The application must not implement its own authentication or store authentication credentials directly.

### 4.2 Authorization

Access to user-owned data is enforced through PostgreSQL Row Level Security (RLS).

Each user must only be able to access or modify data they are authorized to access.

Authorization must not rely solely on checks performed by the client application.

### 4.3 Data Protection

Sensitive authentication information must not be stored in application data tables or exposed to the client unnecessarily.

Supabase credentials and configuration must follow the security requirements of the platform. Secrets must never be hardcoded or committed to the repository.

### 4.4 Offline Data

Locally stored data may contain user workout information and must be treated as user data.

The local storage strategy must consider data integrity and secure handling of locally persisted information. Specific offline persistence and synchronization rules are defined in `offline-first.md`.

---

## 5. Rules

The following rules govern the backend and its interaction with the rest of the application:

* The Presentation layer must never access Supabase directly.
* Supabase access must be encapsulated within the Data layer.
* Business rules must remain independent of Supabase and database-specific implementations.
* User-owned data must be protected by PostgreSQL Row Level Security (RLS).
* Client-side authorization checks must not be considered a security boundary.
* Authentication credentials, service-role keys and other secrets must never be exposed to the client or committed to the repository.
* Database-specific logic must remain isolated from the Domain / Application layer.
* Backend services must only be introduced when required by a concrete application feature.
* Changes to backend behavior or security policies must be reflected in the corresponding architecture or database documentation.
