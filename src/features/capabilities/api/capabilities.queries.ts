import { useQuery } from "@tanstack/react-query";

import { getCapabilities } from "@/features/capabilities/api/capabilities.client";

export const capabilitiesQueryKeys = {
  all: ["capabilities"] as const,
  detail: () => [...capabilitiesQueryKeys.all, "detail"] as const
};

export function useCapabilitiesQuery() {
  return useQuery({
    queryKey: capabilitiesQueryKeys.detail(),
    queryFn: getCapabilities,
    staleTime: 60_000
  });
}
