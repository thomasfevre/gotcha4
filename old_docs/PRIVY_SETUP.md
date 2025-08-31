# Gotcha - Privy Integration Setup

This project has been updated to use Privy for authentication instead of the mock auth system.

## Setup Instructions

1. **Create a Privy Account**
   - Go to [Privy Dashboard](https://dashboard.privy.io/)
   - Create a new app
   - Get your App ID and App Secret

2. **Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Privy credentials:
     ```
     NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
     PRIVY_APP_SECRET=your_privy_app_secret_here
     ```

3. **What Changed**
   - Replaced `MockAuthProvider` with `PrivyProvider`
   - Updated `useAuth` hook to use Privy's `usePrivy` hook
   - Updated API routes to verify Privy JWT tokens
   - Added wagmi integration for Web3 support

## Key Files Modified

- `providers/privy-provider.tsx` - New Privy provider setup
- `providers/providers.tsx` - Updated to use Privy instead of mock auth
- `hooks/use-auth.ts` - Updated to use Privy hooks
- `lib/privy.ts` - Privy configuration
- `lib/wagmiConfig.ts` - Wagmi configuration for Web3
- `lib/auth.ts` - Updated token verification for Privy JWTs
- `app/api/auth/sync-user/route.ts` - Updated to verify Privy tokens
- `components/connect-button.tsx` - New connect button component

## Usage

The authentication flow remains the same from the user's perspective:
1. User clicks "Get Started" on the home page
2. Privy login modal opens with various auth options (email, social, wallet)
3. After authentication, user is redirected to username setup or feed

The main difference is that users now have access to multiple login methods including:
- Email
- SMS
- Social logins (Google, Apple, Twitter, etc.)
- Wallet connections
- And more

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.
