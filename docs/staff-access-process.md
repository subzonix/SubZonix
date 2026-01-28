Your task is to implement a complete, secure, owner-managed staff permission system.

1️⃣ Core Rules (Must Follow Exactly)

Each owner can create multiple staff accounts

A staff account belongs to exactly one owner

Staff never owns data

Staff can only access their owner’s dashboard

Owner manually decides:

Which dashboard pages staff can access

Whether staff can read / write / delete

Frontend checks are UX-only

Firestore Security Rules are the source of truth

2️⃣ Staff Creation (Keep Existing Pattern)

Use Secondary Firebase App to create staff users (do NOT log out owner)

Create Firebase Auth user using createUserWithEmailAndPassword

After creation, store staff mapping in Firestore

Firestore Document

Collection: staff_accounts/{staffUid}

{
  ownerUid: string, // UID of owner who created the staff
  name: string,
  email: string,
  status: "active" | "disabled",
  permissions: {
    inventory: { read: boolean, write: boolean },
    sales: { read: boolean, write: boolean },
    customers: { read: boolean, write: boolean },
    analytics: { read: boolean },
    settings: { read: boolean }
  },
  createdAt: Timestamp
}

3️⃣ Owner-Scoped Data Structure (Do NOT Change)

All business data must live under owner UID.

users/{ownerUid}
  ├─ sales/{saleId}
  ├─ inventory/{itemId}
  ├─ customers/{customerId}
  ├─ vendors/{vendorId}
  ├─ analytics/{docId}


🚫 Staff must NEVER access /users/{anyOtherUid}
🚫 Staff must NEVER write to users/{staffUid}

4️⃣ AuthContext Logic (Frontend)
On Login:

If user is owner → load normally

Else:

Check staff_accounts/{uid}

If exists and status === "active":

Load ownerUid

Load permissions

Set role = "staff"

Else → deny access

Context Object:
{
  role: "owner" | "staff",
  ownerUid: string,
  staffPermissions: PermissionMap
}

5️⃣ Sidebar & Routing (UI Only)

Filter sidebar pages using staffPermissions

Protect routes using PlanFeatureGuard

UI hiding ≠ security
Firestore rules must still enforce everything

6️⃣ Firestore Security Rules (MANDATORY)
Helper Functions
function isOwner(ownerUid) {
  return request.auth.uid == ownerUid;
}

function staffDoc() {
  return get(
    /databases/$(database)/documents/staff_accounts/$(request.auth.uid)
  );
}

function isStaffOfOwner(ownerUid) {
  return exists(
    /databases/$(database)/documents/staff_accounts/$(request.auth.uid)
  )
  && staffDoc().data.ownerUid == ownerUid
  && staffDoc().data.status == "active";
}

function staffCan(ownerUid, feature, action) {
  return isStaffOfOwner(ownerUid)
    && staffDoc().data.permissions[feature][action] == true;
}

Example Rules
Inventory
match /users/{ownerUid}/inventory/{itemId} {
  allow read: if isOwner(ownerUid)
    || staffCan(ownerUid, "inventory", "read");

  allow write: if isOwner(ownerUid)
    || staffCan(ownerUid, "inventory", "write");
}

Sales
match /users/{ownerUid}/sales/{saleId} {
  allow read: if isOwner(ownerUid)
    || staffCan(ownerUid, "sales", "read");

  allow create, update, delete: if isOwner(ownerUid)
    || staffCan(ownerUid, "sales", "write");
}

Analytics (Read-only)
match /users/{ownerUid}/analytics/{docId} {
  allow read: if isOwner(ownerUid)
    || staffCan(ownerUid, "analytics", "read");

  allow write: if false;
}

7️⃣ Staff Access Revocation

When owner disables staff:

status = "disabled"


Firestore rules immediately block access

Optional future enhancement:

Use Admin SDK to disable Firebase Auth user

8️⃣ Performance & Safety Rules

Cache staff_accounts data in AuthContext

Do NOT refetch on every page load

Do NOT store permissions in localStorage without verification

Always resolve ownerUid before any Firestore query

9️⃣ Optional (Strongly Recommended)
Staff Activity Logs

Create:

staff_logs/{logId}
{
  staffUid,
  ownerUid,
  action,
  target,
  createdAt
}


Log:

Sale creation

Inventory edits

Customer deletion

10️⃣ Final Acceptance Criteria

✅ Owner controls all staff permissions manually
✅ Staff only accesses owner data
✅ Page access enforced in Firestore rules
✅ No cross-owner data leakage
✅ Ready for SaaS scale and audits