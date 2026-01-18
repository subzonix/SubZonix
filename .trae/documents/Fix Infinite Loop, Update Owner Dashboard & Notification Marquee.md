I will implement the requested changes to fix the infinite loop, update the owner dashboard, and improve the notification banner.

### 1. Fix Infinite Compilation/Hang Issue
The infinite loop is likely caused by the `useEffect` hook in the Reminders and Settings pages depending on the unstable `user` object reference.
- **File**: `app/(dashboard)/reminders/page.tsx`
  - Change dependency `[user, showToast]` to `[user?.uid, showToast]`.
- **File**: `app/(dashboard)/settings/page.tsx`
  - Change dependency `[user]` to `[user?.uid]`.

### 2. Owner Dashboard Update
I will update the Owner Dashboard to include a view similar to the User Dashboard, with the ability to select a specific user.
- **File**: `app/owner/page.tsx`
  - Add a "Dashboard" tab/view in addition to the existing "User Management".
  - Add a dropdown to select a user from the list.
  - Implement fetching of `salesHistory` for the selected user.
  - Copy and adapt the stats cards (Orders, Revenue, Profit, etc.) and charts (Revenue Trend, etc.) from `app/(dashboard)/page.tsx` to display data for the selected user.

### 3. Owner Notification Badge Marquee
I will enable the notification banner for the owner and apply a scrolling animation.
- **File**: `app/owner/layout.tsx`
  - Remove `hideNotifications={true}` prop from the `Header` component to allow the banner to show.
- **File**: `components/admin/NotificationBanner.tsx`
  - Implement a CSS marquee animation (scrolling text right-to-left) for the notification message.
  - Style it to be smooth and readable.
