# Run ObservAI Web With ObservAI API

This guide covers a local self-hosted development stack where ObservAI API runs separately and ObservAI Web connects to it through the built-in Next.js proxy.

## Local topology

```txt
Browser
  -> http://localhost:3000
  -> http://localhost:3000/api/observai/*
  -> Next.js proxy
  -> http://localhost:8080/*
  -> ObservAI API
```

Default ports:

| Service | Default URL | Owned by |
|---|---|---|
| ObservAI Web | `http://localhost:3000` | This repository |
| ObservAI API | `http://localhost:8080` | `observai-api` repository |
| Browser API base path | `/api/observai` | This repository |

## Requirements

- Node.js 22 or newer
- pnpm 10.32.1 or newer
- ObservAI API configured and running
- Optional: Docker 24 or newer

Provider credentials, LLM API keys and observability tokens must be configured in ObservAI API. They must not be added to this frontend repository.

## 1. Start ObservAI API

In the API repository, follow its setup instructions and start the API on:

```txt
http://localhost:8080
```

From this repository, confirm the API is reachable:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/readyz
```

The web app can open with degraded states while the API is unavailable, but the analysis workflow needs the API endpoints listed below.

## 2. Configure ObservAI Web

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Default local values:

```env
NEXT_PUBLIC_OBSERVAI_API_URL=/api/observai
OBSERVAI_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=ObservAI
NEXT_PUBLIC_APP_ENV=local
```

Environment variable behavior:

| Variable | Used by | Default | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_OBSERVAI_API_URL` | Browser | `/api/observai` | Keep this as the same-origin proxy path for most deployments. |
| `OBSERVAI_API_URL` | Next.js server route | `http://localhost:8080` | Set this to the API URL reachable from the web server or container. |
| `NEXT_PUBLIC_APP_NAME` | Browser | `ObservAI` | Display name only. |
| `NEXT_PUBLIC_APP_ENV` | Browser | `local` | Display/runtime label only. |

Do not use `NEXT_PUBLIC_*` for secrets.

## 3. Start ObservAI Web

```bash
pnpm run dev
```

Open:

```txt
http://localhost:3000
```

The browser should call the proxy path:

```txt
http://localhost:3000/api/observai/health
```

The Next.js server forwards that to:

```txt
http://localhost:8080/health
```

## Expected API endpoints

The frontend currently expects these ObservAI API contracts:

| Capability | Method | Path | Notes |
|---|---:|---|---|
| API health | `GET` | `/health` | Used for online/offline status. |
| API readiness | `GET` | `/readyz` | Used for dependency readiness checks. |
| Runtime capabilities | `GET` | `/v1/capabilities` | Non-secret provider, signal and runtime metadata. |
| Analysis history | `GET` | `/v1/analyses` | Supports filters and pagination. |
| Analysis stats | `GET` | `/v1/analyses/stats` | Dashboard aggregate metrics. |
| Service autocomplete | `GET` | `/v1/services` | Analysis and history service filtering. |
| Submit analysis job | `POST` | `/v1/analyses` | Returns `202 Accepted` with a job ID. |
| Analysis job status | `GET` | `/v1/jobs/{jobId}` | Polled until terminal status. |
| Cancel analysis job | `DELETE` | `/v1/jobs/{jobId}` | Cancels pending or running jobs. |
| Analysis details | `GET` | `/v1/analyses/{analysisId}` | Detail screen source. |
| Structured traces | `GET` | `/v1/analyses/{analysisId}/traces` | Trace waterfall and dependency insight source. |
| Chat history | `GET` | `/v1/analyses/{analysisId}/chat` | Context-aware chat history. |
| Ask analysis question | `POST` | `/v1/analyses/{analysisId}/chat` | Sends follow-up prompts. |

Most JSON endpoints are expected to return the shared API envelope documented in [API contracts](api-contracts.md). `GET /readyz` is allowed to return readiness information directly and may use HTTP 503 while still returning a valid body.

## Analysis execution flow

```txt
User submits analysis
  -> POST /v1/analyses
  -> API returns 202 Accepted with jobId and statusUrl
  -> Web polls GET /v1/jobs/{jobId}
  -> Job reaches completed, failed or canceled
  -> Completed jobs expose analysisId
  -> Web opens /analyses/{analysisId}
```

The frontend renders `phase`, `progressPercent` and `phaseStartedAt` when the API returns them. If cancellation is available, the UI calls `DELETE /v1/jobs/{jobId}`.

## Docker

Build and run the web app only:

```bash
docker build -t observai-web .
docker run -p 3000:3000 --env-file .env.local observai-web
```

When the API is running on the host and the web app runs in Docker, `localhost` inside the container refers to the container itself. Use a host or network address reachable from the container.

Example for Linux using the host gateway:

```bash
docker run \
  -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e NEXT_PUBLIC_OBSERVAI_API_URL=/api/observai \
  -e OBSERVAI_API_URL=http://host.docker.internal:8080 \
  observai-web
```

Example Compose shape when both services are on the same Docker network:

```yaml
services:
  observai-api:
    image: observai-api:local
    ports:
      - "8080:8080"
    env_file:
      - ../observai-api/.env

  observai-web:
    image: observai-web:local
    build:
      context: .
      args:
        NEXT_PUBLIC_OBSERVAI_API_URL: /api/observai
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_OBSERVAI_API_URL: /api/observai
      OBSERVAI_API_URL: http://observai-api:8080
    depends_on:
      - observai-api
```

This repository does not currently own the API image tag, API env file or production Compose layout. Keep production stack ownership in the deployment repository or the API repository until those contracts are formalized.

## Validation

Useful checks while wiring Web and API:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/readyz
curl http://localhost:3000/api/observai/health
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run test:e2e
pnpm run build
pnpm run docker:build
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Dashboard shows API unavailable | API is down or `OBSERVAI_API_URL` is wrong. | Check `curl http://localhost:8080/health` and `.env.local`. |
| Browser shows CORS errors | Browser is calling the API directly. | Use `NEXT_PUBLIC_OBSERVAI_API_URL=/api/observai`. |
| Web container cannot reach API | Container uses `localhost` for another container or host API. | Use `http://observai-api:8080` in Compose or `host.docker.internal` for host API access. |
| Analysis never completes | API worker, provider or LLM runtime is not ready. | Check `GET /readyz`, API logs and `GET /v1/jobs/{jobId}`. |
| Signals are missing in the form | Capabilities endpoint has no supported signals. | Check `GET /v1/capabilities` and API provider configuration. |
