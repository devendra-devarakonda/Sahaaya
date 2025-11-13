# 💰 Amount Field Reference Guide

## 🎯 Quick Rule

**ALWAYS use `request.amount_needed` for help requests**

---

## ✅ Correct Usage

### For Global Requests

```typescript
// ✅ CORRECT - Use amount_needed directly
<p>₹{Math.round(request.amount_needed || 0).toLocaleString()}</p>

// ✅ CORRECT - With optional chaining
{request.amount_needed && (
  <span>₹{Math.round(request.amount_needed).toLocaleString()}</span>
)}
```

### For Community Requests

```typescript
// ✅ CORRECT - Same field name
<p>₹{Math.round(request.amount_needed || 0).toLocaleString()}</p>
```

### For Contributions (from Views)

```typescript
// ✅ CORRECT - Views alias amount_needed AS amount
<p>₹{Math.round(contribution.amount || 0).toLocaleString()}</p>

// Why? Because this comes from dashboard_my_contributions view:
// SELECT hr.amount_needed AS amount FROM help_requests hr
```

---

## ❌ NEVER Use These

```typescript
// ❌ WRONG - Don't subtract anything
request.amount_needed - supporters
request.amount_needed - 2
request.amount_needed - offers_count

// ❌ WRONG - Don't use these computed fields
request.remaining_amount
request.net_amount
request.adjusted_amount

// ❌ WRONG - Don't prioritize 'amount' over 'amount_needed' for requests
request.amount || request.amount_needed  // Wrong order!
```

---

## 📋 Component Reference

| Component | Use This Field | Example |
|-----------|----------------|---------|
| **Dashboard** (My Requests) | `request.amount_needed` | `₹{Math.round(request.amount_needed \|\| 0).toLocaleString()}` |
| **Dashboard** (My Contributions) | `contribution.amount` | `₹{Math.round(contribution.amount \|\| 0).toLocaleString()}` |
| **Browse Requests** | `request.amount_needed` | `₹{Math.round(request.amount_needed \|\| 0).toLocaleString()}` |
| **All Requests** | `request.amount_needed` | `₹{Math.round(request.amount_needed \|\| 0).toLocaleString()}` |
| **All Contributions** | `contribution.amount` | `₹{Math.round(contribution.amount \|\| 0).toLocaleString()}` |
| **Community Browse** | `request.amount_needed` | `₹{Math.round(request.amount_needed \|\| 0).toLocaleString()}` |
| **Complete Modal** | `request.amount_needed` | `₹{Math.round(request.amount_needed \|\| 0).toLocaleString()}` |
| **Request Form** | `formData.amount` → saved as `amount_needed` | `amount_needed: parseFloat(formData.amount)` |

---

## 🗄️ Database Schema

### Global Requests Table

```sql
CREATE TABLE help_requests (
  id UUID PRIMARY KEY,
  amount_needed NUMERIC(10,2),  -- ← Use this field
  supporters INTEGER,            -- ← NEVER subtract from amount
  -- ... other fields
);
```

### Community Requests Table

```sql
CREATE TABLE community_help_requests (
  id UUID PRIMARY KEY,
  amount_needed NUMERIC(10,2),  -- ← Use this field
  supporters INTEGER,            -- ← NEVER subtract from amount
  -- ... other fields
);
```

### Dashboard Views

```sql
-- dashboard_my_requests view
SELECT 
  hr.amount_needed AS amount,  -- ← Aliased for convenience
  -- ... other fields
FROM help_requests hr;

-- dashboard_my_contributions view  
SELECT 
  hr.amount_needed AS amount,  -- ← Joined from request, aliased
  -- ... other fields
FROM help_offers ho
JOIN help_requests hr ON hr.id = ho.request_id;
```

---

## 🔍 When to Use Which

### Use `amount_needed` when:
- ✅ Reading directly from `help_requests` table
- ✅ Reading directly from `community_help_requests` table
- ✅ Displaying request details in any component
- ✅ Creating new requests (form submission)

### Use `amount` when:
- ✅ Reading from `dashboard_my_requests` view (it's an alias)
- ✅ Reading from `dashboard_my_contributions` view (it's an alias)
- ✅ The data source explicitly aliases `amount_needed AS amount`

---

## 🚨 Common Mistakes to Avoid

### Mistake #1: Fallback Order

```typescript
// ❌ WRONG - Prioritizes potentially incorrect 'amount'
const displayAmount = request.amount || request.amount_needed || 0;

// ✅ CORRECT - Always use amount_needed for requests
const displayAmount = request.amount_needed || 0;

// ✅ CORRECT - Only for contributions from views
const displayAmount = contribution.amount || 0;
```

### Mistake #2: Calculations

```typescript
// ❌ WRONG - Never calculate
const displayAmount = request.amount_needed - request.supporters;
const remaining = request.amount_needed - 2;

// ✅ CORRECT - Use raw value
const displayAmount = request.amount_needed;
```

### Mistake #3: Mixed Field Names

```typescript
// ❌ WRONG - Inconsistent
<div>
  <span>{request.amount}</span>
  <span>{request.amount_needed}</span>  
</div>

// ✅ CORRECT - Consistent
<div>
  <span>{request.amount_needed}</span>
  <span>{request.amount_needed}</span>
</div>
```

---

## 🧪 Testing Checklist

When adding or modifying amount displays:

- [ ] Verify field name is `amount_needed` (or `amount` from view)
- [ ] No calculations on the amount value
- [ ] No subtractions (supporters, offers, etc.)
- [ ] Consistent across all display locations
- [ ] Test with value 1000 → should show exactly 1,000
- [ ] Test with multiple users → all see same amount
- [ ] Test after offers added → amount unchanged

---

## 📝 Code Review Checklist

When reviewing PRs that touch amounts:

- [ ] Check field name: `amount_needed` not `amount` (for requests)
- [ ] Check for calculations: Should be none
- [ ] Check for subtractions: Should be none
- [ ] Check data source: View or table?
- [ ] Verify formatting: `Math.round()` and `.toLocaleString()`
- [ ] Test edge cases: 0, null, undefined, very large numbers

---

## 🔗 Related Files

- `/components/Dashboard.tsx` - My Requests & Contributions display
- `/components/AllRequests.tsx` - All requests display
- `/components/AllContributions.tsx` - All contributions display
- `/components/MatchingScreen.tsx` - Browse requests display
- `/components/CompleteHelpModal.tsx` - Request completion modal
- `/components/Communities/CommunityBrowseHelp.tsx` - Community requests
- `/utils/supabaseService.ts` - Data fetching service
- `/UNIFIED_DASHBOARD_VIEWS.sql` - View definitions

---

## 💡 Pro Tips

1. **Always use formatting:**
   ```typescript
   Math.round(amount || 0).toLocaleString()
   ```

2. **Indian Rupee symbol:**
   ```typescript
   ₹{amount}  // ← Use ₹ not Rs or INR
   ```

3. **Null safety:**
   ```typescript
   request.amount_needed || 0  // Safe default
   ```

4. **Optional rendering:**
   ```typescript
   {request.amount_needed && (
     <span>₹{Math.round(request.amount_needed).toLocaleString()}</span>
   )}
   ```

5. **TypeScript typing:**
   ```typescript
   interface Request {
     amount_needed?: number;  // Optional, numeric
     // NOT: amount?: number | string;
   }
   ```

---

**Remember:** When in doubt, use `amount_needed` for requests! 🎯
