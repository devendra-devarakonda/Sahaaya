# Supabase Email Configuration Guide

## 📍 Step-by-Step Configuration

### 1. Access Your Supabase Project

🔗 **Direct Link**: https://supabase.com/dashboard/project/iltwkqixfwwxzbsrilqp

### 2. Configure Authentication Settings

#### A. Navigate to Authentication Settings
```
Dashboard → Authentication → Settings
```

#### B. Email Auth Configuration

**Site URL** (Required):
- Development: `http://localhost:5173`
- Production: `https://yourdomain.com`

**Redirect URLs** (Required - Add these):
- Development: `http://localhost:5173/**`
- Production: `https://yourdomain.com/**`

**Email Settings**:
- ✅ Enable email confirmation: **ON**
- ✅ Enable email change confirmation: **ON**
- ✅ Secure email change: **ON**

#### C. Apply Changes
Click **Save** at the bottom of the page.

---

### 3. Configure SMTP (Email Sending)

#### Option A: Use Supabase Default (Quick Test)
- **Pros**: Works immediately, no setup
- **Cons**: Limited to 3 emails/hour on free tier
- **Best for**: Testing and development

✅ **No configuration needed** - emails will be sent automatically!

#### Option B: Custom SMTP (Recommended for Production)

##### Navigate to SMTP Settings:
```
Dashboard → Project Settings → Auth → SMTP Settings
```

##### For Gmail (Free - 500 emails/day):

1. **Enable 2-Factor Authentication** on your Google account
2. **Create App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Type "Sahaaya"
   - Copy the 16-character password

3. **Enter in Supabase**:
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP Username: your-email@gmail.com
   SMTP Password: [16-char app password]
   Sender Email: your-email@gmail.com
   Sender Name: Sahaaya Platform
   ```

##### For SendGrid (Free - 100 emails/day):

1. **Sign up** at https://sendgrid.com
2. **Create API Key**:
   - Dashboard → Settings → API Keys
   - Click "Create API Key"
   - Name: "Sahaaya"
   - Permissions: "Full Access"
   - Copy the API key

3. **Enter in Supabase**:
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP Username: apikey
   SMTP Password: [Your SendGrid API Key]
   Sender Email: noreply@yourdomain.com
   Sender Name: Sahaaya
   ```

##### For Other Providers:

**Mailgun** (5,000 emails/month free):
```
Host: smtp.mailgun.org
Port: 587
```

**Amazon SES** (Pay as you go - $0.10/1000 emails):
```
Host: email-smtp.region.amazonaws.com
Port: 587
```

**Postmark** (100 emails/month free):
```
Host: smtp.postmarkapp.com
Port: 587
```

---

### 4. Customize Email Templates

#### Navigate to Email Templates:
```
Dashboard → Authentication → Email Templates
```

#### Available Templates:

1. **Confirm Signup** - Sent when users register
2. **Reset Password** - Sent for password recovery
3. **Email Change** - Sent when changing email

#### Customize "Confirm Signup" Template:

Click **Edit** on "Confirm signup" template and replace with:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Confirm Your Sahaaya Account</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #41695e 0%, #033b4a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🤝 Welcome to Sahaaya!</h1>
  </div>
  
  <!-- Body -->
  <div style="background: #f9fefa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi <strong>{{ .Data.name }}</strong>,
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for joining <strong>Sahaaya</strong> - the community help and resource platform where neighbors help neighbors! 🌟
    </p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      Please confirm your email address to activate your account and start making a difference in your community:
    </p>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; 
                padding: 15px 40px; 
                background-color: #41695e; 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
                font-size: 18px;
                font-weight: bold;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Confirm Email Address
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 12px; color: #41695e; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
      {{ .ConfirmationURL }}
    </p>
    
    <!-- What's Next -->
    <div style="background: #e8f5f0; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #41695e;">
      <h3 style="margin-top: 0; color: #033b4a;">What's next?</h3>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Browse help requests in your area</li>
        <li style="margin-bottom: 8px;">Offer help to those in need</li>
        <li style="margin-bottom: 8px;">Connect with local NGOs and volunteers</li>
        <li style="margin-bottom: 8px;">Track the impact you make</li>
      </ul>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
        If you didn't create this account, you can safely ignore this email.
      </p>
      <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
        <strong>Need help?</strong> Call our helpline: <strong style="color: #41695e;">1800-SAHAAYA</strong>
      </p>
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Best regards,<br>
        <strong style="color: #033b4a;">The Sahaaya Team</strong>
      </p>
    </div>
  </div>
  
