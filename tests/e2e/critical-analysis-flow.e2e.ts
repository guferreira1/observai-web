import { expect, type Page, test } from "@playwright/test";

const observedAt = "2026-05-13T18:00:00.000Z";
const createdAt = "2026-05-13T18:05:00.000Z";
const analysisId = "analysis-e2e";
const jobId = "job-e2e";

const responseMetadata = {
  requestId: "req-e2e",
  processingTimeMs: 12,
  provider: {
    mode: "test",
    observability: ["prometheus", "loki"],
    llm: "mock"
  }
};

const analysisResult = {
  id: analysisId,
  summary: "Payment checkout latency increased after the latest deployment.",
  severity: "high",
  confidence: "high",
  affectedServices: ["checkout-service", "payment-service"],
  evidence: [
    {
      id: "evidence-latency",
      signal: "metrics",
      service: "checkout-service",
      source: "prometheus",
      name: "checkout p95 latency",
      summary: "p95 latency crossed 2.4s while traffic stayed stable.",
      observed: observedAt,
      score: 0.94,
      unit: "ms",
      provider: "prometheus",
      query: "histogram_quantile(0.95, checkout_request_duration_seconds)"
    }
  ],
  detectedAnomalies: ["checkout p95 latency increased above baseline"],
  possibleRootCauses: [
    {
      cause: "Payment dependency regression",
      evidence: ["evidence-latency"],
      confidence: "high"
    }
  ],
  recommendedActions: [
    {
      action: "Rollback the payment adapter deployment and watch checkout latency.",
      rationale: "The regression starts at the deployment boundary.",
      priority: 1
    }
  ],
  codeLevelInsights: ["Payment adapter calls are slower than the previous baseline."],
  missingEvidence: [],
  createdAt
};

function createEnvelope(responseBody: unknown) {
  return {
    data: responseBody,
    metadata: responseMetadata
  };
}

async function mockObservAiApi(page: Page) {
  await page.route("**/api/observai/**", async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const apiPath = requestUrl.pathname.replace("/api/observai", "");

    if (apiPath === "/health") {
      await route.fulfill({ json: createEnvelope({ status: "ok" }) });
      return;
    }

    if (apiPath === "/readyz") {
      await route.fulfill({
        json: {
          status: "ok",
          checks: [{ name: "database", status: "ok", durationMs: 4 }]
        }
      });
      return;
    }

    if (apiPath === "/v1/capabilities") {
      await route.fulfill({
        json: createEnvelope({
          mode: "test",
          version: "e2e",
          llm: { provider: "mock", model: "observai-e2e" },
          observability: [
            { provider: "prometheus", signals: ["metrics", "apm"] },
            { provider: "loki", signals: ["logs"] },
            { provider: "tempo", signals: ["traces"] }
          ],
          limits: {
            httpRequestTimeoutMs: 30_000,
            httpMaxBodyBytes: 1_048_576,
            rateLimitRps: 10,
            rateLimitBurst: 20
          }
        })
      });
      return;
    }

    if (apiPath === "/v1/analyses/stats") {
      await route.fulfill({
        json: createEnvelope({
          total: 1,
          bySeverity: { critical: 0, high: 1, medium: 0, low: 0 },
          byConfidence: { high: 1, medium: 0, low: 0 },
          topAffectedServices: [{ service: "checkout-service", count: 1 }],
          trendBuckets: [{ bucketStart: createdAt, count: 1 }]
        })
      });
      return;
    }

    if (apiPath === "/v1/analyses" && request.method() === "GET") {
      await route.fulfill({ json: createEnvelope({ items: [analysisResult] }) });
      return;
    }

    if (apiPath === "/v1/analyses" && request.method() === "POST") {
      await route.fulfill({
        status: 202,
        json: createEnvelope({
          jobId,
          status: "pending",
          statusUrl: `/v1/jobs/${jobId}`
        })
      });
      return;
    }

    if (apiPath === `/v1/jobs/${jobId}`) {
      await route.fulfill({
        json: createEnvelope({
          jobId,
          status: "completed",
          phase: "done",
          progressPercent: 100,
          analysisId,
          analysisUrl: `/v1/analyses/${analysisId}`,
          attempt: 1,
          createdAt,
          startedAt: createdAt,
          phaseStartedAt: createdAt,
          finishedAt: createdAt
        })
      });
      return;
    }

    if (apiPath === `/v1/analyses/${analysisId}`) {
      await route.fulfill({ json: createEnvelope(analysisResult) });
      return;
    }

    await route.fulfill({
      status: 404,
      json: createEnvelope({
        code: "not_found",
        message: `Unhandled E2E mock route: ${request.method()} ${apiPath}`
      })
    });
  });
}

test("runs a mocked analysis and opens the result", async ({ page }) => {
  await mockObservAiApi(page);

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Analysis dashboard" })).toBeVisible();
  await expect(page.getByText("Payment checkout latency increased")).toBeVisible();

  await page.getByRole("link", { name: "Run analysis" }).click();
  await page.waitForURL("**/analyses/new", { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Analysis workspace" })).toBeVisible();

  await page.getByLabel("Goal").fill("Investigate checkout latency after the payment release.");
  await page.getByLabel("Affected services").fill("checkout-service, payment-service");
  await page.getByLabel("Context").fill("Release 2026.05.13 touched payment adapter retries.");
  await page.getByRole("button", { name: "Run analysis" }).click();

  await expect(page).toHaveURL(new RegExp(`/analyses/${analysisId}$`));
  await expect(page.getByRole("heading", { name: "Analysis result" })).toBeVisible();
  await expect(page.getByText("Payment dependency regression")).toBeVisible();
  await expect(page.getByText("Rollback the payment adapter deployment")).toBeVisible();
  await expect(page.getByLabel("Analysis sections").getByRole("link", { name: "Evidence" })).toBeVisible();
});
