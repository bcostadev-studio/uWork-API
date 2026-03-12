# uWork — Brazilian Company Dataset API

A production-ready REST API for retrieving and generating structured JSON datasets from Brazilian public company registries (CNPJ), powered by [BrasilAPI](https://brasilapi.com.br) and [ReceitaWS](https://receitaws.com.br).

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Endpoints](#endpoints)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development (Node)](#local-development-node)
  - [Local Development (Docker)](#local-development-docker)
  - [Production (Docker + HTTPS)](#production-docker--https)
- [Environment Variables](#environment-variables)
- [API Documentation (Swagger)](#api-documentation-swagger)
- [Testing](#testing)
- [Docker Setup](#docker-setup)
- [HTTPS / TLS](#https--tls)
- [i18n](#i18n)
- [Contributing](#contributing)
- [Commit Convention](#commit-convention)

---

## Overview

uWork ingests public CNPJ data from two free Brazilian government data providers, normalises the responses into a consistent schema, and exposes three read endpoints:

| Capability | Description |
|---|---|
| **Single lookup** | Fetch one company by its 14-digit CNPJ |
| **List** | Paginated listing with optional `state` and `active` filters |
| **Dataset generator** | Batch-fetch up to 50 CNPJs and receive a single JSON dataset |

All CNPJ values are validated against the official **check-digit algorithm** before any upstream request is made. Every user-facing message supports **English** and **Brazilian Portuguese** via `Accept-Language` header negotiation.

---

## Architecture

The project follows a **DDD-Lite (Domain-Driven Design Lite)** pattern with clean layer separation and dependency injection.

```
Request → Nginx (TLS termination)
        → Express (rate-limit, helmet, cors, i18n)
          → Router
            → Controller  (HTTP mapping, Zod validation)
              → Service   (pure business logic, no HTTP context)
                → Repository (HTTP data access, upstream normalisation)
                  → BrasilAPI  (primary)
                  → ReceitaWS  (automatic fallback)
```

### Layer responsibilities

| Layer | Rule |
|---|---|
| **Controller** | Only handles `req`/`res`. Validates input with Zod before calling the service. Never contains business logic. |
| **Service** | Framework-agnostic. Receives plain data, returns plain data. Throws `AppError` subclasses. No `req`/`res` allowed. |
| **Repository** | The only place where external HTTP calls are made. Responsible for mapping upstream payloads to internal DTOs. |

### Fallback strategy

The repository tries **BrasilAPI** first. On any non-404 upstream error it retries against **ReceitaWS**. Batch requests (`findManyByCnpjs`) use `Promise.allSettled` — partial failures are silently omitted so a single bad CNPJ never breaks the whole dataset.

---

## Project Structure

```
uWork/
├── docker/
│   └── nginx/
│       ├── nginx.conf          # Worker / gzip / log config
│       ├── conf.d/
│       │   └── default.conf    # HTTP→HTTPS redirect + TLS virtual host
│       └── ssl/                # Auto-generated self-signed certs (git-ignored)
├── src/
│   ├── @types/                 # Express augmentations (req.t)
│   ├── config/
│   │   ├── env.ts              # Zod-validated environment variables
│   │   ├── http-client.ts      # Axios instances for each upstream
│   │   ├── i18n.ts             # i18next initialisation
│   │   └── swagger.ts          # OpenAPI 3.0 spec (code-first)
│   ├── core/
│   │   ├── errors/
│   │   │   └── base-error.ts   # BaseError + NotFound / BadRequest / UpstreamUnavailable / TooManyRequests
│   │   ├── middlewares/
│   │   │   ├── error-handler.middleware.ts
│   │   │   └── not-found.middleware.ts
│   │   └── utils/
│   │       ├── async-handler.ts     # try/catch-free controller wrapper
│   │       └── cnpj-validator.ts    # Check-digit algorithm
│   ├── i18n/
│   │   └── locales/
│   │       ├── en/translation.json
│   │       └── pt/translation.json
│   ├── modules/
│   │   └── companies/
│   │       ├── controllers/
│   │       │   └── company.controller.ts
│   │       ├── repositories/
│   │       │   └── company.repository.ts
│   │       ├── schemas/
│   │       │   ├── company.schema.ts    # Public DTOs
│   │       │   └── upstream.types.ts    # BrasilAPI / ReceitaWS raw types
│   │       ├── services/
│   │       │   └── company.service.ts
│   │       └── routes.ts
│   ├── app.ts       # Express factory
│   └── server.ts    # Entry point + graceful shutdown
├── tests/
│   ├── integration/
│   │   └── companies.routes.spec.ts
│   └── unit/
│       └── company.service.spec.ts
├── .env.example
├── docker-compose.yml          # Production (HTTPS + Nginx)
├── docker-compose.dev.yml      # Development override (hot-reload)
├── Dockerfile                  # Multi-stage: builder → development → production
└── tsconfig.json
```

---

## Endpoints

Base path: `/api/v1`

### `GET /health`

Liveness check — no rate limiting applied.

```
GET /health
```

**Response `200`**
```json
{
  "status": "ok",
  "uptime": 3724.5,
  "timestamp": "2024-07-01T12:00:00.000Z",
  "environment": "production"
}
```

---

### `GET /api/v1/companies`

Paginated list of Brazilian companies sourced from a curated seed pool, with optional filters.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `integer ≥ 1` | `1` | Page number |
| `limit` | `integer 1–100` | `20` | Results per page |
| `state` | `UF string` | — | Filter by Brazilian state abbreviation (e.g. `SP`, `RJ`) |
| `active` | `boolean` | — | `true` → only `ATIVA` companies; `false` → all others |

```
GET /api/v1/companies?state=SP&active=true&page=1&limit=10
```

**Response `200`**
```json
{
  "status": "success",
  "message": "Companies listed successfully",
  "total": 4,
  "page": 1,
  "limit": 10,
  "generatedAt": "2024-07-01T12:00:00.000Z",
  "data": [ /* Company[] */ ]
}
```

---

### `GET /api/v1/companies/dataset`

Batch-fetch up to **50** CNPJs and receive a single unified JSON dataset. Partial failures are tolerated.

**Query parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `cnpjs` | `string` | ✅ | Comma-separated 14-digit CNPJs (max 50) |

```
GET /api/v1/companies/dataset?cnpjs=60746948000112,33000167000101,43209527000148
```

**Response `200`**
```json
{
  "status": "success",
  "message": "Dataset generated successfully",
  "total": 3,
  "generatedAt": "2024-07-01T12:00:00.000Z",
  "data": [ /* Company[] */ ]
}
```

---

### `GET /api/v1/companies/:cnpj`

Single company lookup by CNPJ. Tries BrasilAPI first, automatically falls back to ReceitaWS.

**Path parameters**

| Parameter | Format | Example |
|---|---|---|
| `cnpj` | 14 raw digits, no mask | `60746948000112` |

```
GET /api/v1/companies/60746948000112
```

**Response `200`**
```json
{
  "status": "success",
  "message": "Company data retrieved successfully",
  "data": { /* Company */ }
}
```

---

### Error responses

All errors follow the same envelope:

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "The provided CNPJ is invalid",
  "details": { }
}
```

| Status | Meaning |
|---|---|
| `400` | CNPJ passed format validation but failed the check-digit algorithm |
| `404` | Company not found in any upstream source |
| `422` | Zod schema validation failed — `details` field contains field-level errors |
| `429` | Rate limit exceeded (default: 30 req / 60 s per IP) |
| `502` | Both BrasilAPI and ReceitaWS are currently unavailable |

---

## Data Model

### `Company`

| Field | Type | Source | Description |
|---|---|---|---|
| `cnpj` | `string` | both | 14-digit CNPJ (no mask) |
| `legalName` | `string` | both | Razão Social |
| `tradeName` | `string \| null` | both | Nome Fantasia |
| `registrationStatus` | `string` | both | Situação Cadastral (e.g. `ATIVA`, `BAIXADA`) |
| `registrationDate` | `string` | both | ISO 8601 date |
| `legalNature` | `string` | both | Natureza Jurídica |
| `size` | `string` | both | Porte (ME, EPP, DEMAIS, …) |
| `shareCapital` | `number` | both | Capital Social in BRL |
| `email` | `string \| null` | both | — |
| `phone` | `string \| null` | both | Formatted as `(DDD) XXXXX-XXXX` |
| `address` | `Address` | both | See below |
| `mainActivity` | `Cnae` | both | Primary CNAE code + description |
| `secondaryActivities` | `Cnae[]` | both | Secondary CNAE codes |
| `partners` | `Partner[]` | both | QSA (Quadro de Sócios e Administradores) |
| `taxRegimeHistory` | `TaxRegimeEntry[]` | brasilapi only | Year-by-year tax regime |
| `simplesNacional` | `boolean \| null` | both | Simples Nacional opt-in status |
| `mei` | `boolean \| null` | both | MEI status |
| `isHeadquarters` | `boolean` | both | `true` when MATRIZ |
| `source` | `"brasilapi" \| "receitaws"` | — | Which provider served the record |
| `retrievedAt` | `string` | — | ISO 8601 fetch timestamp |

### `Address`

```json
{
  "street": "PRACA ALFREDO EGYDIO DE SOUZA ARANHA",
  "number": "100",
  "complement": "TORRE OLAVO SETUBAL",
  "neighborhood": "PARQUE JABAQUARA",
  "city": "SAO PAULO",
  "state": "SP",
  "zipCode": "04344-902"
}
```

### `Cnae`

```json
{ "code": "6422100", "description": "Bancos múltiplos, com carteira comercial" }
```

### `Partner`

```json
{ "name": "ROBERTO EGYDIO SETUBAL", "role": "Diretor-Presidente", "entryDate": "1994-04-01" }
```

---

## Getting Started

### Prerequisites

- **Node.js 24+**
- **npm 10+**
- **Docker 24+** and **Docker Compose v2** *(for containerised setups)*

### Local Development (Node)

```bash
# 1. Clone and install dependencies
git clone <repo-url> uwork
cd uwork
npm install

# 2. Set up environment variables
cp .env.example .env

# 3. Start with hot-reload
npm run dev
```

The API is now available at `http://localhost:3000`.  
Swagger UI is at `http://localhost:3000/docs`.

---

### Local Development (Docker)

```bash
# Build and start the API container only (no Nginx, no HTTPS)
docker compose -f docker-compose.dev.yml up --build
```

Source files are bind-mounted — code changes trigger automatic recompilation via `ts-node-dev`.

---

### Production (Docker + HTTPS)

```bash
# 1. Copy and edit environment variables
cp .env.example .env

# 2. Start all services (cert-gen → api → nginx)
docker compose up --build -d

# 3. Check service health
docker compose ps
docker compose logs -f nginx
```

**Service startup order:**
1. `cert-gen` — generates a self-signed TLS certificate into `docker/nginx/ssl/` (skipped if cert already exists)
2. `api` — waits until the Node process passes the `/health` healthcheck
3. `nginx` — starts only after `api` is healthy

The API is then reachable at:
- `https://localhost/api/v1/companies`
- `https://localhost/docs`

> **Note:** Browsers will show a security warning for the self-signed certificate. Accept it manually, or replace `docker/nginx/ssl/server.crt` and `docker/nginx/ssl/server.key` with a certificate from a trusted CA (e.g. Let's Encrypt).

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `production`, or `test` |
| `API_HOST` | auto-resolved | Hostname used for Swagger server URLs and Nginx `server_name` matching. Defaults to `uwork.api.dev` in development and `uwork.api.prod` in production. Must match your `/etc/hosts` entry. |
| `PORT` | `3000` | Port the Node process listens on |
| `BRASIL_API_BASE_URL` | `https://brasilapi.com.br/api` | BrasilAPI base URL |
| `RECEITAWS_BASE_URL` | `https://receitaws.com.br/v1` | ReceitaWS base URL |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window in milliseconds |
| `RATE_LIMIT_MAX` | `30` | Max requests per IP per window |
| `CORS_ORIGIN` | `*` | Allowed origin(s) — comma-separated list or `*` |

---

## API Documentation (Swagger)

Swagger UI is served at `/docs` and the raw OpenAPI 3.0 spec is available at `/docs/spec.json`.

| Environment | URL |
|---|---|
| Local (Node) | http://localhost:3000/docs |
| Local (Docker dev) | http://localhost:3000/docs |
| Production (Docker) | https://localhost/docs |

The spec is defined **code-first** in `src/config/swagger.ts` using `swagger-jsdoc`. All schemas, parameters, and reusable response objects (`$ref`) are declared in the `components` section.

---

## Testing

```bash
# Run all tests
npm test

# Unit tests only (company service)
npm run test:unit

# Integration tests only (HTTP routes via supertest)
npm run test:integration

# With coverage report
npm run test:coverage
```

### Test strategy

| Suite | Location | What it covers |
|---|---|---|
| **Unit** | `tests/unit/company.service.spec.ts` | All service methods: `getCompanyByCnpj`, `generateDataset`, `listCompanies` — with mocked repository |
| **Integration** | `tests/integration/companies.routes.spec.ts` | Full HTTP stack via supertest — validation, status codes, i18n messages, pagination, filters |

The repository is mocked at the module level in integration tests so no real HTTP calls are made during CI.

---

## Docker Setup

### Images

| Service | Image | Role |
|---|---|---|
| `api` | `node:24-alpine` (multi-stage build) | Node.js application |
| `nginx` | `nginx:1.27-alpine` | Reverse proxy + TLS termination |
| `cert-gen` | `alpine:3.20` | One-shot self-signed certificate generator |

### Multi-stage Dockerfile

```
builder      → npm ci + tsc compilation
development  → npm ci + ts-node-dev (hot-reload, source bind-mounted)
production   → npm ci --omit=dev + copy dist/ (non-root user, minimal image)
```

The production image runs as a non-root user (`appuser`) for security hardening.

### Useful commands

```bash
# View logs
docker compose logs -f api
docker compose logs -f nginx

# Restart a single service
docker compose restart api

# Rebuild after code changes
docker compose up --build -d api

# Stop everything and remove volumes
docker compose down -v

# Open a shell in the running API container
docker compose exec api sh
```

---

## HTTPS / TLS

### Self-signed certificate (default)

On first `docker compose up`, the `cert-gen` service runs OpenSSL and places two files in `docker/nginx/ssl/`:

```
docker/nginx/ssl/
├── server.crt   # Self-signed X.509 certificate (365 days)
└── server.key   # RSA 2048-bit private key
```

These files are **git-ignored**. They persist across container restarts because the `ssl/` directory is bind-mounted.

### Replacing with a trusted certificate

Drop your certificate and key into `docker/nginx/ssl/` with the same filenames, then reload Nginx:

```bash
cp /path/to/fullchain.pem docker/nginx/ssl/server.crt
cp /path/to/privkey.pem   docker/nginx/ssl/server.key
docker compose exec nginx nginx -s reload
```

### TLS configuration

The Nginx virtual host enforces:
- TLS 1.2 and 1.3 only (TLS 1.0 / 1.1 disabled)
- ECDHE cipher suites with forward secrecy
- `Strict-Transport-Security` (HSTS) with 2-year max-age and `preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- HTTP → HTTPS permanent redirect (301) on port 80

---

## i18n

All user-facing strings are internationalised. Language is negotiated via the `Accept-Language` request header (falling back to `en`).

| Header | Language |
|---|---|
| `Accept-Language: en` | English (default) |
| `Accept-Language: pt` | Brazilian Portuguese |

Translation files live in `src/i18n/locales/`:

```
src/i18n/locales/
├── en/translation.json
└── pt/translation.json
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Follow the [commit convention](#commit-convention)
4. Ensure all tests pass: `npm test`
5. Open a pull request

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

| Prefix | When to use |
|---|---|
| `feat:` | New feature or endpoint |
| `fix:` | Bug fix |
| `refactor:` | Code change with no functional difference |
| `test:` | Adding or updating tests |
| `docs:` | Documentation only |
| `chore:` | Tooling, dependencies, config |
| `ci:` | CI/CD pipeline changes |
| `wip:` | Work-in-progress / exploratory commit |

---

## Data Sources

| Provider | URL | Rate limit | Notes |
|---|---|---|---|
| BrasilAPI | https://brasilapi.com.br | Public, no key | Richer data: tax regime, full QSA |
| ReceitaWS | https://receitaws.com.br | Public, no key | Automatic fallback only |

Both APIs are free and require no API key.

---

## License

ISC