'use client';

import { usePrivy } from '@privy-io/react-auth';

export function ConnectButton() {
  const { login, logout, authenticated, user } = usePrivy();

  if (authenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
          {user.wallet?.address.slice(0, 6)}...{user.wallet?.address.slice(-4)}
        </span>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      Connect Wallet
    </button>
  );
} 