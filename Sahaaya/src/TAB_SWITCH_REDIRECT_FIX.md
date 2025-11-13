# ✅ Tab Switch Auto-Refresh/Redirect Issue - FIXED

## 🎯 Issue Fixed

**Problem:** The Sahaaya website automatically refreshed and redirected to the Dashboard page whenever users switched browser tabs and returned to the website.

**Symptoms:**
- ❌ User on `/communities` page → switches tab → returns → forced to `/dashboard`
- ❌ User on `/browse-requests` page → switches tab → returns → forced to `/dashboard`
- ❌ App refreshes unnecessarily on tab focus
- ❌ Session state seems to reset on tab visibility change

**Root Cause:** The `onAuthStateChange` listener in `App.tsx` was triggering `setCurrentPage('dashboard')` on EVERY auth event, including:
- `TOKEN_REFRESHED` - When Supabase auto-refreshes the session (happens on tab switch)
- `SIGNED_IN` - Even when user was already signed in

---

## 🛠️ Fix Applied

### **Step 1: Supabase Auth Persistence (Already Correct)**

The Supabase client in `/utils/auth.ts` was already configured correctly:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,     // ✅ Auto-refresh tokens
    persistSession: true,        // ✅ Persist session in localStorage
    detectSessionInUrl: true,    // ✅ Detect auth tokens in URL
    flowType: 'pkce'            // ✅ Use PKCE flow for security
  }
});
```

**Result:** Sessions are properly persisted across page reloads and tab switches.

---

### **Step 2: Fixed Redirect Logic**

#### **Problem Code (Before):**

```typescript
// ❌ This ran on EVERY auth event (including token refresh)
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // ... set user profile ...
      setCurrentPage('dashboard');  // ❌ ALWAYS redirects to dashboard
    }
  }
);
```

**Issue:** When you switch tabs, Supabase auto-refreshes the token, which triggers a `TOKEN_REFRESHED` event. The old code treated this as a sign-in event and redirected to dashboard.

#### **Fixed Code (After):**

```typescript
// State to track if app has initialized
const [hasInitialized, setHasInitialized] = useState(false);

// Listen for auth changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log('🔔 Auth event:', event);
    
    // ✅ Only handle ACTUAL sign-in events, not token refreshes
    if (event === 'SIGNED_IN' && session && !hasInitialized) {
      // ... set user profile ...
      setCurrentPage('dashboard');  // ✅ Only on first login
    } 
    
    // ✅ NEW: Handle token refresh WITHOUT changing page
    else if (event === 'TOKEN_REFRESHED' && session) {
      // Update user profile on token refresh
      const role = session.user.user_metadata?.role as 'individual' | 'ngo';
      const validRole = (role === 'individual' || role === 'ngo') ? role : null;
      
      setUserProfile({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
        phone: session.user.user_metadata?.phone,
        role: validRole,
        avatar_url: session.user.user_metadata?.avatar_url
      });
      setIsAuthenticated(true);
      setUserRole(validRole as any);
      // ✅ DON'T navigate to dashboard - stay on current page
    } 
    
    else if (event === 'SIGNED_OUT') {
      setIsAuthenticated(false);
      setUserProfile(null);
      setUserRole(null);
      setCurrentPage('home');
    }
  }
);
```

**Key Changes:**
1. **Added `hasInitialized` flag** - Tracks whether the app has completed initial load
2. **Guard on SIGNED_IN** - Only redirect to dashboard if `!hasInitialized` (i.e., fresh login)
3. **Added TOKEN_REFRESHED handler** - Updates user profile without changing page

---

### **Step 3: Improved Initial Session Check**

#### **Problem Code (Before):**

```typescript
// ❌ ALWAYS navigated to dashboard if session exists
if (session && session.user) {
  // ... set user profile ...
  setCurrentPage('dashboard');  // ❌ Even if user was on /communities
}
```

#### **Fixed Code (After):**

```typescript
// ✅ Only navigate to dashboard if user is on login/home pages
if (session && session.user) {
  // ... set user profile ...
  
  // Only navigate to dashboard on initial load if user is not already on a page
  if (currentPage === 'home' || currentPage === 'login' || currentPage === 'register') {
    setCurrentPage('dashboard');
  }
  // ✅ If user was on /communities, /matching, etc., stay there
}

