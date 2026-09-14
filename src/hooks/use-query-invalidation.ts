import { useQueryClient } from "@tanstack/react-query";

type InvalidationConfig = {
  exact?: boolean;
  refetchType?: "active" | "inactive" | "all";
};

export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateQueries = async (
    queryKeys: string[] | string[][],
    config?: InvalidationConfig
  ) => {
    if (queryKeys.every((el) => typeof el === "string")) {
      queryClient.invalidateQueries({
        queryKey: queryKeys,
        exact: config?.exact,
        refetchType: config?.refetchType,
      });
    } else
      await Promise.all(
        queryKeys.map((key) =>
          queryClient.invalidateQueries({
            queryKey: key,
            exact: config?.exact,
            refetchType: config?.refetchType,
          })
        )
      );
  };

  return { invalidateQueries };
};
