# Run ObservAI Web With ObservAI API

## Web

```bash
pnpm install
cp .env.example .env.local
pnpm run dev
```

Default web URL:

```txt
http://localhost:3000
```

## API Base URL

The browser calls the Next.js same-origin proxy by default:

```env
NEXT_PUBLIC_OBSERVAI_API_URL=/api/observai
OBSERVAI_API_URL=http://localhost:8080
```

`NEXT_PUBLIC_OBSERVAI_API_URL` should usually stay as `/api/observai`. The Next.js route proxies requests to `OBSERVAI_API_URL` server-side, avoiding browser CORS failures when the API runs on `localhost:8080`.

Only browser-safe public values should use `NEXT_PUBLIC_*`. Provider tokens and LLM API keys must stay in ObservAI API configuration.

## API

Run ObservAI API separately on the configured URL. The frontend currently expects these capabilities to be available:

- `GET /health`
- `GET /readyz`
- `GET /v1/analyses`
- `POST /v1/analyses`
- `GET /v1/jobs/{jobId}`
- `GET /v1/analyses/{analysisId}`
- `GET /v1/analyses/{analysisId}/chat`
- `POST /v1/analyses/{analysisId}/chat`

Analysis creation is asynchronous. The web app submits the request, polls the job URL returned by the API and opens the analysis detail screen after completion.

## Docker

Build and run the web container:

```bash
docker build -t observai-web .
docker run -p 3000:3000 --env-file .env observai-web
```

Use a Docker Compose stack only after deciding how the API service, network and environment files should be owned in this repository.
