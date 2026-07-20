# Shelf

Shelf is a local-first desktop application for organizing, searching, and managing personal bookmarks. The repository is a pnpm monorepo containing an Electron desktop client, a Hono API, shared validation contracts, and a Drizzle/SQLite data layer.

## Architecture

```text
Electron desktop application
        │
        │ HTTP
        ▼
Hono API container (:3070)
        │
        ▼
Drizzle ORM + SQLite
        │
        ▼
Docker volume (/data/shelf.db)
```

The Electron application is built as a native desktop package and does not run in Docker. Docker is used only for the backend API and its local SQLite database.

## Repository structure

```text
shelf/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── common/
│   │       │   ├── database/
│   │       │   ├── schema/
│   │       │   └── utils/
│   │       ├── features/
│   │       │   ├── bookmarks/
│   │       │   ├── folders/
│   │       │   └── trash/
│   │       ├── index.ts
│   │       ├── server.ts
│   │       └── swagger.ts
│   └── desktop/
│       ├── src/
│       ├── resources/
│       └── electron-builder.yml
├── packages/
│   ├── db/
│   │   ├── drizzle/
│   │   └── src/
│   │       ├── schemas/
│   │       ├── client.ts
│   │       └── migrate.ts
│   └── shared/
│       └── src/
│           ├── response/
│           └── schemas/
├── Dockerfile
├── pnpm-workspace.yaml
└── package.json
```

### Workspace responsibilities

| Path | Responsibility |
| --- | --- |
| `apps/api` | Hono HTTP API, request handling, application services, repositories, and OpenAPI documentation. |
| `apps/desktop` | Electron and React desktop client. It is packaged as a native application rather than a Docker image. |
| `packages/db` | SQLite connection, Drizzle table definitions, relations, generated migrations, and migration runner. |
| `packages/shared` | Shared Zod schemas, API contracts, parameter validation, and reusable response types. |

## API structure

The API is organized by feature. Each feature generally has three layers:

```text
route → service → repository → database
```

| Layer | Responsibility |
| --- | --- |
| Route | Declares HTTP methods, paths, Zod validation, response schemas, Swagger metadata, and HTTP error mapping. |
| Service | Contains application rules and translates repository results into domain-level outcomes. |
| Repository | Executes Drizzle queries and owns database transactions, position updates, tree operations, and soft deletion. |

Current API features:

- `bookmarks`: bookmark creation, editing, ordering, folder movement, favorites, metadata preview, and soft deletion.
- `folders`: hierarchical folders, sibling ordering, tree movement, recursive soft deletion, and nested bookmark loading.
- `trash`: combined trash listing and restoration of deleted folder trees or individual bookmarks.

All API routes use the `/api` prefix:

```text
/api/bookmarks
/api/folders
/api/trash
```

## Run the backend with Docker

### Prerequisites

- Docker Desktop or Docker Engine
- Docker BuildKit (enabled by default in current Docker versions)

### 1. Build the image

Run the command from the repository root:

```bash
docker build -t shelf-api:latest .
```

You can verify the image with:

```bash
docker images shelf-api
```

### 2. Run the API container

```bash
docker run -d \
  --name shelf-api \
  -p 3070:3070 \
  -v shelf-data:/data \
  shelf-api:latest
```

The named volume keeps the SQLite database after the container is stopped, removed, or replaced.

The container uses these defaults:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3070` | HTTP port inside the container. |
| `DATABASE_URL` | `/data/shelf.db` | SQLite database file location. |
| `MIGRATIONS_FOLDER` | `/app/drizzle` | Drizzle migration directory inside the image. |

Database migrations run automatically before the API server starts.

### 3. Verify the API

```bash
curl http://localhost:3070/doc
```

Available documentation:

- Swagger UI: [http://localhost:3070/swagger](http://localhost:3070/swagger)
- OpenAPI JSON: [http://localhost:3070/doc](http://localhost:3070/doc)

### Container management

View logs:

```bash
docker logs -f shelf-api
```

Stop the container:

```bash
docker stop shelf-api
```

Start the existing container again:

```bash
docker start shelf-api
```

Remove the container while preserving the database volume:

```bash
docker rm -f shelf-api
```

Remove the persisted SQLite volume only when its data is no longer needed:

```bash
docker volume rm shelf-data
```

## Rebuild after API changes

```bash
docker rm -f shelf-api
docker build -t shelf-api:latest .
docker run -d \
  --name shelf-api \
  -p 3070:3070 \
  -v shelf-data:/data \
  shelf-api:latest
```

The existing `shelf-data` volume is reused, and pending migrations are applied when the new container starts.

## Local development

Install dependencies:

```bash
pnpm install
```

Run the API in watch mode:

```bash
DATABASE_URL=../../packages/db/data/shelf.db pnpm --filter api dev
```

Build the API:

```bash
pnpm --filter api build
```

Run database migrations locally:

```bash
pnpm --filter @shelf/db db:migrate
```

Run the Electron desktop application in development mode:

```bash
pnpm --filter desktop dev
```

Build the Electron application sources:

```bash
pnpm --filter desktop build
```

Create a platform package with one of the Electron Builder scripts:

```bash
pnpm --filter desktop build:mac
pnpm --filter desktop build:win
pnpm --filter desktop build:linux
```
