export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appearance: {
    theme: 'dark',
    showWalletLoginFirst: false,
  },
  loginMethods: [
    'email',
    'sms',
    'google',
    'apple',
    'twitter',
    'discord',
    'github',
    'linkedin',
    'tiktok',
    'farcaster',
    'telegram',
    'wallet',
  ],
  oauthMode: 'popup',
} as const; 