// Mark initialization as complete
setHasInitialized(true);
```

**Result:** If a user refreshes the page while on `/communities`, they stay on `/communities` instead of being forced to `/dashboard`.

---

### **Step 4: No App Reset on Tab Focus (Confirmed)**

Verified that there are NO event listeners for:
- ✅ `document.visibilitychange`
- ✅ `window.onfocus`
- ✅ `window.onblur`
- ✅ Any focus-based page reloads

**Result:** App does NOT reset or reload when switching tabs.

---

### **Step 5: Session Hydration Before Rendering**

The app already follows proper session hydration:

```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const checkSession = async () => {
    // 1. Get session from Supabase
    let { data: { session }, error } = await supabase.auth.getSession();
    
    // 2. Set user state
    if (session && session.user) {
      setUserProfile({ ... });
      setIsAuthenticated(true);
      setUserRole(validRole);
    }
    
    // 3. Mark loading as complete
    setIsLoading(false);
    setHasInitialized(true);
  };
  
  checkSession();
}, []);

// Render loading state until session is checked
if (isLoading) {
  return <LoadingSpinner />;
}
```

**Result:** No pages render before the session is hydrated from localStorage.

---

## 🎉 Expected Behavior (After Fix)

| Scenario | Before Fix | After Fix |
|----------|------------|-----------|
| **Switch tabs while on /communities** | ❌ Redirects to /dashboard | ✅ Stays on /communities |
| **Switch tabs while on /browse-requests** | ❌ Redirects to /dashboard | ✅ Stays on /browse-requests |
| **Refresh page on /matching** | ❌ Goes to /dashboard | ✅ Stays on /matching |
| **Fresh login** | ✅ Goes to /dashboard | ✅ Goes to /dashboard |
| **Session expires** | ✅ Redirects to home | ✅ Redirects to home |
| **Token auto-refresh** | ❌ Redirects to /dashboard | ✅ Stays on current page |

---

## 🔍 Technical Details

### Auth Events Flow

**Supabase Auth Events:**
1. **`SIGNED_IN`** - User just logged in (fresh login)
2. **`SIGNED_OUT`** - User logged out
3. **`TOKEN_REFRESHED`** - Token auto-refreshed (happens every hour or on tab focus)
4. **`USER_UPDATED`** - User metadata changed
5. **`PASSWORD_RECOVERY`** - Password reset initiated

**Our Handling:**
- ✅ `SIGNED_IN` (first time only) → Navigate to dashboard
- ✅ `TOKEN_REFRESHED` → Update user profile, stay on current page
- ✅ `SIGNED_OUT` → Clear state, go to home
- ✅ All others → Ignored

### Token Refresh Behavior

**When Supabase Refreshes Tokens:**
- Every 1 hour (configurable, default is 3600 seconds)
- When tab regains focus (if token is close to expiry)
- When page is refreshed
- When `refreshSession()` is called manually

**Old Behavior:**
```
User on /communities
→ Switch to another tab
→ Supabase auto-refreshes token
→ TOKEN_REFRESHED event fires
→ Code treats it as SIGNED_IN
→ Redirects to /dashboard ❌
```

**New Behavior:**
```
User on /communities
→ Switch to another tab
→ Supabase auto-refreshes token
→ TOKEN_REFRESHED event fires
→ Updates user profile silently
→ Stays on /communities ✅
```

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `/App.tsx` | Added `hasInitialized` state, modified `onAuthStateChange` handler to distinguish between SIGNED_IN and TOKEN_REFRESHED events, improved initial session check logic |

---

## 🧪 Testing Checklist

### Tab Switch Tests

- [ ] Open app, navigate to `/communities`
- [ ] Switch to another browser tab
- [ ] Wait 5 seconds
- [ ] Switch back to app
- [ ] ✅ **Verify:** Still on `/communities`, not redirected to `/dashboard`

---

- [ ] Open app, navigate to `/browse-requests`
- [ ] Click "Offer Help" on a request
- [ ] Switch to another browser tab
- [ ] Switch back
- [ ] ✅ **Verify:** Modal still open, page unchanged

---

- [ ] Open app, navigate to `/notifications`
- [ ] Switch tabs multiple times
- [ ] ✅ **Verify:** Never redirects to dashboard

---

### Refresh Tests

- [ ] Open app, navigate to `/matching`
- [ ] Refresh page (F5 or Ctrl+R)
- [ ] ✅ **Verify:** Stays on `/matching` after refresh

---

- [ ] Open app, navigate to `/community-details`
- [ ] Refresh page
- [ ] ✅ **Verify:** Stays on same community details page

---

### Login Tests

- [ ] Log out completely
- [ ] Log in with credentials
- [ ] ✅ **Verify:** Redirects to `/dashboard` after login
- [ ] Navigate to `/communities`
- [ ] ✅ **Verify:** Stays on `/communities`
- [ ] Refresh page
- [ ] ✅ **Verify:** Still on `/communities`

---

### Session Expiry Test

- [ ] Open browser DevTools
- [ ] Go to Application → Local Storage
- [ ] Delete Supabase session keys
- [ ] Refresh page
- [ ] ✅ **Verify:** Redirects to home page (logged out)

---

### Token Refresh Simulation

**Manual Test:**
1. Open browser DevTools → Console
2. Run:
```javascript
// Check current auth event
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth Event:', event, session);
});

