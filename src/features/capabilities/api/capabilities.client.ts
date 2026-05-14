import { apiRequest } from "@/shared/api/http-client";
import { capabilitiesSchema } from "@/features/capabilities/api/capabilities.schemas";

export async function getCapabilities() {
  const response = await apiRequest({
    path: "/v1/capabilities",
    schema: capabilitiesSchema
  });

  return response;
}
