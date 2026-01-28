"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaUserCheck, FaUserSlash, FaClockRotateLeft, FaMagnifyingGlass, FaTrash, FaDatabase, FaTriangleExclamation, FaGem, FaCalendar } from "react-icons/fa6";
import UserHistoryModal from "@/components/admin/UserHistoryModal";
import { useToast } from "@/context/ToastContext";
import { Card, Button, Input } from "@/components/ui/Shared";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";

interface UserProfile {
    id: string;
    email: string;
    role: "owner" | "user";
    status: "active" | "pending" | "paused";
    createdAt?: number;
    companyName?: string;
    planName?: string;
    planId?: string;
    salesLimit?: number;
    currentSalesCount?: number;
    planExpiry?: number;
}

interface Plan {
    id: string;
    name: string;
    salesLimit: number;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [historyUserId, setHistoryUserId] = useState<string | null>(null);

    // Plan Management
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedUserForPlan, setSelectedUserForPlan] = useState<UserProfile | null>(null);
    const [planForm, setPlanForm] = useState({
        planId: "",
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });
    const { showToast } = useToast();
    const searchParams = useSearchParams();

    // Auto-open plan modal if userId/plan in query
    useEffect(() => {
        if (!isLoading && users.length > 0 && plans.length > 0) {
            const targetId = searchParams.get("userId");
            const targetPlanName = searchParams.get("plan");

            if (targetId) {
                const user = users.find(u => u.id === targetId);
                if (user) {
                    setSelectedUserForPlan(user);
                    setSearchTerm(user.email); // Filter list to this user

                    if (targetPlanName) {
                        const plan = plans.find(p => p.name.toLowerCase().includes(targetPlanName.toLowerCase()));
                        if (plan) {
                            setPlanForm(prev => ({ ...prev, planId: plan.id }));
                        }
                    }
                }
            }
        }
    }, [isLoading, users, plans, searchParams]);

    // Fetch Users & Plans
    useEffect(() => {
        const qUsers = query(collection(db, "users"));
        const unsubUsers = onSnapshot(qUsers, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            setUsers(data);
            setIsLoading(false);
        });

        const qPlans = query(collection(db, "plans"));
        const unsubPlans = onSnapshot(qPlans, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
            setPlans(data);
        });

        return () => {
            unsubUsers();
            unsubPlans();
        };
    }, []);

    const handleStatusChange = async (userId: string, newStatus: "active" | "paused") => {
        try {
            await updateDoc(doc(db, "users", userId), { status: newStatus });
            showToast(`User status updated to ${newStatus}`, "success");
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Failed to update status", "error");
        }
    };

    const handleAssignPlan = async () => {
        if (!selectedUserForPlan || !planForm.planId) return;
        const plan = plans.find(p => p.id === planForm.planId);
        if (!plan) return;

        try {
            setIsLoading(true);
            await updateDoc(doc(db, "users", selectedUserForPlan.id), {
                planId: plan.id,
                planName: plan.name,
                salesLimit: plan.salesLimit,
                planExpiry: new Date(planForm.expiryDate).getTime(),
                status: "active",
                currentSalesCount: selectedUserForPlan.currentSalesCount || 0
            });
            setSelectedUserForPlan(null);
            showToast(`Plan ${plan.name} assigned successfully`, "success");
        } catch (error) {
            console.error("Error assigning plan:", error);
            showToast("Failed to assign plan", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to DELETE this user? Their data will be permanently removed.")) return;
        try {
            setIsLoading(true);
            const batch = writeBatch(db);
            batch.delete(doc(db, "users", userId));
            const collections = ["inventory", "salesHistory", "vendors", "settings", "user_logs"];
            for (const colName of collections) {
                const q = query(collection(db, "users", userId, colName));
                const snap = await getDocs(q);
                snap.docs.forEach(d => batch.delete(d.ref));
            }
            await batch.commit();
            showToast("User deleted successfully.", "success");
        } catch (error) {
            console.error("Error deleting user:", error);
            showToast("Failed to delete user.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSystemReset = async () => {
        const confirm1 = confirm("DANGER: This will delete ALL data (Inventory, Sales, Vendors) for ALL users. Are you sure?");
        if (!confirm1) return;
        const confirm2 = confirm("FINAL WARNING: This action cannot be undone. Type 'DELETE' to confirm.");
        if (!confirm2) return;

        try {
            setIsLoading(true);
            const usersSnap = await getDocs(collection(db, "users"));
            const batch = writeBatch(db);
            let count = 0;
            const subcollections = ["inventory", "salesHistory", "vendors", "user_logs", "notifications", "settings"];

            for (const userDoc of usersSnap.docs) {
                const uid = userDoc.id;
                for (const colName of subcollections) {
                    if (colName === "notifications") continue;
                    const snap = await getDocs(collection(db, "users", uid, colName));
                    for (const d of snap.docs) {
                        batch.delete(d.ref);
                        count++;
                        if (count >= 400) {
                            await batch.commit();
                            count = 0;
                        }
                    }
                }
            }
            const notifSnap = await getDocs(collection(db, "notifications"));
            for (const d of notifSnap.docs) {
                batch.delete(d.ref);
                count++;
                if (count >= 400) {
                    await batch.commit();
                    count = 0;
                }
            }
            if (count > 0) await batch.commit();
            showToast("System Reset Complete.", "success");
        } catch (error) {
            console.error("Reset failed:", error);
            showToast("Reset failed.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Loading User Management...</div>;
    }

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg shadow-black/5 dark:shadow-black/40 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Registered Users</h2>
                    <div className="relative">
                        <FaMagnifyingGlass className="absolute left-3 top-2.5 text-slate-500 text-xs" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-amber-500 outline-none w-64 transition-colors"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-xl">User</th>
                                <th className="px-4 py-3">Role / Plan</th>
                                <th className="px-4 py-3">Status / Usage</th>
                                <th className="px-4 py-3">Joined</th>
                                <th className="px-4 py-3 rounded-tr-xl text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{u.email}</div>
                                        {u.companyName && <div className="text-[10px] text-muted-foreground">{u.companyName}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="space-y-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.role === 'owner' ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20' : 'bg-muted/60 text-muted-foreground border border-border'}`}>
                                                {u.role}
                                            </span>
                                            {u.role !== 'owner' && (
                                                <div className="flex items-center gap-1">
                                                    <FaGem className="text-[10px] text-amber-500" />
                                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase">{u.planName || 'No Plan'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="space-y-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold 
                                        ${u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    u.status === 'paused' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-amber-500/20 text-amber-400'}`}>
                                                {u.status}
                                            </span>
                                            {u.role !== 'owner' && u.salesLimit && (
                                                <div className="w-24">
                                                    <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase mb-1">
                                                        <span>Usage</span>
                                                        <span>{u.currentSalesCount || 0}/{u.salesLimit}</span>
                                                    </div>
                                                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={clsx("h-full transition-all", (u.currentSalesCount || 0) / u.salesLimit > 0.9 ? "bg-rose-500" : "bg-emerald-500")}
                                                            style={{ width: `${Math.min(100, ((u.currentSalesCount || 0) / u.salesLimit) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        <div className="space-y-1 text-[10px] text-slate-500">
                                            <div>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</div>
                                            {u.planExpiry && (
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <FaCalendar className="text-[9px]" />
                                                    <span>Exp: {new Date(u.planExpiry).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2.5">
                                            {u.role !== "owner" && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUserForPlan(u);
                                                            setPlanForm(prev => ({ ...prev, planId: u.planId || "" }));
                                                        }}
                                                        title="Manage Plan"
                                                        className="p-2 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-amber-500/20"
                                                    >
                                                        <FaGem className="text-xs" />
                                                    </button>
                                                    {u.status !== "active" && (
                                                        <button
                                                            onClick={() => handleStatusChange(u.id, "active")}
                                                            title="Activate User"
                                                            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-emerald-500/20"
                                                        >
                                                            <FaUserCheck className="text-xs" />
                                                        </button>
                                                    )}
                                                    {u.status === "active" && (
                                                        <button
                                                            onClick={() => handleStatusChange(u.id, "paused")}
                                                            title="Pause Access"
                                                            className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-rose-500/20"
                                                        >
                                                            <FaUserSlash className="text-xs" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                onClick={() => setHistoryUserId(u.id)}
                                                title="View History"
                                                className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-indigo-500/20"
                                            >
                                                <FaClockRotateLeft className="text-xs" />
                                            </button>
                                            {u.role !== "owner" && (
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    title="Delete User & Data"
                                                    className="p-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-border rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-rose-600/20"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dangerous Actions */}
            <div className="bg-card border border-rose-500/20 rounded-2xl p-6 shadow-lg shadow-black/5 dark:shadow-black/40 mt-8">
                <h2 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FaTriangleExclamation /> Danger Zone
                </h2>
                <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                    <div>
                        <div className="text-sm font-bold text-rose-600 dark:text-rose-400">System Reset</div>
                        <div className="text-xs text-rose-600/70 dark:text-rose-400/60">Permanently delete ALL Inventory, Sales, Vendor, and User data. Irreversible.</div>
                    </div>
                    <button
                        onClick={handleSystemReset}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition border border-red-500/20"
                    >
                        <FaDatabase /> Reset Database
                    </button>
                </div>
            </div>

            {/* History Modal */}
            {historyUserId && (
                <UserHistoryModal userId={historyUserId} onClose={() => setHistoryUserId(null)} />
            )}

            {/* Plan Assignment Modal */}
            {selectedUserForPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-border flex items-center justify-between mb-6">
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <FaGem className="text-amber-500" /> Assign Plan
                            </h3>
                            <button onClick={() => setSelectedUserForPlan(null)} className="text-muted-foreground hover:text-foreground transition-colors"><FaTriangleExclamation /></button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-black tracking-widest">Select Plan</label>
                                <select
                                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                    value={planForm.planId}
                                    onChange={(e) => setPlanForm({ ...planForm, planId: e.target.value })}
                                >
                                    <option value="">Select a Plan</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.salesLimit} Sales)</option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label="Expiry Date"
                                type="date"
                                value={planForm.expiryDate}
                                onChange={(e: any) => setPlanForm({ ...planForm, expiryDate: e.target.value })}
                            />

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <p className="text-[10px] text-amber-500 font-bold leading-relaxed">
                                    Assigning a plan will automatically set the user's status to **ACTIVE** and enforce the sales limit.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setSelectedUserForPlan(null)}>Cancel</Button>
                            <Button className="flex-2" onClick={handleAssignPlan}>Confirm Assignment</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
