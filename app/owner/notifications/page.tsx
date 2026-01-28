"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaBell, FaPaperPlane, FaTrash, FaClock, FaArrowsLeftRight, FaStop, FaArrowRight, FaShieldHalved } from "react-icons/fa6";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";

interface UserProfile {
    id: string;
    email: string;
    role: "owner" | "user";
}

interface AppNotification {
    id: string;
    message: string;
    type: string;
    target: "global" | "user";
    userId?: string;
    createdAt: number;
    expiresAt?: number;
    behavior?: "moving" | "fixed";
}

export default function NotificationsPage() {
    const [notifMessage, setNotifMessage] = useState("");
    const [notifType, setNotifType] = useState<"info" | "warning" | "alert">("info");
    const [notifTarget, setNotifTarget] = useState<"global" | "user">("global");
    const [notifBehavior, setNotifBehavior] = useState<"moving" | "fixed">("moving");
    const [selectedUserForNotif, setSelectedUserForNotif] = useState("");
    const [durationHours, setDurationHours] = useState(24);
    const [loading, setLoading] = useState(false);

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { showToast, confirm } = useToast();
    const router = useRouter();

    useEffect(() => {
        // Fetch users for dropdown
        const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
        });

        // Fetch notifications
        const unsubNotifs = onSnapshot(collection(db, "notifications"), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
            data.sort((a, b) => b.createdAt - a.createdAt);
            setNotifications(data);
        });

        return () => {
            unsubUsers();
            unsubNotifs();
        };
    }, []);

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notifMessage.trim()) {
            showToast("Please enter a message", "error");
            return;
        }
        if (notifTarget === "user" && !selectedUserForNotif) {
            showToast("Please select a user", "error");
            return;
        }

        setLoading(true);
        try {
            const expiry = Date.now() + (durationHours * 60 * 60 * 1000);
            await addDoc(collection(db, "notifications"), {
                message: notifMessage,
                type: notifType,
                target: notifTarget,
                userId: notifTarget === "user" ? selectedUserForNotif : null,
                behavior: notifBehavior,
                createdAt: Date.now(),
                expiresAt: expiry
            });
            setNotifMessage("");
            showToast("Notification Sent Successfully!", "success");
        } catch (error: any) {
            console.error("Error sending notification:", error);
            showToast("Failed to send: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: "Delete Notification",
            message: "Are you sure you want to delete this notification?",
            confirmText: "Delete",
            variant: "danger"
        });
        if (ok) {
            try {
                await deleteDoc(doc(db, "notifications", id));
                showToast("Notification deleted", "success");
            } catch (e: any) {
                showToast("Delete failed", "error");
            }
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        const ok = await confirm({
            title: "Delete Selected",
            message: `Are you sure you want to delete ${selectedIds.length} selected notifications?`,
            confirmText: "Delete All Selected",
            variant: "danger"
        });
        if (ok) {
            try {
                const batch = writeBatch(db);
                selectedIds.forEach(id => {
                    batch.delete(doc(db, "notifications", id));
                });
                await batch.commit();
                setSelectedIds([]);
                showToast("Selected notifications deleted", "success");
            } catch (e: any) {
                showToast("Batch delete failed", "error");
            }
        }
    };

    const handleDeleteAll = async () => {
        if (notifications.length === 0) return;
        const ok = await confirm({
            title: "Delete All Notifications",
            message: "Are you sure you want to delete ALL notifications? This action cannot be undone.",
            confirmText: "Yes, Delete All",
            variant: "danger"
        });
        if (ok) {
            try {
                const batch = writeBatch(db);
                notifications.forEach(n => {
                    batch.delete(doc(db, "notifications", n.id));
                });
                await batch.commit();
                setSelectedIds([]);
                showToast("All notifications deleted", "success");
            } catch (e: any) {
                showToast("Clear all failed", "error");
            }
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === notifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notifications.map(n => n.id));
        }
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <FaBell className="text-amber-500" /> Notifications Manager
            </h1>

            {notifications.filter(n => n.type === 'plan_request' || (n as any).isPublicRequest).length > 0 && (
                <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-l-4 border-purple-500 p-4 rounded-r-2xl animate-in fade-in slide-in-from-left-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white animate-pulse">
                            <FaShieldHalved className="text-xs" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-purple-400 uppercase tracking-wider">New Plan Requests</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">There are users waiting for plan upgrades or access.</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Creator */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg shadow-black/5 dark:shadow-black/40">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FaPaperPlane /> Create Notification
                </h2>
                <form onSubmit={handleSendNotification} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Message content..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-amber-500 outline-none transition-colors"
                        value={notifMessage}
                        onChange={e => setNotifMessage(e.target.value)}
                    />

                    <div className="flex flex-wrap gap-4 items-center bg-slate-50/60 dark:bg-white/5 p-3 rounded-xl border border-border">
                        {/* Type */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground font-bold uppercase">Type:</label>
                            <select
                                value={notifType}
                                onChange={e => setNotifType(e.target.value as any)}
                                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-amber-500 transition-colors"
                            >
                                <option value="info">Info (Blue)</option>
                                <option value="warning">Warning (Amber)</option>
                                <option value="alert">Alert (Red)</option>
                            </select>
                        </div>

                        {/* Target */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground font-bold uppercase">Target:</label>
                            <select
                                value={notifTarget}
                                onChange={e => setNotifTarget(e.target.value as any)}
                                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-amber-500 transition-colors"
                            >
                                <option value="global">Global (All Users)</option>
                                <option value="user">Specific User</option>
                            </select>
                            {notifTarget === "user" && (
                                <select
                                    value={selectedUserForNotif}
                                    onChange={e => setSelectedUserForNotif(e.target.value)}
                                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground max-w-[150px] transition-colors"
                                >
                                    <option value="">Select User...</option>
                                    {users.filter(u => u.role !== "owner").map(u => (
                                        <option key={u.id} value={u.id}>{u.email}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground font-bold uppercase flex items-center gap-1"><FaClock /> Duration:</label>
                            <select
                                value={durationHours}
                                onChange={e => setDurationHours(Number(e.target.value))}
                                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-amber-500 transition-colors"
                            >
                                <option value={1}>1 Hour</option>
                                <option value={6}>6 Hours</option>
                                <option value={12}>12 Hours</option>
                                <option value={24}>24 Hours</option>
                                <option value={48}>2 Days</option>
                                <option value={168}>1 Week</option>
                            </select>
                        </div>

                        {/* Behavior */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground font-bold uppercase">Behavior:</label>
                            <div className="flex p-0.5 rounded-lg bg-muted/60 border border-border overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setNotifBehavior("moving")}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${notifBehavior === "moving" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <FaArrowsLeftRight className="text-[8px]" /> Moving
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNotifBehavior("fixed")}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${notifBehavior === "fixed" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <FaStop className="text-[8px]" /> Fixed
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-2 px-8 rounded-xl text-sm shadow-lg hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Sending..." : "Send Notification"}
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Notifications</h3>
                        {notifications.length > 0 && (
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === notifications.length && notifications.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-border bg-background text-amber-500 focus:ring-amber-500/20"
                                />
                                <span className="text-[10px] text-slate-500 font-bold uppercase group-hover:text-slate-400 transition-colors">Select All</span>
                            </label>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                            >
                                <FaTrash className="text-[8px]" /> Delete Selected ({selectedIds.length})
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={handleDeleteAll}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-border rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95"
                            >
                                <FaTrash className="text-[8px]" /> Delete All
                            </button>
                        )}
                    </div>
                </div>

                {(() => {
                    const activeNotifications = notifications.filter(n => !n.expiresAt || n.expiresAt > Date.now());

                    // Separate notifications by type
                    const planRequests = activeNotifications.filter(n => n.type === 'plan_request' || (n as any).isPublicRequest);
                    const systemNotifications = activeNotifications.filter(n => n.type !== 'plan_request' && !(n as any).isPublicRequest);

                    if (activeNotifications.length === 0) {
                        return (
                            <div className="text-center py-20 bg-card/50 rounded-3xl border border-dashed border-border">
                                <FaBell className="text-4xl text-muted-foreground mx-auto mb-3 opacity-60" />
                                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">No active notifications</p>
                            </div>
                        );
                    }

                    return (
                        <>
                            {/* Plan Requests Section */}
                            {planRequests.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider px-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        Plan Requests ({planRequests.length})
                                    </h4>
                                    <div className="divide-y divide-border bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                        {planRequests.map(n => renderNotificationCard(n))}
                                    </div>
                                </div>
                            )}

                            {/* System Notifications Section */}
                            {systemNotifications.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider px-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        System Notifications ({systemNotifications.length})
                                    </h4>
                                    <div className="divide-y divide-border bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                        {systemNotifications.map(n => renderNotificationCard(n))}
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );

    function renderNotificationCard(n: AppNotification) {
        const isExpired = n.expiresAt && Date.now() > n.expiresAt;
        const isSelected = selectedIds.includes(n.id);
        return (
            <div key={n.id} className={`p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group ${isSelected ? 'bg-amber-500/5' : ''}`}>
                <div className="flex items-center gap-4 flex-1">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(n.id)}
                        className="w-4 h-4 rounded border-border bg-background text-amber-500 focus:ring-amber-500/20"
                    />
                    <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${n.type === 'alert' ? 'bg-red-500 shadow-red-500/20' : n.type === 'warning' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-indigo-500 shadow-indigo-500/20'}`} />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm text-foreground font-bold tracking-tight">{n.message}</div>
                            {/* Show badge for public requests */}
                            {(n as any).isPublicRequest && (
                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-[9px] font-black uppercase tracking-wider">
                                    Public Request
                                </span>
                            )}
                        </div>
                        {/* Show user details for public requests */}
                        {(n as any).isPublicRequest && (
                            <div className="text-xs text-muted-foreground mb-2 space-y-1">
                                <div><span className="font-bold text-slate-700 dark:text-slate-300">Name:</span> {(n as any).name}</div>
                                <div><span className="font-bold text-slate-700 dark:text-slate-300">Email:</span> {(n as any).email}</div>
                                <div><span className="font-bold text-slate-700 dark:text-slate-300">WhatsApp:</span> {(n as any).whatsapp}</div>
                                {(n as any).planName && <div><span className="font-bold text-slate-700 dark:text-slate-300">Requested Plan:</span> {(n as any).planName}</div>}
                            </div>
                        )}
                        {/* Action Buttons */}
                        {(n.type === 'plan_request' || (n as any).isPublicRequest) && (
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => router.push(`/owner/users?userId=${n.userId || ''}&plan=${(n as any).planName || ''}`)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                                >
                                    Give Access <FaArrowRight className="text-[8px]" />
                                </button>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] text-muted-foreground mt-1 font-bold uppercase tracking-tight">
                            <span className="flex items-center gap-1 opacity-60"><FaClock className="text-[8px]" /> {new Date(n.createdAt).toLocaleString()}</span>
                            {n.expiresAt && <span className={isExpired ? "text-red-500" : "opacity-60"}>Expires: {new Date(n.expiresAt).toLocaleString()}</span>}
                            <span className="bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-lg border border-border">{n.target}</span>
                            {n.behavior && (
                                <span className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 ${n.behavior === 'fixed' ? 'bg-muted/60 text-muted-foreground border-border' : 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20'}`}>
                                    {n.behavior === 'fixed' ? <FaStop className="text-[7px]" /> : <FaArrowsLeftRight className="text-[7px]" />}
                                    {n.behavior || 'moving'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button onClick={() => handleDelete(n.id)} className="text-muted-foreground hover:text-red-500 transition-all p-2 hover:bg-red-500/10 rounded-xl group-hover:opacity-100 opacity-0 md:opacity-100">
                    <FaTrash className="text-sm" />
                </button>
            </div>
        );
    }
}

