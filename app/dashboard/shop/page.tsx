"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Input, Select } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { FaShop, FaPlus, FaPencil, FaTrash, FaLink, FaCartShopping, FaCircleInfo, FaArrowRight, FaClock, FaBox, FaChartLine, FaCircleCheck, FaLayerGroup, FaTags, FaStore } from "react-icons/fa6";
import clsx from "clsx";
import Link from "next/link";
import ToolLogo from "@/components/ui/ToolLogo";
import { motion, AnimatePresence } from "framer-motion";

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    status: "active" | "inactive";
    createdAt: any;
}

export default function ShopManagementPage() {
    const { user } = useAuth();
    const { showToast, confirm } = useToast();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        status: "active" as "active" | "inactive"
    });
    const [submitting, setSubmitting] = useState(false);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    const [companyName, setCompanyName] = useState("");

    useEffect(() => {
        if (user) {
            loadItems();
            loadRecentOrders();
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        try {
            const snap = await getDoc(doc(db, "users", user!.uid, "settings", "general"));
            if (snap.exists()) {
                setCompanyName(snap.data().companyName || "");
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        }
    };

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    };

    const loadItems = async () => {
        try {
            const q = query(collection(db, "users", user!.uid, "shop_items"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopItem)));
        } catch (error) {
            console.error("Error loading shop items:", error);
        } finally {
            setLoading(false);
        }
    };

    const [indexError, setIndexError] = useState(false);

    const loadRecentOrders = async () => {
        try {
            const q = query(
                collection(db, "notifications"),
                where("userId", "==", user!.uid),
                where("type", "==", "shop_order"),
                orderBy("createdAt", "desc"),
                limit(5)
            );
            const snap = await getDocs(q);
            setRecentOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setIndexError(false);
        } catch (error: any) {
            console.error("Error loading orders:", error);
            if (error.message?.includes("index")) {
                setIndexError(true);
            }
        }
    };

    const handleOpenModal = (item?: ShopItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description,
                price: item.price.toString(),
                imageUrl: item.imageUrl,
                status: item.status
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: "",
                description: "",
                price: "",
                imageUrl: "",
                status: "active"
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price) {
            showToast("Please fill in required fields", "error");
            return;
        }

        setSubmitting(true);
        try {
            const data = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                imageUrl: formData.imageUrl,
                status: formData.status,
                updatedAt: serverTimestamp()
            };

            if (editingItem) {
                await updateDoc(doc(db, "users", user!.uid, "shop_items", editingItem.id), data);
                showToast("Product updated successfully", "success");
            } else {
                await addDoc(collection(db, "users", user!.uid, "shop_items"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
                showToast("Product added successfully", "success");
            }
            setShowModal(false);
            loadItems();
        } catch (error: any) {
            showToast("Error: " + error.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: "Delete Product",
            message: "Are you sure you want to remove this product from your shop?",
            confirmText: "Delete",
            variant: "danger"
        });

        if (ok) {
            try {
                await deleteDoc(doc(db, "users", user!.uid, "shop_items", id));
                showToast("Product deleted", "success");
                loadItems();
            } catch (error: any) {
                showToast("Error: " + error.message, "error");
            }
        }
    };

    const stats = {
        total: items.length,
        active: items.filter(i => i.status === "active").length,
        inactive: items.filter(i => i.status === "inactive").length,
        totalValue: items.reduce((acc, i) => acc + (i.status === "active" ? i.price : 0), 0)
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xl rotate-3 group-hover:rotate-0 transition-all duration-500">
                            <FaStore className="text-2xl text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight italic leading-tight flex items-center gap-2">
                            Mart <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Pro</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Live Inventory Management</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        onClick={() => {
                            if (!companyName) {
                                showToast("Please set company name in settings first", "error");
                                return;
                            }
                            window.open(`/shop/${slugify(companyName)}`, "_blank");
                        }}
                        className={clsx(
                            "h-10 px-5 text-xs rounded-xl font-bold transition-all border-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200",
                            !companyName && "opacity-60"
                        )}
                        variant="secondary"
                    >
                        <FaLink className="mr-2 opacity-60" /> Live Shop
                    </Button>
                    <Button
                        onClick={() => handleOpenModal()}
                        variant="primary"
                        className="h-10 px-6 text-xs rounded-xl font-bold shadow-xl shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700 border-none relative overflow-hidden group"
                    >
                        <span className="relative z-10 flex items-center min-w-max">
                            <FaPlus className="mr-2 group-hover:rotate-90 transition-transform duration-300" /> New Product
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total items", value: stats.total, icon: FaLayerGroup, color: "indigo" },
                    { label: "Active Live", value: stats.active, icon: FaCircleCheck, color: "emerald" },
                    { label: "Currently Off", value: stats.inactive, icon: FaBox, color: "slate" },
                    { label: "Est. Value", value: `Rs.${stats.totalValue}`, icon: FaChartLine, color: "amber" }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <Card className="p-3.5 border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 rounded-2xl">
                            {/* Glass highlight effect for dark mode */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Background Watermark Icon - Increased visibility and scaling */}
                            <div className="absolute -right-4 -bottom-4 opacity-[0.08] dark:opacity-[0.12] group-hover:opacity-[0.18] transition-opacity pointer-events-none group-hover:scale-125 group-hover:-rotate-12 transition-all duration-1000">
                                <stat.icon className={`text-7xl text-${stat.color}-500/80 dark:text-${stat.color}-400/80`} />
                            </div>

                            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/[0.05] dark:bg-${stat.color}-400/[0.1] rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-all duration-1000`} />

                            <div className="relative z-10 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-200 mb-0">{stat.label}</p>
                                    <div className={`w-7 h-7 rounded-lg bg-${stat.color}-500/20 dark:bg-${stat.color}-400/25 shadow-md shadow-${stat.color}-500/10 flex items-center justify-center border border-${stat.color}-500/20 dark:border-${stat.color}-400/20`}>
                                        <stat.icon className={`text-[12px] text-${stat.color}-700 dark:text-${stat.color}-200 active:scale-110 transition-transform`} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <p className={`text-xl font-black tracking-tight text-${stat.color}-700 dark:text-${stat.color}-300 group-hover:text-${stat.color}-600 dark:group-hover:text-${stat.color}-200 transition-all`}>
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Product List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-1">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <FaTags className="text-indigo-600 text-[10px]" />
                            </div>
                            <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground">
                                Inventory Catalog
                            </h3>
                        </div>
                        <div className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {items.length} Products
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <Card className="p-16 text-center flex flex-col items-center justify-center border-dashed border-2 bg-transparent border-slate-200 dark:border-slate-800 rounded-3xl">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <FaShop className="text-2xl text-slate-300" />
                            </div>
                            <p className="text-base font-black uppercase tracking-tighter">Your Mart is empty</p>
                            <p className="text-[10px] text-slate-400 mt-2 max-w-[200px] leading-relaxed">Boost your sales by adding your products to the public showcase.</p>
                            <Button onClick={() => handleOpenModal()} variant="primary" className="mt-6 rounded-lg px-6 h-9 text-xs">
                                Add First Product
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                            {items.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-[1.5rem] p-3 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                                >
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.02] to-white/[0.05] pointer-events-none" />

                                    <div className="relative h-20 rounded-[1rem] overflow-hidden mb-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 flex items-center justify-center">
                                        <ToolLogo
                                            name={item.name}
                                            imageUrl={item.imageUrl || undefined}
                                            size="lg"
                                            variant="card"
                                            className="w-full h-full rounded-none border-0 group-hover:scale-125 transition-transform duration-700 ease-out"
                                        />
                                        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-xl border",
                                                item.status === "active"
                                                    ? "bg-emerald-500/90 text-white border-white/20"
                                                    : "bg-slate-500/90 text-white border-white/20"
                                            )}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 relative z-10 px-1">
                                        <div>
                                            <h3 className="font-black text-[11px] uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate mb-0.5">{item.name}</h3>
                                            <p className="text-[8px] text-slate-500 dark:text-slate-400 line-clamp-1 min-h-[12px] leading-relaxed font-medium">
                                                {item.description || "Premium service with instant delivery."}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/50">
                                            <div className="flex flex-col">
                                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Price</span>
                                                <span className="font-black text-[13px] tracking-tighter text-indigo-600">Rs.{item.price}</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleOpenModal(item)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title="Edit"
                                                >
                                                    <FaPencil className="text-[9px]" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleDelete(item.id)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                    title="Delete"
                                                >
                                                    <FaTrash className="text-[9px]" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar - Orders & Info */}
                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white relative overflow-hidden group rounded-[2.5rem]">
                        <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-1000">
                            <FaCartShopping className="text-[200px]" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300 mb-1">
                                        Sales Feed
                                    </h3>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Recent Activity</p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-indigo-500/20 transition-colors">
                                    <FaClock className="text-indigo-400" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {indexError ? (
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4 backdrop-blur-md">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                            <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest">Index Setup Required</p>
                                        </div>
                                        <p className="text-[10px] text-indigo-100/60 leading-relaxed italic">Real-time order tracking requires a database index to be created in your Firebase console.</p>
                                        <a
                                            href="https://console.firebase.google.com/v1/r/project/tapntools-a6524/firestore/indexes?create_composite=ClVwcm9qZWN0cy90YXBudG9vbHMtYTY1MjQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL25vdGlmaWNhdGlvbnMvaW5kZXhlcy9fEAEaCAoEdHlwZRABGgoKBnVzZXJJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI"
                                            target="_blank"
                                            className="block text-center py-3 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-950/50 active:scale-95"
                                        >
                                            Configure Database
                                        </a>
                                    </div>
                                ) : recentOrders.length === 0 ? (
                                    <div className="py-16 text-center bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
                                        <FaBox className="mx-auto text-3xl text-white/5 mb-4" />
                                        <p className="text-[10px] text-indigo-200/40 font-black uppercase tracking-widest">Awaiting first order</p>
                                    </div>
                                ) : (
                                    recentOrders.map((order, i) => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <Link
                                                href="/dashboard/shop/orders"
                                                className="block p-5 rounded-[1.8rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group/order active:scale-95"
                                            >
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-xs font-black uppercase tracking-tight">{order.customerName}</span>
                                                    <span className="text-sm font-black text-indigo-400">Rs.{order.total}</span>
                                                </div>
                                                <div className="text-[9px] text-indigo-200/40 font-bold uppercase tracking-[0.15em] flex items-center gap-2">
                                                    {order.items?.length || 0} Items <span className="w-1 h-1 bg-indigo-500/40 rounded-full" /> {new Date(order.createdAt?.toMillis()).toLocaleDateString()}
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))
                                )}

                                {recentOrders.length > 0 && (
                                    <Link
                                        href="/dashboard/shop/orders"
                                        className="flex items-center justify-center gap-3 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] hover:text-white transition-colors border-t border-white/10 mt-6 group/btn"
                                    >
                                        Full History <FaArrowRight className="text-[8px] group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 border border-slate-200/50 dark:border-slate-800/20 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm relative overflow-hidden group rounded-[2.5rem]">
                        <div className="absolute right-0 bottom-0 opacity-[0.03] dark:opacity-[0.05] group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 translate-x-1/4 translate-y-1/4">
                            <FaStore className="text-[250px]" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-indigo-600 block">Merchant Pro Tip</h4>
                            <p className="text-[11px] font-bold leading-relaxed mb-6 text-slate-600 dark:text-slate-400 uppercase tracking-[0.05em]">
                                Custom branding and high-quality product assets can increase your shop's conversion rate by up to <span className="text-indigo-600">40%</span>.
                            </p>
                            <Link
                                href="/dashboard/settings"
                                className="text-[10px] font-black uppercase tracking-[0.2em] bg-indigo-600 text-white px-6 py-3.5 rounded-xl inline-block hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                            >
                                Brand Settings
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg bg-card border-border shadow-2xl relative overflow-hidden">
                        <div className="p-6 border-b border-border bg-slate-50/50 dark:bg-slate-800/10">
                            <h3 className="text-xl font-black text-foreground uppercase italic tracking-tight">
                                {editingItem ? "Edit Product" : "Add New Product"}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure your public shop item</p>
                        </div>

                        <div className="p-6 space-y-5">
                            <Input
                                label="Product Name *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Netflix Premium 1 Month"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Price (Rs) *"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="499"
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                                    <Select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full h-11"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </Select>
                                </div>
                            </div>

                            <Input
                                label="Image Link (URL)"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                placeholder="https://example.com/image.png"
                                icon={FaLink}
                            />

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Provide details about plan, duration, etc."
                                    className="w-full h-24 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700/50 rounded-xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 shadow-lg shadow-indigo-500/20"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? "Saving..." : (editingItem ? "Update Product" : "Save Product")}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