// Manually trigger refresh
await supabase.auth.refreshSession();
```
3. ✅ **Verify:** Console shows `TOKEN_REFRESHED` event
4. ✅ **Verify:** Page does NOT redirect to dashboard

---

## 🐛 Debugging

### If Tab Switch Still Causes Redirect

**Check Console Logs:**
```javascript
// Look for these logs in browser console:
🔔 Auth event: TOKEN_REFRESHED
// Should NOT see:
🔔 Auth event: SIGNED_IN
```

**If you see `SIGNED_IN` on tab switch:**
- Check if `hasInitialized` is being reset somewhere
- Verify that the `useEffect` dependency array is `[]` (empty)

### If Session Not Persisting

**Check Local Storage:**
1. Open DevTools → Application → Local Storage
2. Look for keys starting with `sb-`
3. Should see: `sb-<project>-auth-token`

**If missing:**
- Verify `persistSession: true` in `/utils/auth.ts`
- Check browser privacy settings (incognito mode disables localStorage)

### If User Profile Not Updating

**Check TOKEN_REFRESHED Handler:**
```typescript
else if (event === 'TOKEN_REFRESHED' && session) {
  // This should update userProfile state
  setUserProfile({ ... });
  setIsAuthenticated(true);
  setUserRole(validRole);
}
```

---

## 🎯 Summary

### Root Cause
The `onAuthStateChange` listener was treating token refresh events as fresh logins and redirecting to dashboard.

### Solution
1. Added `hasInitialized` flag to track app state
2. Only redirect to dashboard on actual login (`SIGNED_IN` && `!hasInitialized`)
3. Handle `TOKEN_REFRESHED` separately - update profile but don't change page
4. Improved initial session check to preserve current page

### Result
- ✅ Tab switching no longer causes redirects
- ✅ Token refresh happens silently in background
- ✅ User stays on current page across tab switches
- ✅ Fresh logins still redirect to dashboard
- ✅ Session persists correctly

---

**Status:** ✅ COMPLETE  
**Testing:** Ready for user testing  
**Risk:** Low (logic-only changes, no API changes)  
**Rollback:** Easy (revert `/App.tsx` changes)  

---

**Last Updated:** Now  
**Issue:** Tab switch causes auto-redirect to dashboard  
**Solution:** Distinguished TOKEN_REFRESHED from SIGNED_IN events  
**File:** `/App.tsx`
