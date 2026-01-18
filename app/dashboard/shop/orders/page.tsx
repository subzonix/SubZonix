"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, where, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, Button } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { FaShop, FaClock, FaCheck, FaRotateLeft, FaUser, FaEnvelope, FaWhatsapp, FaArrowLeft, FaArrowTrendUp } from "react-icons/fa6";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export default function ShopOrdersPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadOrders();
        }
    }, [user]);

    const loadOrders = async () => {
        try {
            const q = query(
                collection(db, "notifications"),
                where("userId", "==", user!.uid),
                where("type", "==", "shop_order"),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            const fetchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

            // Auto-deletion logic (older than 3 days)
            const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
            const toDelete = fetchedOrders.filter(o => {
                const created = o.createdAt?.toMillis() || 0;
                return created < threeDaysAgo;
            });

            if (toDelete.length > 0) {
                console.log(`Auto-deleting ${toDelete.length} old orders...`);
                for (const order of toDelete) {
                    await deleteDoc(doc(db, "notifications", order.id));
                }
                // Refresh list after deletion
                setOrders(fetchedOrders.filter(o => !toDelete.find(td => td.id === o.id)));
            } else {
                setOrders(fetchedOrders);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string, status: string) => {
        try {
            await updateDoc(doc(db, "notifications", id), {
                status: status === "read" ? "unread" : "read"
            });
            setOrders(orders.map(o => o.id === id ? { ...o, status: status === "read" ? "unread" : "read" } : o));
            showToast(`Order marked as ${status === "read" ? "unread" : "read"}`, "success");
        } catch (e: any) {
            showToast("Error update status: " + e.message, "error");
        }
    };

    const convertToSale = (order: any) => {
        const saleData = {
            clientName: order.customerName,
            clientPhone: order.customerPhone,
            clientEmail: order.customerEmail || "",
            items: order.items?.map((item: any) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })) || []
        };
        sessionStorage.setItem("pending_order_sale", JSON.stringify(saleData));
        router.push("/dashboard/new-sale");
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/shop"
                        className="p-3 text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight italic">Shop Order History</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">View and manage all public shop requests</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        Total {orders.length} Orders
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <Card className="p-20 text-center flex flex-col items-center justify-center border-dashed border-2">
                    <FaShop className="text-5xl text-slate-300 mb-4" />
                    <p className="text-slate-500 font-black uppercase tracking-widest">No orders yet</p>
                    <p className="text-xs text-slate-400 mt-2">Orders from your public shop will appear here.</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {/* Header Row (Desktop) */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <div className="col-span-3">Customer Information</div>
                        <div className="col-span-3">Ordered Items</div>
                        <div className="col-span-1">Ordered Quantity</div>
                        <div className="col-span-2 text-center">Total Amount</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {orders.map((order) => (
                        <Card key={order.id} className={clsx(
                            "group transition-all duration-300 border-none shadow-sm hover:shadow-md",
                            order.status === "unread" ? " border-l-4 border-l-indigo-500" : ""
                        )}>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-4 lg:p-6">
                                {/* Customer Column */}
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                        order.status === "unread" ? "bg-indigo-500/10 text-indigo-500" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <FaUser className="text-sm" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black uppercase tracking-tight truncate">{order.customerName}</h4>
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                                <FaWhatsapp className="text-emerald-500" /> {order.customerPhone}
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-medium truncate">
                                                {new Date(order.createdAt?.toMillis()).toLocaleDateString()} at {new Date(order.createdAt?.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Column */}
                                <div className="col-span-3  rounded-xl p-3">
                                    <div className="flex flex-wrap gap-2">
                                        {order.items?.map((item: any, idx: number) => (
                                            <div key={idx} className=" px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold flex items-center gap-2">
                                                <span className=" uppercase">{item.name}</span>
                                            </div>
                                        )) || (
                                                <p className="text-[10px] text-slate-500 italic px-2">{order.message}</p>
                                            )}
                                    </div>
                                </div>

                                {/* {items quantity} */}
                                <div className="col-span-1">
                                    <div className="flex flex-wrap gap-2">
                                        {order.items?.map((item: any, idx: number) => (
                                            <div key={idx} className=" px-2 py-1 text-[15px] font-bold flex items-center gap-2">
                                                <span className="text-indigo-500 font-black uppercase">{item.quantity}</span>
                                            </div>
                                        )) || (
                                                <p className="text-[10px] text-slate-500 italic px-2">{order.message}</p>
                                            )}
                                    </div>
                                </div>

                                {/* Total Column */}
                                <div className="col-span-2 text-center">
                                    <div className="text-lg font-black tracking-tighter text-indigo-500">
                                        Rs.{order.total}
                                    </div>
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Payment Pending</div>
                                </div>

                                {/* Actions Column */}
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => convertToSale(order)}
                                        title="Convert to Sale"
                                        className="p-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-90"
                                    >
                                        <FaArrowTrendUp className="text-sm" />
                                    </button>
                                    <button
                                        onClick={() => markAsRead(order.id, order.status)}
                                        title={order.status === "unread" ? "Mark as Done" : "Mark as Unread"}
                                        className={clsx(
                                            "p-2.5 rounded-xl transition-all active:scale-90",
                                            order.status === "unread" ? "bg-slate-900 text-white hover:bg-black" : "bg-slate-100 text-slate-500"
                                        )}
                                    >
                                        {order.status === "unread" ? <FaCheck className="text-emerald-500 text-sm" /> : <FaRotateLeft className="text-indigo-500 text-sm" />}
                                    </button>
                                    <a
                                        href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-90"
                                    >
                                        <FaWhatsapp className="text-sm" />
                                    </a>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
