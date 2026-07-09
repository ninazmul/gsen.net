# Admin Role-Based Access Control (RBAC) Plan

## Goal
Implement a role-based admin system with:
- **Super Admin**: Full access to all features, can manage other admins and their permissions
- **Admin**: Customizable permissions controlled by super admins
- Permission system: Read-only, edit, page-specific, and sidebar access controls

## Current State — ✅ COMPLETED

All steps have been implemented. The RBAC system is fully functional.

## Implementation Steps

### Step 1: Update Admin Model ✅
Added role and permissions to `lib/database/models/admin.model.ts`:
- `role`: Enum ('admin', 'superadmin'), default: 'admin'
- `permissions`: Object (PermissionsSchema) with page-level read/write access controls

### Step 2: Update Admin Actions ✅
Modified `lib/actions/admin.actions.ts`:
- `updateAdmin` — edit roles and permissions (guarded by `requireSuperAdmin`)
- `createAdmin` — allows setting role and initial permissions (guarded by `requireSuperAdmin`)
- `deleteAdmin` — prevents deleting last superadmin (guarded by `requireSuperAdmin`)
- `getOrCreateCurrentAdmin` — makes the very first user a superadmin

### Step 3: Update Admin UI ✅
Modified `app/(root)/admins/components/AdminsClient.tsx`:
- Edit button in admin table (visible only to superadmins)
- `EditAdminForm` component with role selector + permissions checkboxes
- `CreateAdminForm` with email + role fields
- Delete button with confirmation (visible only to superadmins)

### Step 4: Create Permission Helpers ✅
- `lib/permission-helpers.ts` — `hasPermission(admin, page, access)` and `hasPageAccess(admin, path)`
- `lib/actions/permission-actions.ts`:
  - `checkPagePermissionServer(path)` — server-side read access check (returns boolean)
  - `checkWritePermissionServer(page)` — server-side write access guard (throws on denial)
  - `requireSuperAdmin()` — server-side superadmin guard (throws on denial)

### Step 5: Update Layout & Sidebar ✅
- `app/(root)/layout.tsx`: Checks admin exists, redirects to `/access-denied` if not. Passes `currentAdmin` to sidebar.
- `app/(root)/components/AdminSidebar.tsx`: Filters sidebar items by `hasPageAccess` — only shows pages the admin can access.

### Step 6: Protect Individual Pages & Server Actions ✅

**Page-level read access checks** (all pages redirect to `/access-denied` if unauthorized):
- `/` (Dashboard)
- `/income`
- `/expenses`
- `/categories`
- `/withdrawals`
- `/reports`
- `/activity-logs`
- `/admins`
- `/settings`

**Server action write permission guards** (throw errors on unauthorized mutating calls):
- `income.actions.ts` — `createIncome`, `updateIncome`, `softDeleteIncome`, `restoreIncome`
- `expense.actions.ts` — `createExpense`, `updateExpense`, `softDeleteExpense`, `restoreExpense`
- `category.actions.ts` — `createCategory`, `updateCategory`, `deleteCategory`
- `withdrawal.actions.ts` — `createWithdrawal`, `updateWithdrawal`, `deleteWithdrawal`
- `settings.actions.ts` — `updateSettings`
- `admin.actions.ts` — `createAdmin`, `updateAdmin`, `deleteAdmin` (requireSuperAdmin)

## Files Modified
1. `lib/database/models/admin.model.ts` — Admin model with role + permissions schema
2. `lib/actions/admin.actions.ts` — Admin CRUD with superadmin guards
3. `lib/actions/permission-actions.ts` — Permission check helpers (read, write, superadmin)
4. `lib/permission-helpers.ts` — Client/server permission utility functions
5. `app/(root)/admins/components/AdminsClient.tsx` — Admin management UI with edit/permissions
6. `app/(root)/layout.tsx` — Root layout with auth + admin check
7. `app/(root)/components/AdminSidebar.tsx` — Permission-filtered sidebar
8. `app/(root)/page.tsx` — Dashboard read access check
9. `app/(root)/income/page.tsx` — Income read access check
10. `app/(root)/expenses/page.tsx` — Expenses read access check
11. `app/(root)/categories/page.tsx` — Categories read access check
12. `app/(root)/withdrawals/page.tsx` — Withdrawals read access check
13. `app/(root)/reports/page.tsx` — Reports read access check
14. `app/(root)/activity-logs/page.tsx` — Activity logs read access check
15. `app/(root)/settings/page.tsx` — Settings read access check
16. `app/(root)/admins/page.tsx` — Admins read access check
17. `lib/actions/income.actions.ts` — Write permission guards on mutations
18. `lib/actions/expense.actions.ts` — Write permission guards on mutations
19. `lib/actions/category.actions.ts` — Write permission guards on mutations
20. `lib/actions/withdrawal.actions.ts` — Write permission guards on mutations
21. `lib/actions/settings.actions.ts` — Write permission guard on update
22. `app/access-denied/page.tsx` — Access denied page

## Permission Structure
```typescript
interface AdminPermissions {
  pages: {
    dashboard: boolean;
    income: { read: boolean; write: boolean };
    expenses: { read: boolean; write: boolean };
    categories: { read: boolean; write: boolean };
    withdrawals: { read: boolean; write: boolean };
    reports: boolean;
    activityLogs: boolean;
    admins: boolean;
    settings: boolean;
  };
}
```

## Security Layers
1. **Layout-level**: Only authenticated admins can access the app at all
2. **Sidebar-level**: Non-permitted pages are hidden from navigation
3. **Page-level**: Server-side read access check redirects unauthorized users
4. **Action-level**: Server-side write guards throw errors on unauthorized mutations
5. **Role-level**: Admin management requires superadmin role
