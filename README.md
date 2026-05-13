<div align="center">

# ObservAI Web

**Next.js web interface for ObservAI, an open-source AI platform for observability analysis.**

Analyze logs, metrics, traces and APM signals with your own AI provider.

<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Observability-2563EB?style=for-the-badge" />
<img src="https://img.shields.io/badge/AI_Chat-7C3AED?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />

</div>

---

## About

**ObservAI Web** is the frontend interface for ObservAI, an open-source and self-hosted AI platform for observability analysis.

The web application allows users to run technical analyses, inspect generated insights and continue the investigation through an integrated AI chat.

ObservAI Web is designed for engineers, SREs, DevOps teams and platform teams who need a faster way to understand logs, metrics, traces, APM events and production behavior.

---

## What ObservAI Web provides

ObservAI Web is the user-facing layer of the ObservAI platform.

It provides a modern interface for:

- Running observability analyses
- Investigating logs, metrics and traces
- Reviewing AI-generated diagnoses
- Exploring evidence collected from providers
- Understanding anomalies
- Identifying performance bottlenecks
- Reviewing code-level improvement suggestions
- Chatting with AI using analysis context
- Viewing previous analyses and investigation history

---

## Product experience

The goal of the web interface is to make observability analysis feel simple, guided and actionable.

Instead of forcing users to manually jump between multiple tools, dashboards and query languages, ObservAI Web presents a single workflow:

