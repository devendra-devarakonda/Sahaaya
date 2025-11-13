# 🚀 Amount Fix Deployment Guide

## 📋 Quick Summary

**Issue:** Users see incorrect amounts (998, -2, -15) instead of exact requested amounts
**Root Cause:** Legacy calculations subtracting from amount_needed
**Solution:** Database view recreation + frontend verification
**Time Required:** 5 minutes
**Risk Level:** ✅ Low (read-only view changes)

---

## 🎯 Step-by-Step Deployment

### Step 1: Verify Current State (Optional but Recommended)

Run the verification script first to see if there's bad data:

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste: `/supabase/migrations/009_verify_amounts.sql`
3. Click **Run**
4. Review results:
   - ✅ If all amounts look normal (no negatives, reasonable values) → Proceed
   - ⚠️ If you see negative amounts or suspicious values → Note them for investigation

### Step 2: Deploy the Fix Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste: `/supabase/migrations/009_fix_amount_display.sql`
3. Click **Run**
4. Wait for success messages:
   ```
   ✅ Amount display fix completed
   ✅ All views return exact amount_needed (no calculations)
   ✅ No triggers or functions modifying amounts
   ✅ Schema cache refreshed
   ```

### Step 3: Verify the Fix

Run these verification queries in SQL Editor:

```sql
-- Check if views were updated correctly
SELECT 
  id, 
  title, 
  amount, 
  supporters,
  'View shows exact amount' AS status
FROM dashboard_my_requests
LIMIT 5;

-- Verify amounts match between table and view
SELECT 
  hr.id,
  hr.title,
  hr.amount_needed AS table_amount,
  dmr.amount AS view_amount,
  CASE 
    WHEN hr.amount_needed = dmr.amount THEN '✅ Correct'
    ELSE '❌ Mismatch'
  END AS verification
FROM help_requests hr
JOIN dashboard_my_requests dmr ON dmr.id = hr.id
WHERE hr.amount_needed IS NOT NULL
LIMIT 5;
```

Expected result: ✅ All rows should show "✅ Correct"

### Step 4: Clear PostgREST Cache

The migration already does this, but if needed, run manually:

```sql
NOTIFY pgrst, 'reload schema';
```

### Step 5: Test in Frontend

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Login to application**
3. **Create a test request:**
   - Amount: ₹1000
   - Note the request ID
4. **Verify display:**
   - Dashboard → My Requests → Should show exactly **₹1,000**
   - Browse Requests → Find your request → Should show exactly **₹1,000**
5. **Have another user offer help**
6. **Check original requester's view:**
   - Amount should STILL show **₹1,000** (not reduced)

### Step 6: Multi-User Testing

Test with 2-4 different accounts:

| Account | Action | Expected Result |
|---------|--------|-----------------|
| User A | Create request for ₹1000 | Sees ₹1,000 |
| User B | View User A's request | Sees ₹1,000 |
| User B | Offer help | Amount stays ₹1,000 |
| User A | View own request | Still sees ₹1,000 |
| User C | View User A's request | Sees ₹1,000 |
| User A | Check dashboard | Contribution shows ₹1,000 |

**All users should see identical amounts - no reductions!**

---

## 🔍 What Changed?

### Database Views (Backend)

#### Before:
```sql
-- Potentially had calculations (if old version was deployed)
SELECT amount_needed - supporters AS amount  -- ❌ WRONG
```

#### After:
```sql
-- Clean direct mapping
SELECT amount_needed AS amount  -- ✅ CORRECT
```

### Frontend Components

✅ **No changes needed** - all components already use correct patterns:
- `request.amount_needed`
- `request.amount` (from views)
- No subtractions found

---

## 🚨 Rollback Plan (If Needed)

If something goes wrong, you can restore the previous view:

```sql
-- Rollback to previous view definition
-- (Only use if absolutely necessary)

DROP VIEW IF EXISTS public.dashboard_my_requests CASCADE;
DROP VIEW IF EXISTS public.dashboard_my_contributions CASCADE;

-- Then re-run your previous migration or restore from backup
```

**Note:** Rollback should NOT be needed as this only affects view definitions (no data modification).

---

## ✅ Success Criteria

After deployment, you should see:

