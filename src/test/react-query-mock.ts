import { vi } from "vitest";

export const queryResults: Record<string, any> = {};

export const queryClientMock = {
  invalidateQueries: vi.fn(),
  refetchQueries: vi.fn(),
  setQueryData: vi.fn(),
  getQueryData: vi.fn(() => undefined),
};

const callOptions = (options: any, vars: any, result: any, error: unknown) => {
  if (error) {
    options.onError?.(error);
    options.onSettled?.(undefined, error, vars, undefined);
  } else {
    options.onSuccess?.(result, vars, undefined);
    options.onSettled?.(result, null, vars, undefined);
  }
};

const toKeyArray = (queryKey: unknown): unknown[] =>
  Array.isArray(queryKey) ? queryKey : queryKey != null ? [queryKey] : [];

const useQueryMock = (options: any) => {
  try {
    options?.queryFn?.();
  } catch {
    // ignore synchronous queryFn errors
  }
  const qk = toKeyArray(options?.queryKey);
  const key = String(qk[0]);
  const jsonKey = JSON.stringify(qk);
  const found = queryResults[key] ?? queryResults[jsonKey];
  return { data: undefined, isLoading: false, ...(found ?? {}) };
};

const useMutationMock = (options: any) => {
  const mutate = (vars?: any) => {
    try {
      const res = options.mutationFn(vars);
      Promise.resolve(res)
        .then((r: any) => callOptions(options, vars, r, null))
        .catch((e: unknown) => callOptions(options, vars, undefined, e));
    } catch (e) {
      callOptions(options, vars, undefined, e);
    }
  };
  const mutateAsync = (vars?: any) => {
    mutate(vars);
    return Promise.resolve(undefined);
  };
  return { mutate, mutateAsync, isPending: false, reset: vi.fn() };
};

export const reactQueryMock = {
  useQuery: useQueryMock,
  useMutation: useMutationMock,
  useQueryClient: () => queryClientMock,
};

export const reactQueryFactory = async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return { ...actual, ...reactQueryMock };
};