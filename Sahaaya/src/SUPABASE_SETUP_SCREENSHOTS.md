# 🖼️ Supabase Setup - Visual Guide

**Your Project**: https://supabase.com/dashboard/project/iltwkqixfwwxzbsrilqp

---

## 📍 Step 1: Navigate to Authentication Settings

### Where to click:

```
Supabase Dashboard
  └─ Left Sidebar
      └─ Click "Authentication" 🔐
          └─ Click "Settings" ⚙️
```

**Direct link**: https://supabase.com/dashboard/project/iltwkqixfwwxzbsrilqp/settings/auth

---

## 📍 Step 2: Configure Site URL

### What you'll see:

```
┌─────────────────────────────────────────┐
│  Site URL                               │
│  ┌─────────────────────────────────┐   │
│  │ http://localhost:5173           │   │ ← ENTER THIS
│  └─────────────────────────────────┘   │
│  The site URL for your app             │
└─────────────────────────────────────────┘
```

### What to enter:
- **Development**: `http://localhost:5173`
- **Production** (later): `https://yourdomain.com`

---

## 📍 Step 3: Configure Redirect URLs

### What you'll see:

```
┌─────────────────────────────────────────┐
│  Redirect URLs                          │
│  ┌─────────────────────────────────┐   │
│  │ http://localhost:5173/**        │   │ ← ADD THIS
│  └─────────────────────────────────┘   │
│  [+ Add URL]                            │ ← CLICK HERE
│                                         │
│  Allowed URLs for authentication        │
└─────────────────────────────────────────┘
```

### What to enter:
- `http://localhost:5173/**` ← **Important: Include `/**` at the end!**

### How to add:
1. Click the text field
2. Type: `http://localhost:5173/**`
3. Press **Enter** or click outside
4. Should appear in the list below

---

## 📍 Step 4: Email Settings

### What you'll see:

```
┌───────��─────────────────────────────────┐
│  Email Settings                         │
│                                         │
│  ☑️ Enable email confirmation           │ ← Should be ON
│  ☑️ Enable email change confirmation    │
│  ☑️ Secure email change                 │
│                                         │
└─────────────────────────────────────────┘
```

### What to check:
- ✅ "Enable email confirmation" should be **checked**
- ✅ Leave other settings as default

---

## 📍 Step 5: Save Changes

### Where to click:

```
┌─────────────────────────────────────────┐
│                                         │
│  [Scroll to bottom of page]             │
│                                         │
│  ┌───────────┐                          │
│  │   Save    │  ← CLICK THIS           │
│  └───────────┘                          │
│                                         │
└─────────────────────────────────────────┘
```

### Important:
- **Must click "Save"** at the bottom!
- Wait for success message
- If error appears, check your entries

---

## 📍 Step 6: Verify Settings (Optional)

### Check Users Tab:

```
Supabase Dashboard
  └─ Authentication
      └─ Users  ← CLICK HERE
```

**After testing**, you should see users listed here with status "Confirmed"

---

## 🎨 Optional: Customize Email Template

### Navigate to:

```
Supabase Dashboard
  └─ Authentication
      └─ Email Templates  ← CLICK HERE
```

### What you'll see:

```
┌─────────────────────────────────────────┐
│  Email Templates                        │
│                                         │
│  • Confirm signup        [Edit]         │ ← CLICK EDIT
│  • Invite user          [Edit]          │
│  • Magic Link           [Edit]          │
│  • Change Email         [Edit]          │
│  • Reset Password       [Edit]          │
│                                         │
└─────────────────────────────────────────┘
```

### Edit "Confirm signup":
1. Click **[Edit]** next to "Confirm signup"
2. Customize the HTML
3. **Important**: Keep `{{ .ConfirmationURL }}` in the template
4. Click **[Send test email]** to preview
5. Click **[Save]** when done

**Pre-made template**: See `/SUPABASE_CONFIGURATION.md` section 4

---

## 🔧 Optional: Custom SMTP (Production)

### Navigate to:

```
Supabase Dashboard
  └─ Project Settings (gear icon at bottom left)
      └─ Auth
          └─ SMTP Settings  ← SCROLL HERE
```

### What you'll see:

