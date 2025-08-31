'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';

export function ConnectButton() {
  const { login, logout, authenticated, user } = usePrivy();

  if (authenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user.email?.address || (user.wallet?.address.slice(0, 6) + '...' + user.wallet?.address.slice(-4))}
        </span>
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={login}
      className="neu-flat hover:neu-inset transition-all duration-200"
    >
      Connect
    </Button>
  );
}
