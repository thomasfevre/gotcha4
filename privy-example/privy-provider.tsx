'use client';

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { privyConfig } from '@/lib/privy';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmiConfig';

const queryClient = new QueryClient();

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProviderBase {...privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProviderBase>
  );
} 