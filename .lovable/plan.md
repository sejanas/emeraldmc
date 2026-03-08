

## Problem

The backend `handleLogin` function (line 135-136 in the edge function) rejects any user whose status is not `active`:

```
if (profile.status !== "active")
  return errRes(`Account is ${profile.status}. Contact admin.`, 403);
```

This means pending and declined users cannot log in at all, even though the frontend `AdminRoute` already handles them correctly — redirecting them to `/admin/profile` where they can edit their details and resubmit.

## Plan

**Single change in the edge function** (`supabase/functions/api/index.ts`):

Replace the strict `active`-only check in `handleLogin` with a check that also allows `pending` and `declined` statuses. Only `revoked` users should be blocked from logging in.

```typescript
// Before:
if (profile.status !== "active")
  return errRes(`Account is ${profile.status}. Contact admin.`, 403);

// After:
if (profile.status === "revoked")
  return errRes("Account has been revoked. Contact admin.", 403);
```

This is safe because:
- The frontend `AdminRoute` already restricts pending/declined users to the profile page only
- The backend API endpoints that require admin access use `requireRole()` which checks for active admin roles separately
- Pending/declined users can only call `/auth/me`, `/auth/profile` (update), and `/auth/resubmit` — all of which just need an authenticated session

No frontend changes needed — `AdminRoute` and `AdminProfile` already handle these statuses correctly.

