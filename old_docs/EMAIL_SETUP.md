# Email Notification Setup Guide

This guide walks you through setting up email notifications for comment alerts in your Gotcha app.

## 1. Set Up Resend Email Service

### Create Resend Account
1. Go to [Resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Get API Key
1. In Resend Dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name like "Gotcha Notifications"
4. Copy the API key and add to your `.env.local`:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```

### Verify Domain (Production)
For production, you'll need to verify your domain:
1. In Resend Dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Follow DNS verification steps
5. Update your `.env.local`:
   ```
   RESEND_FROM_EMAIL=Gotcha <notifications@yourdomain.com>
   ```

For development, you can use Resend's test domain:
```
RESEND_FROM_EMAIL=Gotcha <onboarding@resend.dev>
```

## 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Resend Configuration
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=Gotcha <notifications@yourdomain.com>

# Webhook Security (generate a secure random string)
SUPABASE_WEBHOOK_SECRET=your_secure_random_string_here

# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your domain in production
```

## 3. Run Database Migration

Execute the notification settings migration:

```sql
-- In Supabase SQL Editor, run:
ALTER TABLE profiles 
ADD COLUMN notification_email TEXT,
ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_notifications ON profiles(notifications_enabled) WHERE notifications_enabled = true;
```

Or run the migration file:
```bash
# Apply the migration
psql -h your-supabase-host -U postgres -d postgres -f scripts/014_add_notification_settings.sql
```

## 4. Set Up Supabase Webhook

### Create Webhook in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Webhooks**
3. Click **Create a new webhook**

### Configure Webhook Settings
- **Name**: `New Comment Notification`
- **Table**: `comments`
- **Events**: Check **Insert** only
- **Type**: `HTTP Request`
- **Method**: `POST`
- **URL**: `https://yourdomain.com/api/webhooks/new-comment` (or `http://localhost:3000/api/webhooks/new-comment` for dev)
- **Headers**: Leave default
- **Timeout**: 5000ms

### Test the Webhook
1. Save the webhook configuration
2. Make a test comment on a post
3. Check your server logs to see if the webhook was received

## 5. Test Email Notifications

### Setup Test User
1. Create a test user account
2. Go to Profile Settings
3. Add a notification email address
4. Enable notifications

### Test Flow
1. Create a test post with the first user
2. Login as a second user
3. Comment on the first user's post
4. Check the notification email inbox

## 6. Troubleshooting

### Common Issues

**Webhook not triggering:**
- Check webhook URL is accessible
- Verify webhook signature validation
- Check Supabase webhook logs

**Emails not sending:**
- Verify Resend API key is correct
- Check domain verification status
- Review email content for compliance

**Database errors:**
- Ensure migration was applied correctly
- Check profile table has new columns
- Verify foreign key relationships

### Debug Mode
Add this to your webhook handler for debugging:
```typescript
console.log("Webhook received:", JSON.stringify(webhookData, null, 2))
```

### Production Checklist
- [ ] Domain verified with Resend
- [ ] Environment variables set correctly
- [ ] Webhook URL uses HTTPS
- [ ] Database migration applied
- [ ] Test email flow works
- [ ] Webhook signature validation enabled

## 7. Email Template Customization

You can customize the email template in `/app/api/webhooks/new-comment/route.ts`:

```typescript
html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <!-- Customize your email template here -->
  </div>
`
```

## Security Notes

- Always validate webhook signatures in production
- Use HTTPS for webhook URLs
- Keep your Resend API key secure
- Generate a strong webhook secret
- Regularly rotate API keys
