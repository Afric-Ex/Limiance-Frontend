import { useQuery } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { normalizeApiKeyPermissions } from "@/src/lib/api-key-permissions";

export const useApiKeyPermissions = () =>
  useQuery({
    queryKey: userKeys.apiKeyPermissions,
    queryFn: () => userService.getApiKeyPermissions(),
    select: normalizeApiKeyPermissions,
    staleTime: 5 * 60 * 1000,
  });