```txt
Configure ObservAI API
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

---

## Main screens

### Dashboard

The dashboard gives users a high-level view of the platform and recent analyses.

It can show:

- Recent investigations
- API runtime status
- Analysis history
- Severity overview
- Most analyzed services
- Recent anomalies

---

### Runtime configuration

Observability providers and LLM providers are configured in ObservAI API before startup. This keeps secrets and provider-specific operational settings out of the browser.

The API can be configured with observability providers such as:

- Dynatrace
- Datadog
- Elasticsearch
- OpenSearch
- Grafana Loki
- Prometheus
- Jaeger
- New Relic
- OpenTelemetry-compatible systems

Each provider can expose different signal types:

| Provider | Logs | Metrics | Traces | APM |
|---|---:|---:|---:|---:|
| Elasticsearch | ✅ | ❌ | ❌ | ⚠️ |
| OpenSearch | ✅ | ❌ | ❌ | ⚠️ |
| Loki | ✅ | ❌ | ❌ | ❌ |
| Prometheus | ❌ | ✅ | ❌ | ❌ |
| Jaeger | ❌ | ❌ | ✅ | ❌ |
| Dynatrace | ✅ | ✅ | ✅ | ✅ |
| Datadog | ✅ | ✅ | ✅ | ✅ |
| New Relic | ✅ | ✅ | ✅ | ✅ |
| OpenTelemetry | ⚠️ | ✅ | ✅ | ⚠️ |

Supported LLM provider types include:

- OpenAI
- Anthropic
- Gemini
- Azure OpenAI
- OpenRouter
- Ollama
- LM Studio
- Local/self-hosted LLMs

The user owns the token, the provider and the data flow. ObservAI Web consumes the backend runtime capabilities and does not manage provider credentials.

---

### Analysis workspace

The analysis workspace is where users request an investigation.

Example prompts:

```txt
Analyze checkout-service behavior in the last two hours.
Look for errors, latency increase, abnormal traces and possible root causes.
```

```txt
Analyze this distributed trace and identify performance bottlenecks.
Suggest improvements at service, database and code level.
```

```txt
Compare latency, error rate and CPU usage during the incident window.
Tell me which signal changed first.
```

The analysis result should be structured and easy to navigate.

---

### Evidence viewer

The evidence viewer helps users understand why the AI generated a specific diagnosis.

It can display:

- Logs used as evidence
- Metrics used as evidence
- Traces used as evidence
- APM events
- Time window
- Source provider
- Related service
- Severity
- Detected anomaly

The goal is to keep AI analysis grounded in real observability data.

---

### Trace insights

Trace insights are focused on performance and code-level improvement opportunities.

The UI should help users identify:

- Slow spans
- Expensive operations
- N+1 query patterns
- Slow database calls
- Excessive network hops
- External API bottlenecks
- Retry amplification
- Long synchronous chains
- Service orchestration problems
- Possible code-level issues

Example insight:

```txt
The payment.authorization span represents 71% of the total request time.
This suggests that the checkout flow is blocked by a synchronous external dependency.
Consider adding timeout boundaries, circuit breaker protection and fallback behavior.
```

---

### AI chat

The integrated chat is one of the most important parts of ObservAI Web.

After an analysis is completed, users can continue the investigation through a context-aware chat.

The chat uses:

- The generated diagnosis
- Collected evidence
- Logs
- Metrics
- Traces
- APM events
- Detected anomalies
- Recommended actions

Example questions:

```txt
What should I fix first?
Can this be related to the last deployment?
Which service is the main bottleneck?
Is there any evidence of database saturation?
Explain this trace in simple terms.
What would be the best action plan for this incident?
Can you suggest code-level improvements?
What dashboards should I create to monitor this better?
```

The goal is not only to show what happened, but to help the user decide what to do next.

---

## Design principles

### Clear over complex

Observability data is already complex. The UI should reduce cognitive load and help users understand what matters first.

### Evidence first

AI insights should be connected to evidence. The user should be able to see which signals were used to generate conclusions.

### Actionable by default

The interface should prioritize recommended actions, code-level suggestions and investigation next steps.

### Local and self-hosted friendly

The application should run locally, in private infrastructure or in Kubernetes without requiring a managed SaaS.

### Vendor agnostic

The UI should not be tied to a specific observability provider or LLM provider.

---

## Suggested stack

ObservAI Web is designed to be built with:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand or Jotai
- React Hook Form
- Zod
- Recharts or Tremor

The goal is to provide a fast, modern and maintainable developer experience.

---

## Environment variables

```env
NEXT_PUBLIC_OBSERVAI_API_URL=/api/observai
OBSERVAI_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=ObservAI
NEXT_PUBLIC_APP_ENV=local
```

---

## Run locally

Install dependencies:

```bash
pnpm install
```

Create local environment:

```bash
cp .env.example .env.local
```

Run the development server:

```bash
pnpm run dev
```

Open:

```txt
http://localhost:3000
```

The frontend browser calls the same-origin proxy at:

```txt
/api/observai
```

The proxy forwards requests server-side to:

```env
OBSERVAI_API_URL=http://localhost:8080
```

---

## Implemented frontend structure

This repository now contains the Next.js App Router frontend foundation:

- Central HTTP client for ObservAI API
- User-safe API errors, transient retry policy and global error boundaries
- Zod schemas for API envelopes, analysis and chat contracts
- TanStack Query hooks for health, analyses and chat
- Dashboard, analysis workspace, analysis details, filtered evidence viewer, categorized trace insights, chat and history screens
- Runtime status messaging that assumes providers and LLMs are backend-owned configuration

Current backend contracts integrated:

| Capability | Endpoint |
|---|---|
| API health | `GET /health` |
| API readiness | `GET /readyz` |
| Analysis history | `GET /v1/analyses` |
| Submit analysis job | `POST /v1/analyses` |
| Analysis job status | `GET /v1/jobs/{jobID}` |
| Analysis details | `GET /v1/analyses/{analysisID}` |
| Chat history | `GET /v1/analyses/{analysisID}/chat` |
| Ask analysis question | `POST /v1/analyses/{analysisID}/chat` |

Validation commands:

```bash
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
```

Additional documentation:

- [Frontend architecture](docs/frontend-architecture.md)
- [Integrated API contracts](docs/api-contracts.md)
- [Run web with API](docs/run-web-and-api.md)
- [Frontend roadmap](docs/frontend-roadmap.md)

---

## Run with Docker

```bash
docker build -t observai-web .
docker run -p 3000:3000 --env-file .env observai-web
```

---

## Run with Docker Compose

```yaml
services:
  observai-web:
    image: ghcr.io/guferreira1/observai-web:latest
    container_name: observai-web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_OBSERVAI_API_URL: /api/observai
      OBSERVAI_API_URL: http://observai-api:8080
```

---

## Relationship with ObservAI API

ObservAI Web depends on ObservAI API for:

- Authentication
- Runtime provider and LLM configuration
- Analysis execution
- Chat sessions
- Analysis history
- Evidence retrieval
- Streaming responses

API repository:

```txt
https://github.com/guferreira1/observai-api
```

---

## Security principles

The frontend should never expose private provider tokens or LLM API keys directly to the browser.

Sensitive credentials must be sent to the backend and handled securely by ObservAI API.

Recommended practices:

- Do not store secrets in frontend code
- Do not expose provider tokens in public environment variables
- Use secure backend APIs for credential management
- Use HTTPS in production
- Restrict access in self-hosted environments

---

## License

This project is licensed under the MIT License.
