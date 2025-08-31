import { mainnet } from 'viem/chains';
import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';

export const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
}); 