# ObservAI API Contracts Integrated

ObservAI Web currently integrates only contracts that are represented by typed clients and Zod schemas in the frontend.

## Shared Envelope

Most integrated JSON endpoints are expected to return:

```json
{
  "data": {},
  "metadata": {
    "requestId": "string",
    "processingTimeMs": 0,
    "provider": {
      "mode": "string"
    },
    "pagination": null
  }
}
```

Errors are expected in the same envelope with `data.code`, `data.message` and optional `data.details`.

Operational readiness is the exception: `GET /readyz` returns a direct readiness payload with `status` and `checks`, and may use HTTP 503 while still returning a valid body.

## Endpoints

| Capability | Method | Path | Frontend module |
|---|---:|---|---|
| API health | `GET` | `/health` | `src/features/health/api` |
| API readiness | `GET` | `/readyz` | `src/features/health/api` |
| Runtime capabilities | `GET` | `/v1/capabilities` | `src/features/capabilities/api` |
| Analysis history | `GET` | `/v1/analyses` | `src/features/analysis/api` |
| Analysis stats | `GET` | `/v1/analyses/stats` | `src/features/analysis/api` |
| Service autocomplete | `GET` | `/v1/services` | `src/features/analysis/api` |
| Submit analysis job | `POST` | `/v1/analyses` | `src/features/analysis/api` |
| Analysis job status | `GET` | `/v1/jobs/{jobId}` | `src/features/analysis/api` |
| Cancel analysis job | `DELETE` | `/v1/jobs/{jobId}` | `src/features/analysis/api` |
| Analysis details | `GET` | `/v1/analyses/{analysisId}` | `src/features/analysis/api` |
| Structured traces | `GET` | `/v1/analyses/{analysisId}/traces` | `src/features/analysis/api` |
| Chat history | `GET` | `/v1/analyses/{analysisId}/chat` | `src/features/chat/api` |
| Ask analysis question | `POST` | `/v1/analyses/{analysisId}/chat` | `src/features/chat/api` |

`POST /v1/analyses` returns `202 Accepted` with `jobId`, `status` and `statusUrl`. The frontend polls `GET /v1/jobs/{jobId}` until the job reaches `completed`, `failed` or `canceled`, then opens `/analyses/{analysisId}` only for completed jobs.

Job status responses include `phase`, `progressPercent` and `phaseStartedAt`. The frontend renders these fields in the analysis workspace execution panel and exposes cancellation for pending/running jobs through `DELETE /v1/jobs/{jobId}`.

`GET /v1/analyses` supports server-side filters for `severity`, `service`, `signal`, `provider`, `from`, `to`, `q`, `sort` and `order`. The frontend persists these filters in the history URL and uses `metadata.pagination.total` for page totals.

`GET /v1/analyses/stats` powers dashboard aggregate counts, severity distribution and top affected service counts. `GET /v1/services` powers the service filter autocomplete.

`GET /v1/analyses/{analysisId}/traces` returns normalized spans, critical path span IDs, slowest span IDs and dependency edges. The frontend renders these as a waterfall, critical path list, slowest spans list and dependency edge list.

## Runtime Configuration

Observability providers, LLM credentials and model/runtime choices are configured in ObservAI API before startup. ObservAI Web must not manage provider tokens or LLM API keys in the browser.

`GET /v1/capabilities` exposes non-secret runtime status and signal capability metadata. The dashboard renders deployment mode, version, LLM provider/model, observability providers, supported signals and request limits. The analysis form uses supported signals to avoid submitting unavailable signal types.