</body>
</html>
```

#### Test Email Template:

1. Click **Send test email** button
2. Enter your email address
3. Check your inbox
4. Click **Save** when satisfied

---

### 5. Verify Configuration

#### Check Authentication is Working:

1. **Run your app**:
   ```bash
   npm install  # if you haven't already
   npm run dev
   ```

2. **Open**: http://localhost:5173

3. **Register new user**:
   - Click "Get Started"
   - Choose role (Individual/NGO)
   - Fill registration form
   - Use a real email address you can access

4. **Check email**:
   - Check inbox (and spam folder)
   - Should receive email within seconds
   - Click confirmation link

5. **Verify login**:
   - Should be automatically logged in
   - Redirected to dashboard

#### Check Supabase Dashboard:

```
Dashboard → Authentication → Users
```

You should see:
- New user listed
- Email status: **Confirmed** (after clicking link)
- Created timestamp

---

### 6. Production Deployment Checklist

When deploying to production:

- [ ] Update **Site URL** to production domain
- [ ] Add production domain to **Redirect URLs**
- [ ] Configure **Custom SMTP** (recommended)
- [ ] Test email flow on production
- [ ] Set up **custom domain** for emails (optional)
- [ ] Configure **SPF/DKIM** records for better deliverability
- [ ] Test **spam score** of emails
- [ ] Monitor email delivery in SMTP provider dashboard

---

### 7. Advanced Configuration (Optional)

#### Rate Limiting:
```
Authentication → Rate Limits
```
- Adjust login attempt limits
- Configure email sending limits

#### User Management:
```
Authentication → Users
```
- View all registered users
- Manually verify emails
- Delete or ban users
- Reset passwords

#### Auth Hooks (Advanced):
```
Authentication → Hooks
```
- Add custom logic after signup
- Validate user data
- Send to external systems

---

## 🧪 Testing Checklist

Use this checklist to verify everything works:

### Registration Flow:
- [ ] User can fill registration form
- [ ] Validation works (password requirements, etc.)
- [ ] Form submits successfully
- [ ] "Check Your Email" screen appears
- [ ] Email arrives within 30 seconds
- [ ] Email template looks correct
- [ ] Confirmation link works
- [ ] User automatically logged in
- [ ] Redirects to dashboard
- [ ] User data correct in dashboard

### Login Flow:
- [ ] Can login with confirmed account
- [ ] Correct error if password wrong
- [ ] Error message if email not confirmed
- [ ] "Resend Email" button appears
- [ ] Resend email works
- [ ] Password reset works (if implemented)

### Edge Cases:
- [ ] Email in spam folder still works
- [ ] Clicking confirmation link twice doesn't break
- [ ] Expired links show helpful error
- [ ] Already registered email shows error
- [ ] Invalid email format rejected

---

## 🆘 Common Issues & Solutions

### Issue: Emails not arriving

**Solution 1**: Check Supabase Logs
```
Dashboard → Logs → Auth Logs
```
Look for email sending errors

**Solution 2**: Check Email Limits
- Default Supabase: 3 emails/hour
- Upgrade to custom SMTP

**Solution 3**: Check Spam Folder
- Emails might be marked as spam
- Configure SPF/DKIM records

### Issue: "Email not confirmed" error

**Solution**: User didn't click confirmation link
- Resend email using "Resend Confirmation" button
- Check spam folder
- Manually confirm in Supabase dashboard

### Issue: Confirmation link expired

**Solution**: Links expire after 24 hours
- Register again, or
- Request new confirmation email

### Issue: Redirect URL mismatch

**Solution**: Add all possible URLs to Redirect URLs:
- `http://localhost:5173/**`
- `https://yourdomain.com/**`
- Include wildcards (`**`)

---

## 📊 Monitoring Email Delivery

### Supabase Dashboard:
```
Logs → Auth Logs
```
- View email sending attempts
- See delivery status
- Check for errors

### SMTP Provider Dashboard:
- **Gmail**: Check Sent folder
- **SendGrid**: Dashboard → Activity Feed
- **Mailgun**: Logs → Sending
- **Amazon SES**: Check sending statistics

---

## 🎯 Quick Links

- **Your Supabase Dashboard**: https://supabase.com/dashboard/project/iltwkqixfwwxzbsrilqp
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Email Templates Docs**: https://supabase.com/docs/guides/auth/auth-email-templates
- **SMTP Setup Guide**: https://supabase.com/docs/guides/auth/auth-smtp

---

**You're all set!** Follow this guide step by step, and your email authentication will be fully functional. 🚀
