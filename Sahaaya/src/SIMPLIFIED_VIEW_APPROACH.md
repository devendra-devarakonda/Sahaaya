# Simplified View with Data Enrichment

## Problem
The simplified `dashboard_my_contributions` view only has:
- id, user_id, request_id, category, status, report_count, source_type, community_id, contribution_type, message, created_at

But the UI needs:
- request_title, amount_needed, city, state, community_name

## Solution Options

### Option 1: Keep Simplified View + Fetch Additional Data (RECOMMENDED)
- ✅ View only returns essential fields
- ✅ Frontend fetches request details separately using request_id
- ✅ Cleaner separation of concerns
- ❌ Requires 2 queries (view + request details)

### Option 2: Expand View with All Fields
- ✅ One query gets everything
- ❌ View becomes complex
- ❌ Different fields for global vs community
- ❌ Harder to maintain

## Recommended Implementation

Keep the simplified view and enrich data in frontend:

```typescript
// 1. Fetch contributions from view
const contributions = await fetchContributions();

// 2. For each contribution, fetch request details
for (const contrib of contributions) {
  if (contrib.source_type === 'global') {
    const request = await fetchGlobalRequest(contrib.request_id);
    contrib.title = request.title;
    contrib.amount = request.amount_needed;
    // etc
  } else {
    const request = await fetchCommunityRequest(contrib.request_id);
    contrib.title = request.title;
    contrib.amount = request.amount_needed;
    // etc
  }
}
```

This keeps the view simple and the data fresh!
