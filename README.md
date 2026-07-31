# Todo-List-API

RESTful API for managing a to-do list with custom user authentication (JWT + rotating refresh tokens), built in Node.js with an MVC architecture.

## Features

- User registration and login with hashed passwords (bcrypt)
- Authentication via short-lived JWT access tokens + rotating refresh tokens delivered as an httpOnly cookie
- Revoked refresh token reuse detection (revokes all active sessions for the user as a security measure)
- Full CRUD for tasks, protected by authentication and per-resource ownership validation
- Paginated task listing
- Input validation with Zod
- Centralized error handling
- Rate limiting on authentication endpoints
- Security headers via Helmet

## Stack

- Runtime: Node.js + Express
- Database: PostgreSQL (Supabase)
- Authentication: JWT (jsonwebtoken) + bcrypt
- Validation: Zod
- Security: Helmet, express-rate-limit

## Architecture

MVC (Model-View-Controller) architecture, separating responsibilities into layers:

```
todo-list-api/
├── src/
│   ├── config/
│   │   ├── env.js              # Fail-fast environment variable validation
│   │   └── db.js                # Supabase Postgres connection pool
│   ├── models/
│   │   ├── user.model.js
│   │   ├── todo.model.js
│   │   └── refreshToken.model.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── todo.controller.js
│   ├── services/
│   │   ├── auth.service.js      # Business logic: hashing, token issuance and rotation
│   │   └── todo.service.js      # Business logic: ownership validation
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── todo.routes.js
│   ├── middlewares/
│   │   ├── authenticate.js      # JWT verification
│   │   ├── validate.js          # Body/query validation with Zod
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js      # Centralized error handling
│   ├── validations/
│   │   ├── auth.validation.js
│   │   └── todo.validation.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   └── cookies.js
│   └── app.js
├── .env.example
├── .env                          # (gitignored)
├── package.json
└── package-lock.json
```

Models are implemented as classes with static methods (stateless data access). Services and controllers are implemented as classes with constructor-based dependency injection, favoring decoupling and testability.

## Database Schema

Normalized design (3NF) with foreign keys and explicit indexes on columns used in frequent filters.

```sql
-- Extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- todos table
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_todos_user_id ON todos(user_id);

-- refresh_tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Trigger to automatically update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_todos_updated_at
BEFORE UPDATE ON todos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

Design decisions:

- users.id is UUID to avoid exposing the total number of registered users.
- todos.id is SERIAL: real access protection doesn't rely on obscuring the ID, but on ownership validation in the service layer, so an auto-incrementing integer is more index-efficient without sacrificing security.
- ON DELETE CASCADE on both relations to users, to keep referential consistency when a user is deleted.
- updated_at is updated via a database trigger, not from the application layer, guaranteeing the value is correct regardless of where the UPDATE originates.

## Authentication

- Access token: JWT signed with HS256, 15-minute TTL, minimal payload (sub, iat, exp).
- Refresh token: opaque random string (not a JWT), 7-day TTL, stored as a SHA-256 hash in the database and delivered to the client as an httpOnly cookie.
- Rotation: every use of a refresh token invalidates it and issues a new one. Reuse of an already-revoked token revokes all active sessions for that user, as a safeguard against possible token theft.

## Installation

```bash
git clone <repo-url>
cd todo-list-api
npm install
cp .env.example .env
```

Fill in .env with your credentials:

```
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
NODE_ENV=development
```

Generate strong secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run the SQL script from the section above in the Supabase SQL Editor to create the tables.

## Usage

```bash
npm run dev
```

The server starts on http://localhost:3000 (or your configured port). Verify it's running with:

```
GET /health
```

## Endpoints

### Authentication

| Method | Route          | Description                                              | Auth required              |
| ------ | -------------- | -------------------------------------------------------- | -------------------------- |
| POST   | /auth/register | Registers a new user                                     | No                         |
| POST   | /auth/login    | Authenticates a user                                     | No                         |
| POST   | /auth/refresh  | Renews the access token using the refresh token (cookie) | No (requires valid cookie) |
| POST   | /auth/logout   | Revokes the refresh token for the current session        | Yes                        |

POST /auth/register

```json
{
  "name": "John Doe",
  "email": "john@doe.com",
  "password": "password123"
}
```

Response 201:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "name": "John Doe", "email": "john@doe.com" }
}
```

POST /auth/login

```json
{
  "email": "john@doe.com",
  "password": "password123"
}
```

### Tasks (to-dos)

All routes require the Authorization: Bearer <accessToken> header.

| Method | Route                  | Description                       |
| ------ | ---------------------- | --------------------------------- |
| POST   | /todos                 | Creates a task                    |
| GET    | /todos?page=1&limit=10 | Lists the user's tasks, paginated |
| PUT    | /todos/:id             | Updates a task (owner only)       |
| DELETE | /todos/:id             | Deletes a task (owner only)       |

POST /todos

```json
{
  "title": "Buy groceries",
  "description": "Buy milk, eggs, and bread"
}
```

Response 201:

```json
{
  "id": 1,
  "user_id": "uuid",
  "title": "Buy groceries",
  "description": "Buy milk, eggs, and bread",
  "completed": false,
  "created_at": "...",
  "updated_at": "..."
}
```

GET /todos?page=1&limit=10

Response 200:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Buy groceries",
      "description": "...",
      "completed": false
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 2
}
```

Common error codes:

| Code | Meaning                                                            |
| ---- | ------------------------------------------------------------------ |
| 400  | Input validation error                                             |
| 401  | Not authenticated (token missing, invalid, or expired)             |
| 403  | Authenticated but not authorized for this resource (not the owner) |
| 404  | Resource not found                                                 |
| 409  | Conflict (e.g. email already registered)                           |
| 429  | Too many requests (rate limit exceeded)                            |

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- Refresh token delivered as an httpOnly cookie with sameSite: strict
- JWT algorithm explicitly pinned on the backend (HS256) during verification, to prevent algorithm confusion attacks
- Rate limiting on /auth/register and /auth/login (5 attempts / 15 minutes) to mitigate brute force
- Security headers via Helmet (X-Content-Type-Options, X-Frame-Options, CSP)
- X-Powered-By header disabled
- Sensitive data (password_hash, tokens) never included in API responses
