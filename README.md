<div align="center">

# ObservAI Web

**Next.js web interface for ObservAI, an open-source and self-hosted AI platform for observability analysis.**

Analyze logs, metrics, traces and APM signals with your own ObservAI API and AI provider.

<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Self--hosted-2563EB?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />

</div>

---

## What this repository is

ObservAI Web is the frontend for ObservAI. It gives engineers a guided workspace to run AI-powered investigations, inspect evidence, review diagnoses and continue the incident analysis through a context-aware chat.

The browser does not talk directly to observability providers or LLM providers. Secrets, provider tokens and model configuration belong to ObservAI API. This web app calls ObservAI API through a same-origin Next.js proxy.

API repository:

```txt
https://github.com/guferreira1/observai-api
```

## Screenshots

No committed screenshots are available yet. Until the first release assets are added, use these placeholders to understand the intended product flow.

| Screen | Placeholder | Purpose |
|---|---|---|
| Dashboard | `docs/screenshots/dashboard.png` | Runtime status, recent analyses and severity overview. |
| New analysis | `docs/screenshots/new-analysis.png` | Investigation prompt, service scope, signal selection and execution progress. |
| Analysis detail | `docs/screenshots/analysis-detail.png` | Summary, severity, affected services, evidence and recommended actions. |
| Evidence viewer | `docs/screenshots/evidence-viewer.png` | Logs, metrics, traces and APM events used to ground the diagnosis. |
| AI chat | `docs/screenshots/analysis-chat.png` | Follow-up investigation using the completed analysis context. |

## Requirements

- Node.js 22 or newer
- pnpm 10.32.1 or newer
- ObservAI API running locally or reachable from the Next.js server
- Optional: Docker 24 or newer for containerized web runs

The web app defaults to:

| Service | URL |
|---|---|
| ObservAI Web | `http://localhost:3000` |
| ObservAI API | `http://localhost:8080` |
| Browser-facing API proxy | `http://localhost:3000/api/observai` |

## Run Web + API locally

1. Start ObservAI API in a separate terminal.

   Follow the API repository setup and make sure it listens on:

   ```txt
   http://localhost:8080
   ```

   Expected health checks:

   ```bash
   curl http://localhost:8080/health
   curl http://localhost:8080/readyz
   ```

2. Install web dependencies.

   ```bash
   pnpm install
   ```

3. Create local web environment.

   ```bash
   cp .env.example .env.local
   ```

4. Keep the default local values unless your API runs elsewhere.

   ```env
   NEXT_PUBLIC_OBSERVAI_API_URL=/api/observai
   OBSERVAI_API_URL=http://localhost:8080
   NEXT_PUBLIC_APP_NAME=ObservAI
   NEXT_PUBLIC_APP_ENV=local
   ```

5. Start the web app.

   ```bash
   pnpm run dev
   ```

6. Open the product.

   ```txt
   http://localhost:3000
   ```

For a more detailed self-hosted local guide, see [Run ObservAI Web With ObservAI API](docs/run-web-and-api.md).

## How API routing works

Browser code calls:

```txt
/api/observai
```

The Next.js route handler forwards those requests server-side to:

```txt
OBSERVAI_API_URL
```

For local development that means:

```txt
Browser -> http://localhost:3000/api/observai/v1/analyses
Next.js -> http://localhost:8080/v1/analyses
```

Keep `NEXT_PUBLIC_OBSERVAI_API_URL=/api/observai` for normal local and self-hosted deployments. Change `OBSERVAI_API_URL` when the API is hosted on another address, container name or internal service DNS.

Only browser-safe values may use `NEXT_PUBLIC_*`. Never put provider tokens, LLM API keys or observability credentials in frontend environment variables.

## Expected API endpoints

ObservAI Web currently integrates these backend capabilities:

