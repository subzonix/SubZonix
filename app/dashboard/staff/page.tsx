"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { firebaseConfig } from "@/lib/firebase";
import { initializeApp, getApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { FaUserPlus, FaTrash, FaShieldHalved, FaUserShield, FaCheck, FaXmark } from "react-icons/fa6";
import { PlanFeatures, StaffAccount, StaffPermissions } from "@/types";
import { useToast } from "@/context/ToastContext";
import PlanFeatureGuard from "@/components/PlanFeatureGuard";

const STAFF_LIMIT = 5;

const MODULES = [
    { key: "inventory", label: "Inventory Management" },
    { key: "sales", label: "Sales & POS" },
    { key: "customers", label: "Customer Database" },
    { key: "analytics", label: "Analytics (Read Only)", readOnly: true },
    { key: "settings", label: "Settings (Read Only)", readOnly: true },
];

const DEFAULT_PERMISSIONS: StaffPermissions = {
    inventory: { read: false, write: false },
    sales: { read: false, write: false },
    customers: { read: false, write: false },
    analytics: { read: false },
    settings: { read: false }
};

export default function StaffPage() {
    const { user, merchantId } = useAuth();
    const { showToast } = useToast();
    const [staff, setStaff] = useState<StaffAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [permissions, setPermissions] = useState<StaffPermissions>(DEFAULT_PERMISSIONS);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchStaff();
    }, [user]);

    const fetchStaff = async () => {
        try {
            const q = query(
                collection(db, "staff_accounts"),
                where("ownerUid", "==", user?.uid)
            );
            const snap = await getDocs(q);
            setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffAccount)));
        } catch (error) {
            console.error("Error fetching staff:", error);
            showToast("Failed to load staff members", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            // Update existing (Permissions & Name only for now, Auth updates require re-auth)
            try {
                await setDoc(doc(db, "staff_accounts", editingId), {
                    name,
                    email,
                    permissions,
                    status: "active"
                }, { merge: true });
                showToast("Staff updated successfully", "success");
                setModalOpen(false);
                resetForm();
                fetchStaff();
            } catch (err: any) {
                console.error("Update error:", err);
                showToast("Failed to update staff", "error");
            }
            return;
        }

        if (staff.length >= STAFF_LIMIT) {
            showToast(`Maximum allowed staff members is ${STAFF_LIMIT}`, "error");
            return;
        }

        setCreating(true);
        let secondaryApp: any = null;

        try {
            // 1. Initialize secondary app to create user without logging out owner
            const appName = "SecondaryApp-" + Date.now();
            secondaryApp = initializeApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryApp);

            // 2. Create Auth User
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUid = cred.user.uid;

            // 3. Create 'staff_accounts' doc for Permissions & Linking
            await setDoc(doc(db, "staff_accounts", newUid), {
                ownerUid: user?.uid,
                name,
                email,
                permissions,
                status: "active",
                createdAt: Date.now()
            });

            showToast("Staff member created successfully!", "success");
            setModalOpen(false);
            resetForm();
            fetchStaff();

        } catch (error: any) {
            console.error("Error creating staff:", error);
            if (error.code === 'auth/email-already-in-use') {
                showToast("Email is already registered. Please use a different email.", "error");
            } else {
                showToast("Error: " + error.message, "error");
            }
        } finally {
            if (secondaryApp) await deleteApp(secondaryApp);
            setCreating(false);
        }
    };

    const resetForm = () => {
        setName("");
        setEmail("");
        setPassword("");
        setName("");
        setEmail("");
        setPassword("");
        setPermissions(DEFAULT_PERMISSIONS);
        setEditingId(null);
    };

    const handleDelete = async (staffId: string) => {
        const ok = await confirm({
            title: "Remove Staff Access",
            message: "Are you sure you want to remove this staff member? They will lose access to the dashboard immediately.",
            confirmText: "Remove Access",
            variant: "danger"
        } as any);

        if (!ok) return;

        try {
            await deleteDoc(doc(db, "staff_accounts", staffId));
            // Success - update UI
            showToast("Staff access removed successfully", "success");
            fetchStaff();
        } catch (error: any) {
            console.error("Error removing staff:", error);
            showToast("Error: " + error.message, "error");
        }
    };

    const togglePermission = (module: keyof StaffPermissions, type: "read" | "write") => {
        setPermissions(prev => {
            const currentModule = prev[module];
            // If checking 'write', force 'read' to be true
            if (type === "write" && !(currentModule as any).write) {
                return {
                    ...prev,
                    [module]: { ...currentModule, read: true, write: true }
                };
            }
            // If unchecking 'read', force 'write' to be false
            if (type === "read" && (currentModule as any).read) {
                return {
                    ...prev,
                    [module]: { ...currentModule, read: false, write: false } // Safety for modules with write
                };
            }

            return {
                ...prev,
                [module]: { ...currentModule, [type]: !(currentModule as any)[type] }
            };
        });
    };

    const handleEdit = (member: StaffAccount) => {
        setName(member.name);
        setEmail(member.email || "");
        setPermissions(member.permissions || {});
        setEditingId(member.id);
        setModalOpen(true);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Staff Access</h1>
                    <p className="text-slate-500 mt-1">Manage team access and permissions</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    disabled={staff.length >= STAFF_LIMIT}
                    className="btn-save"
                >
                    <FaUserPlus /> Add Staff
                </button>
            </div>

            {/* Staff List */}
            <div className="grid gap-4">
                {staff.map((member) => (
                    <div key={member.id} className="bg-card p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{member.name}</h3>
                                <p className="text-sm text-slate-500">{member.email}</p>
                            </div>
                        </div>

                        <div className="flex-1 max-w-lg">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Access Rights</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(member.permissions || {}).map(([key, val]) => {
                                    const v = val as { read?: boolean; write?: boolean };
                                    return v.read && (
                                        <span key={key} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-lg text-slate-600 dark:text-slate-300 border border-border flex items-center gap-1">
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                            {v.write && <span className="bg-indigo-100 text-indigo-700 px-1 rounded text-[8px]">Editor</span>}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(member)}
                                className="icon-edit"
                                title="Edit Access"
                            >
                                <FaUserShield />
                            </button>
                            <button
                                onClick={() => handleDelete(member.id)}
                                className="icon-delete"
                                title="Remove Access"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}

                {staff.length === 0 && !loading && (
                    <div className="text-center py-20 text-slate-400">
                        <FaUserShield className="text-4xl mx-auto mb-4 opacity-20" />
                        <p>No staff members found.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editingId ? "Edit Staff Access" : "Add New Staff"}</h2>
                            <button onClick={() => { setModalOpen(false); resetForm(); }} className="icon-cancel" title="Close"><FaXmark className="text-md" /></button>
                        </div>

                        <form onSubmit={handleCreateStaff} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Staff Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Login Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="staff@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Min 6 characters"
                                    minLength={6}
                                    disabled={!!editingId} // Cannot edit password directly
                                />
                                {editingId && <p className="text-[10px] text-amber-500 mt-1">* Password cannot be changed here. Delete and recreate for new password.</p>}
                            </div>

                            <div className="pt-2">
                                <label className="text-xs font-bold uppercase text-slate-500 mb-3 block">Page Permissions</label>
                                <div className="space-y-3">
                                    {MODULES.map((mod) => {
                                        const p = permissions[mod.key as keyof StaffPermissions];
                                        return (
                                            <div key={mod.key} className="flex items-center justify-between p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-white/5">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{mod.label}</span>
                                                <div className="flex items-center gap-4">
                                                    {/* Read Toggle */}
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!(p as any).read}
                                                            onChange={() => togglePermission(mod.key as any, "read")}
                                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-xs font-medium">View</span>
                                                    </label>

                                                    {/* Write Toggle (if applicable) */}
                                                    {!mod.readOnly && (
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!(p as any).write}
                                                                onChange={() => togglePermission(mod.key as any, "write")}
                                                                disabled={!(p as any).read} // Must have read to write
                                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                                            />
                                                            <span className="text-xs font-medium">Edit</span>
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full btn-save-cdrp disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? "Processing..." : (editingId ? "Update Permissions" : "Create Staff & Grant Access")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
