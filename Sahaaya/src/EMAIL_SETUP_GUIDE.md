# Email Authentication Setup Guide for Sahaaya

This guide will help you configure real email authentication so users receive confirmation emails when they register.

## Prerequisites

You already have:
- ✅ Supabase project connected (Project ID: `iltwkqixfwwxzbsrilqp`)
- ✅ Supabase client configured in the app
- ✅ Email verification flow implemented in the code

## Steps to Enable Email Confirmation

### 1. Configure Email Settings in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/iltwkqixfwwxzbsrilqp

2. Navigate to **Authentication** → **Email Templates**

3. **Confirm signup template**:
   - This email is sent when a user registers
   - You can customize the template with your branding
   - Make sure the confirmation link is included: `{{ .ConfirmationURL }}`

### 2. Configure Authentication Settings

1. In Supabase Dashboard, go to **Authentication** → **Settings**

2. **Email Auth Settings**:
   - ✅ Enable email confirmation (should be ON)
   - Set **Site URL**: `https://your-app-domain.com` (or `http://localhost:5173` for development)
   - Set **Redirect URLs**: Add your app's URL to the allowed list
     - For development: `http://localhost:5173/*`
     - For production: `https://your-app-domain.com/*`

3. **Email Configuration**:
   - By default, Supabase uses their email service (limited to 3 emails per hour in free tier)
   - For production, configure a custom SMTP provider (see below)

### 3. Configure Custom SMTP (Recommended for Production)

For unlimited emails and better deliverability, set up custom SMTP:

1. In Supabase Dashboard, go to **Project Settings** → **Auth**

2. Scroll to **SMTP Settings**

3. Enter your SMTP credentials:
   - **SMTP Host**: e.g., `smtp.gmail.com` (for Gmail)
   - **SMTP Port**: `587` (TLS) or `465` (SSL)
   - **SMTP Username**: Your email address
   - **SMTP Password**: Your email password or app-specific password
   - **SMTP Sender Email**: The email address that will appear as sender
   - **SMTP Sender Name**: `Sahaaya` or your app name

#### Popular SMTP Providers:

**Gmail (Free tier - 500 emails/day)**:
- Host: `smtp.gmail.com`
- Port: `587`
- Enable "Less secure app access" or use App Password

**SendGrid (Free tier - 100 emails/day)**:
- Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey`
- Password: Your SendGrid API key

**Amazon SES (Pay as you go)**:
- Cost-effective for high volumes
- Excellent deliverability

**Mailgun (Free tier - 5,000 emails/month)**:
- Reliable service
- Good for production

### 4. Customize Email Templates (Optional)

Make your emails look professional and match your brand:

1. Go to **Authentication** → **Email Templates**

2. Edit the **Confirm signup** template:

```html
<h2>Welcome to Sahaaya! 🤝</h2>

<p>Hi {{ .Data.name }},</p>

<p>Thank you for joining Sahaaya, the community help and resource platform!</p>

<p>Please confirm your email address by clicking the button below:</p>

<p>
  <a href="{{ .ConfirmationURL }}" 
     style="display: inline-block; padding: 12px 24px; background-color: #41695e; color: white; text-decoration: none; border-radius: 6px;">
    Confirm Email Address
  </a>
</p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>Once confirmed, you'll be automatically logged in and can start:</p>
<ul>
  <li>Requesting help from your community</li>
  <li>Offering help to those in need</li>
  <li>Connecting with local NGOs</li>
</ul>

<p>If you didn't create this account, you can safely ignore this email.</p>

<p>Need help? Call our helpline: <strong>1800-SAHAAYA</strong></p>

<p>Best regards,<br>The Sahaaya Team</p>
```

### 5. Test Email Flow

1. **Development Testing**:
   ```bash
   npm run dev
   ```

2. **Register a new user**:
   - Go to http://localhost:5173
   - Click "Get Started" → Choose role → Register
   - Fill in the form with a real email address
   - Submit the form

3. **Check your email**:
   - You should receive a confirmation email
   - Click the confirmation link
   - You'll be redirected back to the app and automatically logged in

4. **Verify in Supabase**:
   - Go to **Authentication** → **Users**
   - Your new user should appear with status "Confirmed"

### 6. Production Deployment

When deploying to production:

1. **Update Site URL** in Supabase Auth settings:
   - Set to your production domain: `https://sahaaya.com`

2. **Update Redirect URLs**:
   - Add your production domain: `https://sahaaya.com/*`

3. **Environment Variables** (if needed):
   - The app uses hardcoded Supabase credentials from `/utils/supabase/info.tsx`
   - These are safe to commit as they're public client keys

4. **Test thoroughly**:
   - Register with a test email
   - Verify email confirmation works
   - Check spam folders if emails don't arrive

## How It Works

### Registration Flow:

1. **User registers** → Fills in the registration form
2. **Supabase creates user** → User account created but not confirmed
3. **Email sent** → Confirmation email sent to user's inbox
4. **User clicks link** → Opens the confirmation URL with token
5. **App verifies** → EmailVerification component processes the token
6. **User logged in** → Automatically logged in and redirected to dashboard

### Key Files:

- `/utils/auth.ts` - Supabase client configuration
- `/components/Register.tsx` - Registration form with email signup
- `/components/EmailVerification.tsx` - Handles email confirmation callback
- `/App.tsx` - Routes to verify-email page when confirmation link is clicked

## Troubleshooting

### Emails not being sent:

1. **Check Supabase email limits**:
   - Free tier: 3 emails/hour with default service
   - Solution: Set up custom SMTP

2. **Check spam folder**:
   - Emails might be marked as spam
   - Solution: Configure SPF/DKIM records for your domain

3. **Check Supabase logs**:
   - Go to **Logs** → **Auth Logs** in dashboard
   - Look for email sending errors

### Confirmation link not working:

1. **Check redirect URLs**:
   - Make sure your app URL is in the allowed list
   - Include wildcards: `http://localhost:5173/*`

2. **Check Site URL**:
   - Should match your app's domain

3. **Check browser console**:
   - Look for authentication errors
   - Verify the token is being processed

### User stuck on "Email not confirmed":

1. **Resend confirmation email**:
   - User needs to request a new confirmation link
   - Can be implemented with `supabase.auth.resend()`

2. **Manually confirm in dashboard**:
   - Go to **Authentication** → **Users**
   - Find the user and manually confirm email

## Additional Features

### Add "Resend Confirmation Email" button:

```typescript
const resendConfirmation = async () => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: userEmail
  });
  
  if (!error) {
    toast.success('Confirmation email resent! Check your inbox.');
  }
};
```

### Password Reset Flow:

Already implemented in Login component. To customize:
1. Edit **Reset Password** email template in Supabase
2. Update redirect URL to your password reset page

## Support

- **Supabase Documentation**: https://supabase.com/docs/guides/auth/auth-email
- **Sahaaya Support**: Call 1800-SAHAAYA
- **Issues**: Check Supabase Auth Logs in dashboard

---

**Your email authentication is now set up!** Users will receive real confirmation emails when they register. 🎉