| Capability | Method | Path |
|---|---:|---|
| API health | `GET` | `/health` |
| API readiness | `GET` | `/readyz` |
| Runtime capabilities | `GET` | `/v1/capabilities` |
| Analysis history | `GET` | `/v1/analyses` |
| Analysis stats | `GET` | `/v1/analyses/stats` |
| Service autocomplete | `GET` | `/v1/services` |
| Submit analysis job | `POST` | `/v1/analyses` |
| Analysis job status | `GET` | `/v1/jobs/{jobId}` |
| Cancel analysis job | `DELETE` | `/v1/jobs/{jobId}` |
| Analysis details | `GET` | `/v1/analyses/{analysisId}` |
| Structured traces | `GET` | `/v1/analyses/{analysisId}/traces` |
| Chat history | `GET` | `/v1/analyses/{analysisId}/chat` |
| Ask analysis question | `POST` | `/v1/analyses/{analysisId}/chat` |

`POST /v1/analyses` is asynchronous. The frontend expects `202 Accepted`, polls `GET /v1/jobs/{jobId}` and opens the completed analysis only after the job returns an `analysisId`.

See [Integrated API contracts](docs/api-contracts.md) for response envelope details.

## Product workflow

```txt
Configure ObservAI API
   ↓
Open ObservAI Web
   ↓
Choose analysis scope
   ↓
Run AI-powered investigation
   ↓
Review evidence and diagnosis
   ↓
Chat with AI about the result
   ↓
Decide what to fix, improve or monitor
```

The main screens are:

- Dashboard: API health, readiness, runtime capabilities, aggregate analysis stats and recent investigations.
- New analysis: service scope, time window, signal selection, prompt and job progress.
- Analysis detail: summary, severity, affected services, evidence, possible root causes and recommended actions.
- Evidence viewer: logs, metrics, traces, APM events, source provider and related service context.
- Trace insights: structured spans, critical path, slowest spans and dependency edges.
- AI chat: follow-up questions grounded in the completed analysis context.
- History: paginated investigations with filters and sorting.

## Supported provider model

Observability providers and LLM providers are configured in ObservAI API before startup. ObservAI Web consumes non-secret runtime metadata from the API and never manages provider credentials in the browser.

Examples of observability systems the platform can model:

- Dynatrace
- Datadog
- Elasticsearch
- OpenSearch
- Grafana Loki
- Prometheus
- Jaeger
- New Relic
- OpenTelemetry-compatible systems

Examples of LLM provider types:

- OpenAI
- Anthropic
- Gemini
- Azure OpenAI
- OpenRouter
- Ollama
- LM Studio
- Local or self-hosted LLMs

## Docker

Build and run only the web container:

```bash
docker build -t observai-web .
docker run -p 3000:3000 --env-file .env.local observai-web
```

When the API runs in another container, set `OBSERVAI_API_URL` to the internal service name that the web container can reach, for example:

```env
NEXT_PUBLIC_OBSERVAI_API_URL=/api/observai
OBSERVAI_API_URL=http://observai-api:8080
```

Minimal Compose shape for a self-hosted stack:

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

This repository does not currently own an API image tag, API environment file or production Compose topology. Treat the snippet as a local stack template and adapt it to the API repository you run.

## Development commands

```bash
pnpm run dev
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
```

## Troubleshooting

| Symptom | Check |
|---|---|
| Web shows API unavailable | Confirm `curl http://localhost:8080/health` works from the host. |
| Browser CORS errors | Keep `NEXT_PUBLIC_OBSERVAI_API_URL=/api/observai` and use the Next.js proxy. |
| Docker web cannot reach API | Use the Compose service name in `OBSERVAI_API_URL`, not `localhost`. |
| Analysis stays pending | Check `GET /v1/jobs/{jobId}` in the API and confirm the API worker/provider configuration. |
| Empty providers or signals | Check `GET /v1/capabilities` and the API runtime configuration. |

## Documentation

- [Run web with API](docs/run-web-and-api.md)
- [Frontend architecture](docs/frontend-architecture.md)
- [Integrated API contracts](docs/api-contracts.md)
- [Frontend roadmap](docs/frontend-roadmap.md)

## Security

- Do not store provider tokens or LLM API keys in frontend code.
- Do not expose secrets through `NEXT_PUBLIC_*` variables.
- Send sensitive credentials only to ObservAI API.
- Use HTTPS and private networking in production self-hosted environments.
- Avoid logging provider payloads, tokens or sensitive evidence.

## License

This project is licensed under the MIT License.
