# Tapn Tools – App Workflow & Page Guide

## What This App Is
Tapn Tools is a Next.js + Firebase (Auth/Firestore/Storage) web app for managing digital product sales:
- **Users** run day-to-day sales from the **Dashboard**.
- **Owners** manage users, plans, and platform-wide settings from the **Owner Panel**.
- **Staff accounts** can sign in and operate under an owner with limited permissions.
- A **public landing** site explains the product and routes users to login and public shop pages.

## Core Roles
- **Owner**
  - Access: `/owner/*`
  - Controls: plans, users, app configuration, notifications, analytics across users.
- **User**
  - Access: `/dashboard/*`
  - Controls: sales, vendors, inventory, customers, analytics (for their own data).
- **Staff**
  - Signs in normally, but maps to an owner account via `staff_accounts`.
  - Access behaves like a user, but gated by both plan features and staff permissions.

## Data Model (Firestore – high level)
- `users/{uid}`
  - `role` (`owner` / `user`)
  - `status` (`active` / `pending` / `paused`)
  - `planName`, `salesLimit`, `currentSalesCount`
  - Subcollections:
    - `salesHistory/*`
    - `vendors/*`
    - `inventory/*` (if used by your inventory context)
- `plans/*`
  - `name`, `price`, `salesLimit`, `level`, `yearlyDiscount`, `features[]`
  - `planFeatures` (feature flags + page access flags)
- `settings/app_config`
  - `appName`, `appLogoUrl`, `accentColor`, plus owner contact/payment info
- `staff_accounts/{staffUid}`
  - `ownerUid` (merchant mapping)
  - `permissions` (per-feature allow/deny)

## Gating & Redirect Rules
Authentication and routing rules are enforced in [AuthContext](file:///d:/TapnTools/tapn-tools-next/context/AuthContext.tsx):
- Unauthenticated users get redirected to `/login` (except public pages like `/`, `/about`, `/how-it-works`, `/shop/*`).
- Users with `status=pending` go to `/verification-pending`.
- Users with `status=paused` go to `/access-paused`.
- Owners redirect away from user dashboard routes to `/owner`.
- Feature/page gating is enforced with [PlanFeatureGuard](file:///d:/TapnTools/tapn-tools-next/components/PlanFeatureGuard.tsx).

## Main User Flow (Dashboard)
1. **Login** at `/login`
2. Redirect to `/dashboard` (if active)
3. Run sales in `/dashboard/new-sale`
4. Review sales and profits in `/dashboard/history` and `/dashboard/analytics`
5. Manage supporting data:
   - Vendors: `/dashboard/vendors`
   - Inventory: `/dashboard/inventory`
   - Customers / loyalty: `/dashboard/customers`
6. Handle operational states:
   - Pending payments: `/dashboard/pending`
   - Expiry alerts: `/dashboard/expiry`
   - Reminders: `/dashboard/reminders`
7. Upgrade plans or request support:
   - Plans: `/dashboard/plans`
   - Support: `/dashboard/support`
8. Configure preferences/settings:
   - `/dashboard/settings`

## Owner Flow
1. **Login** at `/login` (owner email recognized via env)
2. Redirect to `/owner`
3. Operational management:
   - Users: `/owner/users` (assign plan, activate/pause, history)
   - Plans: `/owner/plans` (feature flags + pricing)
   - Notifications: `/owner/notifications` (system + plan requests)
   - Settings: `/owner/settings` (branding + owner contact info)
   - Analytics: `/owner/analytics` (select user and view transactions/stats)
   - Vendors: `/owner/vendors` (view vendors per user)

## Public Flow
- Landing pages:
  - `/` (landing)
  - `/about`
  - `/how-it-works`
  - `/privacy-policy`
- Public shop:
  - `/shop/[[...path]]` (dynamic route for public storefront browsing)

## Pages – Purpose (Route Map)
### Public
- `/` – marketing landing, product value, calls to action.
- `/about` – about the product/business.
- `/how-it-works` – onboarding + explanation of the workflow.
- `/privacy-policy` – policy page.
- `/shop/[[...path]]` – public-facing shop flow (route segments handled dynamically).

### Auth / Status
- `/login` – Firebase login.
- `/verification-pending` – shown when a user is pending verification.
- `/access-paused` – shown when user access is paused by owner or plan rules.

### Dashboard (`/dashboard/*`)
- `/dashboard` – overview: summary stats, recent transactions, charts.
- `/dashboard/new-sale` – create a sale, send WhatsApp, generate PDF (feature-gated).
- `/dashboard/history` – sales history, grouping, searching, drilldown details.
- `/dashboard/analytics` – charts and insights for the user’s sales.
- `/dashboard/vendors` – manage vendors and their related tools.
- `/dashboard/inventory` – manage inventory items and stock/price details.
- `/dashboard/customers` – customer history/loyalty view and customer filtering.
- `/dashboard/pending` – pending payments / incomplete settlements.
- `/dashboard/expiry` – expiry alerts and expiration tracking.
- `/dashboard/reminders` – reminder scheduling and edits (feature-gated).
- `/dashboard/settings` – user settings, export preferences, branding options (plan-gated).
- `/dashboard/plans` – upgrade page, plan comparisons, “contact us” flows.
- `/dashboard/staff` – staff access management (create/manage staff permissions).
- `/dashboard/support` – support contact/requests (plan-gated).
- `/dashboard/shop` – mart/shop management entry.
- `/dashboard/shop/orders` – order history for shop/mart.

### Owner (`/owner/*`)
- `/owner` – owner overview: aggregated stats and charts.
- `/owner/users` – user management + plan assignment + user actions.
- `/owner/analytics` – per-user analytics + transaction tables.
- `/owner/notifications` – notification manager, plan requests, system notifications.
- `/owner/plans` – create/edit plans and per-feature/page-access flags.
- `/owner/settings` – branding + owner contact/payment details.
- `/owner/vendors` – per-user vendor directory.
- `/owner/support` – support center/queue for owner actions.

## Theming
- Theme switching is handled by `next-themes` in [providers.tsx](file:///d:/TapnTools/tapn-tools-next/app/providers.tsx).
- Theme tokens are defined in [globals.css](file:///d:/TapnTools/tapn-tools-next/app/globals.css) and used via Tailwind token classes like:
  - `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`

## Where To Start In Code
- Routes live under [app](file:///d:/TapnTools/tapn-tools-next/app).
- Shared UI primitives: [Shared.tsx](file:///d:/TapnTools/tapn-tools-next/components/ui/Shared.tsx)
- Sale entry flow: [SaleForm.tsx](file:///d:/TapnTools/tapn-tools-next/components/sales/SaleForm.tsx)
- Auth + routing rules: [AuthContext.tsx](file:///d:/TapnTools/tapn-tools-next/context/AuthContext.tsx)
- Firebase bootstrap: [firebase.ts](file:///d:/TapnTools/tapn-tools-next/lib/firebase.ts)

