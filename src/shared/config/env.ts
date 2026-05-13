const defaultApiUrl = "/api/observai";

export const appConfig = {
  apiUrl: process.env.NEXT_PUBLIC_OBSERVAI_API_URL ?? defaultApiUrl,
  apiTargetUrl: process.env.NEXT_PUBLIC_OBSERVAI_API_TARGET_URL ?? "http://localhost:8080",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "ObservAI",
  appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "local"
};
