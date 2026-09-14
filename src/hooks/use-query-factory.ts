import {
  useQuery,
  useMutation,
  QueryKey,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ApiResponse, QueryConfig, MutationConfig } from "../types/api";
import { errorMessageHandler } from "../lib/error-handler";

export function query<TResponse, TParams extends any[] = []>(
  queryKey: (...params: TParams) => QueryKey,
  queryFn: (...params: TParams) => Promise<ApiResponse<TResponse>>,
  defaultConfig: QueryConfig<TResponse> = {}
) {
  return (...params: TParams) => {
    const query = useQuery({
      queryKey: queryKey(...params),
      queryFn: () => queryFn(...params),
      staleTime: defaultConfig.staleTime,
      enabled: defaultConfig.enabled,
      select: defaultConfig.select || ((response) => response.data),
    } as UseQueryOptions<ApiResponse<TResponse>, AxiosError, TResponse>);

    return {
      ...query,
      data: query.data as TResponse,
    };
  };
}

export function mutate<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  defaultConfig: MutationConfig<TData, TVariables> = {}
) {
  return (config: MutationConfig<TData, TVariables> = {}) => {
    return useMutation({
      mutationFn: async (variables) => {
        const response = await mutationFn(variables);
        return response.data;
      },
      onSuccess: (data, variables) => {
        defaultConfig.onSuccess?.(data, variables);
        config.onSuccess?.(data, variables);
      },
      onError: (error: Error, variables) => {
        errorMessageHandler(error)
        defaultConfig.onError?.(error, variables);
        config.onError?.(error, variables);
      },
    } as UseMutationOptions<TData, AxiosError, TVariables>);
  };
}
