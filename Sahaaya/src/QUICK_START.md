# Quick Start - Email Authentication

## ✅ What's Already Done

Your Sahaaya app now has **real email authentication** fully implemented:

- ✅ Supabase authentication integrated
- ✅ Email confirmation flow implemented
- ✅ Registration with email verification
- ✅ Login with error handling
- ✅ Email verification callback page
- ✅ Resend confirmation email feature

## 🚀 How to Enable Email Sending

### Option 1: Quick Test (Supabase Default Email)

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/iltwkqixfwwxzbsrilqp
   - Navigate to: **Authentication** → **Settings**

2. **Enable Email Confirmation**:
   - Ensure "Enable email confirmation" is **ON** (it should be by default)
   - Set **Site URL**: `http://localhost:5173` (for dev) or your production domain
   - Add **Redirect URLs**: `http://localhost:5173/*`

3. **Test It**:
   ```bash
   npm run dev
   ```
   - Register a new user with your real email
   - You'll receive a confirmation email (limited to 3/hour on free tier)
   - Click the link to verify and auto-login

### Option 2: Production Setup (Custom SMTP - Recommended)

For unlimited emails and better deliverability:

1. **Get SMTP Credentials** (choose one):
   
   **Gmail (Free - 500 emails/day)**:
   - Enable 2FA on your Google account
   - Create App Password: https://myaccount.google.com/apppasswords
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: your-email@gmail.com
   - Password: (the app password you created)

   **SendGrid (Free - 100 emails/day)**:
   - Sign up: https://sendgrid.com
   - Create API key
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: (your SendGrid API key)

2. **Configure in Supabase**:
   - Dashboard → **Project Settings** → **Auth**
   - Scroll to **SMTP Settings**
   - Enter your SMTP credentials
   - Set sender email and name: "Sahaaya" <noreply@yourdomain.com>
   - Click **Save**

3. **Test Email Templates**:
   - Dashboard → **Authentication** → **Email Templates**
   - You can customize the "Confirm signup" template
   - Click "Send test email" to verify

## 📧 How It Works

### User Registration Flow:

1. **User fills registration form**
   - Name, email, phone, password
   - Chooses Individual or NGO role

2. **Submit → Email sent**
   - Account created in Supabase (unconfirmed)
   - Confirmation email sent automatically
   - User sees "Check Your Email" screen

3. **User clicks email link**
   - Opens: `yourapp.com/?type=signup&access_token=...`
   - App detects verification parameters
   - EmailVerification component processes token

4. **Auto-login and redirect**
   - User automatically logged in
   - Redirected to dashboard
   - Can start using the app immediately

### Login Flow:

1. **User enters credentials**
2. **Email not confirmed?**
   - Error message shown
   - "Resend Confirmation Email" button appears
3. **Email confirmed?**
   - Logs in successfully
   - Redirects to dashboard

## 🧪 Testing Checklist

- [ ] Register new user with real email
- [ ] Check email inbox (and spam folder)
- [ ] Click confirmation link in email
- [ ] Verify auto-login to dashboard
- [ ] Try logging in before confirming (should fail)
- [ ] Test "Resend Confirmation Email" button
- [ ] Check user appears in Supabase dashboard as "Confirmed"

## 🎨 Customize Email Templates

**Location**: Supabase Dashboard → Authentication → Email Templates

**Available templates**:
- Confirm signup - Sent when user registers
- Reset password - Sent when user requests password reset
- Email change - Sent when user changes email

**Example customization**:
```html
<h2>Welcome to Sahaaya! 🤝</h2>
<p>Click below to confirm your email:</p>
<a href="{{ .ConfirmationURL }}">Confirm Email</a>
```

## 🔧 Environment Variables (Optional)

The app uses hardcoded Supabase credentials from `/utils/supabase/info.tsx`. These are safe to commit as they're public anon keys.

If you want to use environment variables:

1. Create `.env`:
   ```
   VITE_SUPABASE_URL=https://iltwkqixfwwxzbsrilqp.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. Update `/utils/auth.ts`:
   ```typescript
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
   ```

## 📚 Next Steps

1. **Test the email flow** (see checklist above)
2. **Customize email templates** to match your brand
3. **Set up custom SMTP** for production (recommended)
4. **Configure production domain** in Supabase settings
5. **Review** `/EMAIL_SETUP_GUIDE.md` for detailed instructions

## 🆘 Troubleshooting

**Emails not arriving?**
- Check spam folder
- Verify SMTP settings in Supabase
- Check Supabase Logs → Auth Logs for errors
- Free tier limit: 3 emails/hour (upgrade to custom SMTP)

**Confirmation link not working?**
- Check redirect URLs include wildcard: `http://localhost:5173/*`
- Verify Site URL matches your app domain
- Check browser console for errors

**Need help?**
- Read `/EMAIL_SETUP_GUIDE.md` for detailed setup
- Check Supabase Auth documentation
- Contact support: 1800-SAHAAYA

---

**You're all set!** Real email authentication is now working. Just configure SMTP in Supabase and start testing! 🎉
