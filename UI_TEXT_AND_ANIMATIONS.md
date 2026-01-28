# UI Text & Animations — Updated (Developer Instructions)

Notes: This document is the edited, production-safe version of the original UI_TEXT_AND_ANIMATIONS.md. It focuses only on items you asked to keep (copy, animation, data-model guidance) and removes or neutralizes brand/legal risk items (company logos, unverified metrics). It also adds precise replacement copy (pasteable) and technical Firebase/implementation guidance to avoid future data conflicts and performance problems.

## Quick Summary of Changes (what was edited)
- Brand/logo/metrics: Removed hard claims and brand logos from copy; added safe copy and a small disclaimer for demo/testimonials.
- Hero CTA text: Replaced ambiguous CTAs with precise CTAs (Start Free Trial, View Demo) and updated hero lines.
- Metrics section: Removed numeric claims and replaced with capability statements.
- Testimonials: Reduced duplication, added disclaimer and sample testimonial template.
- Pricing: Converted pricing cards to marketing-level descriptions that reflect owner-managed plans. No fixed prices shown unless Owner sets them.
- FAQ: Filled all FAQ entries with production-ready answers.
- How-It-Works: Kept structure but replaced risky phrasing like “bank-grade” with accurate wording referencing Firebase security rules.
- Animations: Added performance guidance (mobile guardrails, prefer IntersectionObserver-style reveals, reduce heavy scroll effects).
- Firebase & Data Guidance: Added structure suggestions, indexing, read/write patterns, scheduled jobs, and advice on where to store owner-managed settings, plan flags, and heavy data.

---

## 1. Global Brand Text (Owner-Configured)
Source: `settings/app_config` (Firestore)

### Fields required (document path: `settings/app_config`)
- `appName` — string (owner-editable)
- `appLogoUrl` — string (owner-editable)
- `accentColor` — string (hex)
- `supportEmail` — string
- `brandDisclaimer` — string (optional, used under testimonials when demo data is shown)

### Runtime behavior / implementation notes
- Read this document once at app startup (server-side or during app bootstrap in AuthContext) and cache it in memory (or localStorage) to avoid repeated reads.
- Do not read `settings/app_config` inside each component render — fetch once in ThemeConfigProvider or AuthContext and provide it via React context.

---

## 2. Landing Copy — Exact Replacement Strings (pasteable)

### Hero
- Badge: `Enterprise-Grade Management`
- Headline (two lines):
  - `Kill the Chaos.`
  - `Scale Your Subscription Business.`
- Subheadline:
  - `Stop managing digital tools on WhatsApp and Excel. Automate inventory, customer tracking, shared-costs, and expiry alerts in one powerful dashboard.`
- Primary CTA: `Start Free Trial`
- Secondary CTA: `View Demo`

### Stats (replace numeric metrics with capability statements)
- `Built for High-Volume Sellers`
- `Automated Profit Tracking`
- `Shared Account Support`
- `Real-Time Expiry Alerts`

### Features (card heading + short descriptions)
- `Inventory Control` — `Organize and manage accounts and subscriptions with drag-and-drop simplicity.`
- `Smart Cost Sharing` — `Automatically split tool costs and calculate profit per user.`
- `Expiry Reminders` — `Track expirations and send automated renewal messages.`
- `Sales History` — `Secure, searchable records of every transaction and customer.`
- `Enterprise-Level Security` — `Secure access and data rules powered by Firebase.`
- `Clean Dashboard` — `High-performance UI optimized for high-volume sellers.`

### How It Works — Step copy
- `01. Add Tool` — `Add a tool, set cost and selling price, and (optionally) store credentials encrypted.`
- `02. Assign Customer` — `Select or create a customer, assign access, and record the sale.`
- `03. Track Profit` — `Tapn calculates profit automatically and schedules expiry reminders.`

### Pain Points (short card copy)
- `Excel Chaos` — `Spreadsheets that get out-of-sync cause lost sales.`
- `Manual Follow-ups` — `Manual messages waste time and miss renewals.`
- `Missed Expiries` — `Expirations lead to lost revenue.`
- `Profit Leaks` — `Hidden cost-sharing reduces your margins.`

### Solution bullets
- `Automated Expiry Tracking`
- `Shared Tool Cost-Splitting`
- `Instant Profit Calculation`
- `Secure Customer History`

