import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { setAuthTokenGetter, getGetMeQueryKey } from "@workspace/api-client-react";

setAuthTokenGetter(() => localStorage.getItem("blixbet_token"));

export function hasAuthToken(): boolean {
  const token = localStorage.getItem("blixbet_token");
  return token !== null && token.length > 0;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: () => {},
  }),
  mutationCache: new MutationCache({
    onError: () => {},
  }),
  defaultOptions: {
    queries: {
      retry: false,
      throwOnError: false,
      staleTime: 20_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
});

queryClient.setQueryDefaults(getGetMeQueryKey(), {
  enabled: () => hasAuthToken(),
});