```
┌─────────────────────────────────────────┐
│  SMTP Settings                          │
│                                         │
│  Enable Custom SMTP Server  ☐           │ ← CHECK THIS
│                                         │
│  Host:     ┌──────────────────┐        │
│            │ smtp.gmail.com   │         │
│            └──────────────────┘         │
│                                         │
│  Port:     ┌──────┐                    │
│            │ 587  │                     │
│            └──────┘                     │
│                                         │
│  Username: ┌──────────────────┐        │
│            │ your@email.com   │         │
│            └──────────────────┘         │
│                                         │
│  Password: ┌──────────────────┐        │
│            │ ••••••••••••••   │         │
│            └──────────────────┘         │
│                                         │
│  Sender:   ┌──────────────────┐        │
│            │ noreply@app.com  │         │
│            └──────────────────┘         │
│                                         │
│  Name:     ┌──────────────────┐        │
│            │ Sahaaya          │         │
│            └──────────────────┘         │
│                                         │
│            [Save]                       │
└─────────────────────────────────────────┘
```

### For Gmail:
- Host: `smtp.gmail.com`
- Port: `587`
- Username: your Gmail address
- Password: App Password (not your regular password!)
- Sender: your Gmail address
- Name: `Sahaaya`

**See `/SUPABASE_CONFIGURATION.md` for detailed SMTP setup**

---

## ✅ Verification Checklist

After saving settings, verify:

### 1. Site URL is set:
```
✅ Site URL: http://localhost:5173
```

### 2. Redirect URLs include:
```
✅ http://localhost:5173/**
```

### 3. Email confirmation is enabled:
```
✅ Enable email confirmation: ON
```

### 4. Changes are saved:
```
✅ Green success message appeared
```

---

## 🧪 Test Your Configuration

### Quick Test:

1. **Run app**: `npm run dev`
2. **Register**: Use your real email
3. **Check email**: Should arrive in 5-30 seconds
4. **Click link**: Should log you in automatically

### Verify in Supabase:

1. Go to: **Authentication → Users**
2. Your test user should appear
3. Status: "Confirmed" ✅

---

## 📊 Common Screen Locations

### Quick Reference:

| Feature | Navigation Path |
|---------|----------------|
| **Auth Settings** | Authentication → Settings |
| **Email Templates** | Authentication → Email Templates |
| **Users List** | Authentication → Users |
| **SMTP Settings** | Project Settings → Auth |
| **Logs** | Logs → Auth Logs |
| **API Keys** | Project Settings → API |

---

## 🎯 What Each Setting Does

### Site URL:
- Where users are redirected after email confirmation
- Must match your app's domain
- Include protocol: `http://` or `https://`

### Redirect URLs:
- Allowed URLs for OAuth callbacks
- Protects against redirect attacks
- Must include wildcard: `/**`

### Email Confirmation:
- When ON: Users must verify email to login
- When OFF: Users can login immediately (not recommended)

### SMTP Settings:
- Default: Supabase sends emails (3/hour limit)
- Custom: Your SMTP provider sends (higher limits)

---

## 🆘 Troubleshooting Visual Guide

### If Save Button is Grayed Out:

```
Problem:
┌──────────────────┐
│      Save       │ ← Gray/Disabled
└──────────────────┘

Solutions:
1. Check all required fields are filled
2. Check for red error messages
3. Make sure you made a change
4. Try refreshing the page
```

### If Email Confirmation Toggle Won't Turn On:

```
Problem:
☐ Enable email confirmation ← Won't check

Solutions:
1. Refresh the page
2. Check browser console for errors
3. Try a different browser
4. Contact Supabase support
```

### If Redirect URL Won't Save:

```
Problem:
URL disappears after pressing Enter

Solutions:
✅ Make sure URL includes protocol: http://
✅ Check format: http://localhost:5173/**
✅ Press Enter after typing
✅ Click "Save" at bottom
```

---

## 📸 Summary: Where to Click

```
1. Click: "Authentication" (left sidebar)
   ↓
2. Click: "Settings"
   ↓
3. Find: "Site URL" section
   Enter: http://localhost:5173
   ↓
4. Find: "Redirect URLs" section
   Click: [+ Add URL]
   Enter: http://localhost:5173/**
   Press: Enter
   ↓
5. Find: "Email Settings" section
   Check: ✅ Enable email confirmation
   ↓
6. Scroll to bottom
   Click: [Save] button
   ↓
7. Wait for: "Success" message ✅
```

---

## 🎊 You're Done!

Settings configured! Now test it:

1. `npm run dev`
2. Register with your email
3. Check inbox
4. Click link
5. **Success!** 🎉

---

**Need detailed instructions?** See `/EMAIL_SETUP_GUIDE.md`

**Need help?** Check Supabase docs or `/START_HERE.md`
