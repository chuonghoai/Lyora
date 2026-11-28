import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { clearClientSessionArtifacts, TokenStorage } from '@/core/storage';
import { ToastContainer } from '@/core/toast';
import { ErrorBoundary } from './ErrorBoundary';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes default cache as required by architecture
            gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  useEffect(() => {
    return TokenStorage.onAuthChange((event) => {
      if (event === 'logout') {
        void queryClient.cancelQueries();
        queryClient.clear();
        clearClientSessionArtifacts();
      }
    });
  }, [queryClient]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