### Testimonials
Use maximum 4 testimonials. Template to store in `ui_content/testimonials/*` (Firestore or JSON config):
- `name`, `title`, `quote`, `avatarUrl` (optional), `isSample` (boolean)

Sample testimonial (pasteable):
- `name`: `Alex Rivera`
- `title`: `Digital Reseller`
- `quote`: `Tapn transformed how I manage reselling — no more spreadsheets and instant expiry reminders.`

Small notice under testimonials (if sample/test/demo data used):
- `Note: Some testimonials are sample content for demo purposes.`

### Pricing cards (marketing-level, no fixed prices)
- Starter
  - `For new resellers — Core dashboard, limited monthly sales, email support.`
  - CTA: `Start Free Trial`
- Pro (Most Popular)
  - `Unlimited sales, inventory management, WhatsApp reminders, and analytics.`
  - CTA: `Start Free Trial`
- Business
  - `Staff accounts, priority support, advanced analytics, custom limits.`
  - CTA: `Contact Sales`

Footer disclaimer (pricing):
- `Plans and feature limits are managed by the platform owner and may vary. Start a 7-day free trial to evaluate.`

### FAQ answers (pasteable)
- Is my data secure?
  - `Yes. Sensitive data is protected using Firebase security rules and encryption for stored credentials. Follow secure admin practices when sharing owner access.`
- Can I manage shared accounts?
  - `Yes. Tapn supports shared accounts with automatic cost-splitting and usage tracking.`
- Does it calculate profit automatically?
  - `Yes. Enter tool cost and selling price; Tapn will compute profit and per-user cost shares.`
- Can I cancel anytime?
  - `Yes. You can upgrade, downgrade, or cancel a plan at any time. Owner-set billing terms apply for owner-managed plans.`

### Footer tagline (safe)
- `Tapn is an all-in-one platform for digital resellers to automate inventory, track profits, and scale securely.`

---

## 3. Testimonials & Trust Signals — Policy

### DO
- Use generic platform logos (e.g., icons for “tools” or categories) not brand logos unless you have permission.
- Use precise, small-sample testimonials (max 4) and store them in a dedicated collection or JSON file.

### DON’T
- Claim third-party logos or exact customer counts unless verifiable.
- Repeat the same testimonial multiple times.

---

## 4. Animations — Keep / Change Guidance

### Keep
- Framer Motion for small entrance animations, hover transitions, and modals.
- Animated counters for stats (but avoid large numbers unless real).

### Change / Performance rules
- Replace heavy GSAP + ScrollTrigger sequences that manipulate many DOM nodes with IntersectionObserver-based reveals where possible.
- Mobile rule: Disable complex scroll-triggered animations on screens narrower than 768px (matchMedia or runtime guard).
- Avoid animating box-shadow and transform frequently on many elements simultaneously.
- Ensure will-change is used sparingly.

### Implementation hint
- Use CSS transform + opacity for best performance; avoid layout-changing animations (top/left) in scroll sequences.

---

## 5. Firebase Data Model & Performance Guidance (Actionable)
Goal: minimize hot reads, avoid heavy document growth, keep queries index-friendly, and enable owner-managed plan control without expensive migrations.

### Recommended Firestore Collections (flattened for scale)

1) `users/{uid}`
- `role`: `owner | user | staff`
- `status`: `active | pending | paused`
- `planId`: string (reference to `plans/{planId}`)
- `salesCount`: int (optional cached)

Subcollections:
- `sales/{saleId}` — sale metadata (amount, toolRef, customerRef, createdAt, expiryAt). Use a capped size per user (see archival).
- `customers/{customerId}` — contact/phone/meta
- `vendors/{vendorId}` — vendor detail
- `inventory/{itemId}` — tool metadata (cost, price, credentialsEncryptedRef)

2) `plans/{planId}` (owner-controlled)
- `name`, `features` (array or map), `salesLimit`, `price`, `billingCycle`, `level`
- `planFeatures`: map of boolean flags

3) `settings/app_config` (single document)
- see fields in section 1

4) `staff_accounts/{staffUid}`
- `ownerUid`
- `permissions`: map of boolean flags

