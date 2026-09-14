export type ApiResponse<T> = {
  data: T;
  message?: string;
  status: number;
};

export type QueryConfig<T> = {
  staleTime?: number;
  enabled?: boolean;
  select?: (data: ApiResponse<T>) => T;
};

export type MutationConfig<TData, TVariables> = {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
};
