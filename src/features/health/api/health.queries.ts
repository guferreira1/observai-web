import { useQuery } from "@tanstack/react-query";

import { getHealth, getReadiness } from "@/features/health/api/health.client";

export const healthQueryKeys = {
  health: ["health"] as const,
  readiness: ["readiness"] as const
};

export function useHealthQuery() {
  return useQuery({
    queryKey: healthQueryKeys.health,
    queryFn: getHealth
  });
}

export function useReadinessQuery() {
  return useQuery({
    queryKey: healthQueryKeys.readiness,
    queryFn: getReadiness,
    refetchInterval: 10_000
  });
}
