# Todo-List-API

todo-list-api/
├── src/
│ ├── config/
│ │ ├── env.js # validación fail-fast de env
│ │ └── db.js # conexión/pool a Supabase Postgres
│ ├── models/
│ │ ├── user.model.js
│ │ ├── todo.model.js
│ │ └── refreshToken.model.js
│ ├── controllers/
│ │ ├── auth.controller.js
│ │ └── todo.controller.js
│ ├── services/
│ │ ├── auth.service.js
│ │ └── todo.service.js
│ ├── routes/
│ │ ├── auth.routes.js
│ │ └── todo.routes.js
│ ├── middlewares/
│ │ ├── authenticate.js
│ │ └── errorHandler.js
│ ├── utils/
│ │ └── ApiError.js
│ └── app.js
├── .env.example
├── .env (gitignored)
├── package.json
└── package-lock.json

Database Schema

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla users
CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name VARCHAR NOT NULL,
email VARCHAR UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla todos
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

-- Tabla refresh_tokens
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

-- Trigger para updated_at en todos
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER trigger_todos_updated_at
BEFORE UPDATE ON todos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


Fase 1 — Setup

Inicializar proyecto (npm init -y), instalar dependencias (express, pg, jsonwebtoken, bcrypt, dotenv, nodemon)
Crear estructura de carpetas MVC
.env.example y .gitignore
config/env.js — validación fail-fast de variables de entorno
config/db.js — pool de conexión a Supabase Postgres
app.js mínimo con Express levantando y una ruta de salud (GET /health)

Fase 2 — Esquema de base de datos

Tabla users (id UUID PK, name, email UNIQUE NOT NULL, password_hash, created_at)
Tabla todos (id SERIAL PK, user_id FK → users, title, description, completed, created_at, updated_at)
Tabla refresh_tokens (id, user_id FK, token_hash, expires_at, revoked)
Constraints e índices (FK, UNIQUE en email, índice en todos.user_id)

Fase 3 — Registro de usuario (POST /register)

Validar datos de entrada (name, email, password)
Verificar email único
Hash de password con bcrypt
Insertar usuario en BD
Emitir access + refresh token

Fase 4 — Login (POST /login)

Validar credenciales contra BD (comparar hash)
Emitir access token (JWT corto, HS256, payload mínimo)
Emitir refresh token (opaco, hash SHA-256 guardado en BD)

Fase 5 — Middleware de autenticación

Verificar JWT del header Authorization
Algoritmo fijado en backend (algorithms: ['HS256'])
Manejo de 401 si token falta/inválido/expirado

Fase 6 — CRUD de to-dos

POST /todos — crear (asociado a user_id del token)
PUT /todos/:id — actualizar, con chequeo de ownership → 403 si no es dueño
DELETE /todos/:id — eliminar, con ownership check, respuesta 204
GET /todos?page=&limit= — listar con paginación y total

Fase 7 — Validación de entrada

Esquemas de validación para body de cada endpoint (register, login, create/update todo)
Validación de query params de paginación

Fase 8 — Manejo de errores centralizado

Clase ApiError (statusCode + message)
Middleware errorHandler.js
Controllers usando try/catch + next(error)

Fase 9 — Seguridad adicional

Rate limiting en /login y /register (fuerza bruta)
Helmet (headers de seguridad: X-Content-Type-Options, X-Frame-Options, HSTS)
No exponer password_hash ni tokens en respuestas
Remover headers que revelan info (x-powered-by)

Fase 10 - Extras

Filtrado y ordenamiento en GET /todos
Tests unitarios
Rotación de refresh token (invalidar el usado, emitir nuevo)
Throttling general de la API
$$
