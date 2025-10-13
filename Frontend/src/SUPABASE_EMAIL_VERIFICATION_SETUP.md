# Supabase Email Verification Configuration Guide

## Complete Setup for Production Email Verification

This guide provides step-by-step instructions to fix email verification issues where links redirect to localhost instead of your production domain.

### 1. Supabase Project Configuration

#### A. Site URL Configuration
1. Go to your Supabase Dashboard → Project Settings → General
2. Set the **Site URL** to your production domain:
   ```
   https://your-domain.com
   ```
   OR for testing:
   ```
   https://your-app-name.netlify.app
   https://your-app-name.vercel.app
   ```

#### B. Redirect URLs Configuration
1. Go to Authentication → URL Configuration
2. Add your domain to **Redirect URLs**:
   ```
   https://your-domain.com/**
   https://your-domain.com/verify-email
   https://your-domain.com/dashboard
   ```
   
   For development, also add:
   ```
   http://localhost:3000/**
   http://localhost:3000/verify-email
   ```

#### C. OAuth Provider Configuration (Google)
1. Go to Authentication → Providers → Google
2. Enable Google provider
3. Add your domain to **Authorized redirect URIs** in Google Cloud Console:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```

### 2. Email Template Configuration

#### A. Confirmation Email Template
1. Go to Authentication → Email Templates → Confirm signup
2. Replace the default template with:

```html
<h2>Welcome to Sahaaya!</h2>
<p>Hi {{ .Email }},</p>
<p>Thank you for signing up to Sahaaya - your community help platform.</p>
<p>Click the link below to confirm your account:</p>
<p><a href="{{ .SiteURL }}/verify-email?token_hash={{ .TokenHash }}&type=signup">Confirm your account</a></p>
<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p>{{ .SiteURL }}/verify-email?token_hash={{ .TokenHash }}&type=signup</p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't create an account with Sahaaya, please ignore this email.</p>
<p>Best regards,<br>The Sahaaya Team</p>
```

#### B. Magic Link Template (Optional)
1. Go to Authentication → Email Templates → Magic Link
2. Update if you plan to use magic links:

```html
<h2>Sign in to Sahaaya</h2>
<p>Hi {{ .Email }},</p>
<p>Click the link below to sign in to your Sahaaya account:</p>
<p><a href="{{ .SiteURL }}/verify-email?token_hash={{ .TokenHash }}&type=magiclink">Sign in to Sahaaya</a></p>
<p>This link will expire in 1 hour.</p>
<p>Best regards,<br>The Sahaaya Team</p>
```

### 3. Environment Variables

Ensure your production environment has these variables:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Frontend Implementation Details

The application now includes:

#### A. EmailVerification Component (`/components/EmailVerification.tsx`)
- Handles email confirmation tokens from URL parameters
- Supports both `signup` and `email_change` verification types
- Provides user-friendly error handling and retry options
- Automatically redirects to dashboard after successful verification

#### B. Updated App.tsx Routing
- Detects verification URLs automatically
- Routes to verification component when needed
- Handles both token-based and OAuth flows

#### C. Enhanced Registration Flow
- Shows confirmation screen after registration
- Provides clear instructions for email verification
- Includes helpful guidance for rural/less tech-savvy users

### 5. Testing the Setup

#### A. Local Testing
1. Update your Supabase Site URL to include localhost for testing:
   ```
   http://localhost:3000
   ```
2. Test registration and verify emails work with localhost links

#### B. Production Testing
1. Deploy your application
2. Update Supabase Site URL to your production domain
3. Test complete registration → email → verification → login flow

### 6. Common Issues and Solutions

#### Issue 1: Emails still link to localhost
**Solution:** 
- Double-check Site URL in Supabase Dashboard
- Clear browser cache and cookies
- Wait 5-10 minutes for changes to propagate

#### Issue 2: "Invalid or expired token" errors
**Solution:**
- Ensure URL parameters are being passed correctly
- Check that token_hash is not being modified by URL routing
- Verify email template uses correct token parameter: `{{ .TokenHash }}`

#### Issue 3: OAuth redirects not working
**Solution:**
- Verify redirect URLs include your domain
- Check Google Cloud Console OAuth configuration
- Ensure OAuth provider is enabled in Supabase

#### Issue 4: Users can't verify on mobile
**Solution:**
- Ensure your app is responsive
- Test email links on actual mobile devices
- Consider deep linking for mobile apps

### 7. Security Considerations

1. **HTTPS Only in Production:**
   - Always use HTTPS for production domains
   - Update Site URL to use https://

2. **Redirect URL Validation:**
   - Only add trusted domains to redirect URLs
   - Avoid using wildcards in production

3. **Token Expiration:**
   - Verification tokens expire in 24 hours by default
   - Implement resend functionality for expired tokens

### 8. Monitoring and Debugging

#### A. Supabase Dashboard Logs
- Check Authentication → Users for verification status
- Monitor Authentication → Logs for error details

#### B. Browser Developer Tools
- Check Network tab for API calls
- Monitor Console for JavaScript errors
- Verify URL parameters are correct

#### C. Email Debugging
- Test with multiple email providers (Gmail, Outlook, etc.)
- Check spam folders
- Verify email template variables are rendering correctly

### 9. Production Deployment Checklist

- [ ] Site URL updated to production domain
- [ ] Redirect URLs include production domain
- [ ] Email templates use correct Site URL variable
- [ ] OAuth providers configured for production
- [ ] Environment variables set correctly
- [ ] HTTPS enabled
- [ ] Email verification flow tested end-to-end
- [ ] Mobile verification tested
- [ ] Error handling tested (expired tokens, invalid links)

### 10. Support Resources

- **Supabase Documentation:** https://supabase.com/docs/guides/auth
- **OAuth Setup:** https://supabase.com/docs/guides/auth/social-login
- **Email Templates:** https://supabase.com/docs/guides/auth/auth-email-templates

For additional help, users can contact the Sahaaya support helpline at **1800-SAHAAYA**.