5) `ui_content/*`
- `ui_content/testimonials/{id}` — `name`, `title`, `quote`, `isSample`
- `ui_content/landing_copy` — grouped strings for i18n if needed

6) `credentials/{credId}` (optional)
- Store encrypted credentials externally; keep only references in inventory docs.

### Storage & Secrets
- Use Firebase Storage for large files (images/assets). Keep references in Firestore docs.
- Never store unencrypted credentials in Firestore. Use client-side encryption or store encrypted blobs in `credentials/` and secure keys in a secret manager.

### Indexing & Query Patterns
- Create composite index on `users/{uid}/sales` for `createdAt` and `expiryAt` for range queries.
- Add index on `inventory` docs for `vendorId` and `status` if filtering by vendor.
- Avoid fetching an entire big subcollection; use pagination (`limit` + `startAfter`).

### Archival & Data Growth
- Implement a background job (Cloud Function + Scheduler) that archives sales older than 365 days to `sales_archive/{userId}/{saleId}` and deletes the original to keep the working set small.
- Use Firestore TTL for temporary/session-like docs.

### Scheduled Expiry Reminders & WhatsApp
- Use Cloud Scheduler + Cloud Functions to run a daily job:
  - Query `sales` where `expiryAt` is between now and now + X days.
  - Mark reminders as sent to avoid duplicates.
  - Batch work (e.g., 100 users at a time).
- Offload WhatsApp sending to a secure server-side function; do not send WhatsApp messages directly from client devices.

### Owner Plan Changes (migrations)
- When owner updates `plans/{planId}` or toggles features, do not update each user document immediately.
- Evaluate feature flags at runtime based on the plan doc.
- If a migration is required (e.g., reducing limits), mark users with `needsPlanReview: true` and reconcile in a background job with notifications.

### Security Rules (must-have)
- Only owner UIDs can write to `plans/*` and `settings/app_config`.
- `users/{uid}` writable only by that uid or owner (for owner-managed operations) according to role mapping.
- Staff actions must validate `staff_accounts/{staffUid} → ownerUid` and permissions (prefer callable Cloud Functions).

---

## 6. Component & Class Changes (UI developer guidance)
- Keep (reusable classes): `btn-save`, `btn-secondary`, `icon-edit`, `icon-delete`, etc.
- Change:
  - Rename `btn-whatsapp` to `btn-send`
  - Add icon variant class `btn-send--whatsapp` for WhatsApp-specific styles (messaging service may change later).

### Modal UX
- Pricing request modal must include `planId` in the payload.
- Use onSubmit to call a server-side function that stores the request in `owner_requests/{requestId}` rather than emailing directly from the client.

---

## 7. Landing Page Implementation Checklist
- Replace all brand-logo marquees with generic “Popular Tools Managed” icons; remove third-party logos unless permission obtained.
- Replace hero & feature text with the exact strings in section 2.
- Update stats to use capability statements instead of numeric counters.
- Limit testimonials to 3–4 unique entries; add `isSample` flag and show the demo notice when needed.
- Pricing cards must not show hard prices unless `plans/{planId}.price` is present. If price is missing, show Contact Sales or Start Free Trial.
- Update FAQ answers with provided copy.
- Ensure `settings/app_config` is read once and cached.
- Add server-side Cloud Function + Scheduler for expiry reminders and WhatsApp sending.
- Implement archival job for old sales documents.
- Add Firestore indexes for `users/{uid}/sales` on `createdAt` and `expiryAt`.

---

## 8. Developer Tickets / PR Notes (copy-ready)
- PR Title: `Landing copy & data-safety updates — safe brand + firebase guidance`
- PR Description:
  - Replaced risky brand and numeric trust claims with safe marketing copy.
  - Rewrote hero, features, how-it-works, FAQ, and pricing copy per product architecture.
  - Limited testimonials and added sample-data disclaimer.
  - Added Firebase storage and security guidance in docs and created tickets for scheduled expiry reminders and archiving.
  - Added animation performance rules and mobile fallbacks.

---

## 9. Operational / Owner Notes
- Owner can update `settings/app_config` and `plans/*` at any time.\n- Major plan changes that reduce existing user privileges should be handled carefully — use `needsPlanReview` to flag impacted users and notify them before enforcement.\n- Keep legal copy / privacy policy accurate about data retention, encryption, and contact email.\n+