1. ✅ All amounts display as whole numbers (no weird decimals)
2. ✅ No negative amounts anywhere
3. ✅ No amounts like 998, 997 when 1000 was requested
4. ✅ Amounts don't change when offers are added
5. ✅ Same amounts visible to all users for the same request
6. ✅ Dashboard shows correct amounts in My Requests section
7. ✅ Dashboard shows correct amounts in My Contributions section
8. ✅ Browse Requests shows correct amounts
9. ✅ Community requests show correct amounts
10. ✅ Complete modal shows correct amounts

---

## 🐛 Troubleshooting

### Problem: Still seeing incorrect amounts

**Solution 1: Clear all caches**
```sql
NOTIFY pgrst, 'reload schema';
```
Then clear browser cache (Ctrl+Shift+R)

**Solution 2: Check if migration actually ran**
```sql
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_name IN ('dashboard_my_requests', 'dashboard_my_contributions');
```
Should see updated definitions without calculations.

**Solution 3: Check for old data**
```sql
SELECT id, title, amount_needed
FROM help_requests
WHERE amount_needed < 0;
```
If you find negative amounts, those are bad data rows that need manual correction.

### Problem: Views don't exist

**Solution: Re-run the migration**
The migration creates the views from scratch. Just run it again.

### Problem: Permission denied error

**Solution: Check RLS policies**
```sql
GRANT SELECT ON public.dashboard_my_requests TO authenticated;
GRANT SELECT ON public.dashboard_my_contributions TO authenticated;
```

---

## 📊 Monitoring After Deployment

For the next 24-48 hours, monitor:

1. **User Reports:** Ask test users if amounts look correct
2. **Browser Console:** Check for JavaScript errors related to amounts
3. **Database Logs:** Watch for any unexpected errors
4. **Sample Queries:** Periodically run verification queries

### Daily Check Query:
```sql
-- Run this daily for a week to ensure stability
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS requests_created,
  AVG(amount_needed) AS avg_amount,
  MIN(amount_needed) AS min_amount,
  MAX(amount_needed) AS max_amount,
  COUNT(CASE WHEN amount_needed < 0 THEN 1 END) AS negative_count
FROM help_requests
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 📁 Files Reference

| File | Purpose | Action Required |
|------|---------|----------------|
| `/supabase/migrations/009_verify_amounts.sql` | Pre-deployment check | Optional: Run before fix |
| `/supabase/migrations/009_fix_amount_display.sql` | Main fix migration | **Required: Deploy this** |
| `/AMOUNT_FIX_GUIDE.md` | Technical documentation | Reference only |
| `/AMOUNT_FIX_DEPLOYMENT.md` | This file | Deployment guide |

---

## ✅ Deployment Checklist

Copy this checklist and mark items as you complete them:

- [ ] Backed up current view definitions (optional but recommended)
- [ ] Ran verification script (009_verify_amounts.sql) - Optional
- [ ] Reviewed verification results
- [ ] Ran fix migration (009_fix_amount_display.sql) - **Required**
- [ ] Verified success messages appeared
- [ ] Ran verification queries to confirm views updated
- [ ] Manually refreshed PostgREST schema cache
- [ ] Cleared browser cache
- [ ] Created test request with known amount
- [ ] Verified amount displays correctly on Dashboard
- [ ] Verified amount displays correctly on Browse Requests
- [ ] Had second user offer help
- [ ] Verified amount didn't change after offer
- [ ] Checked browser console for errors
- [ ] Tested with 2+ user accounts
- [ ] All test users see identical amounts
- [ ] Tested community requests (if applicable)
- [ ] Tested global requests
- [ ] Verified My Contributions section
- [ ] Checked Complete Help modal display
- [ ] Monitored for 10 minutes after deployment
- [ ] Notified team/users of fix completion
- [ ] Documented any issues found
- [ ] Marked deployment as successful

---

## 🎉 Expected Outcome

After successful deployment:

- ✅ **All users see exact requested amounts**
- ✅ **No more negative or reduced values**
- ✅ **Amounts remain consistent across all screens**
- ✅ **New requests show correct amounts immediately**
- ✅ **Old requests display their original amounts**
- ✅ **System is ready for production use**

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Review the `/AMOUNT_FIX_GUIDE.md` for detailed troubleshooting
4. Run the verification script again to identify the issue
5. Check if PostgREST cache needs clearing

---

**Deployment Status:** 🟢 Ready to Deploy
**Risk Assessment:** ✅ Low Risk (view-only changes)
**Rollback Available:** ✅ Yes
**Testing Required:** ✅ Yes (5-10 minutes)
**User Impact:** ✅ Positive (fixes display bug)

---

Good luck with the deployment! 🚀
