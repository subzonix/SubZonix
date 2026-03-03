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
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3 group hover:rotate-0 transition-transform duration-500">
                        <FaStore className="text-xl text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight italic leading-tight">Mart <span className="text-indigo-600">Pro</span></h2>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Management</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={() => {
                            if (!companyName) {
                                showToast("Please set company name in settings first", "error");
                                return;
                            }
                            window.open(`/shop/${slugify(companyName)}`, "_blank");
                        }}
                        className={clsx("h-9 px-4 text-xs rounded-lg font-bold transition-all", !companyName && "opacity-60")}
                        variant="secondary"
                    >
                        <FaLink className="mr-2" /> Live Shop
                    </Button>
                    <Button
                        onClick={() => handleOpenModal()}
                        variant="primary"
                        className="h-9 px-4 text-xs rounded-lg font-bold shadow-lg shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700 border-none"
                    >
                        <FaPlus className="mr-2" /> New Product
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Total", value: stats.total, icon: FaLayerGroup, color: "indigo" },
                    { label: "Active", value: stats.active, icon: FaCircleCheck, color: "emerald" },
                    { label: "Inactive", value: stats.inactive, icon: FaBox, color: "slate" },
                    { label: "Live Value", value: `Rs.${stats.totalValue}`, icon: FaChartLine, color: "amber" }
                ].map((stat, i) => (
                    <Card key={i} className="p-3.5 border-none bg-slate-50 dark:bg-slate-900/40 relative overflow-hidden group">
                        <stat.icon className={`absolute -right-1 -bottom-1 text-4xl opacity-[0.03] dark:opacity-[0.05] group-hover:scale-125 transition-transform duration-500 text-${stat.color}-500`} />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{stat.label}</p>
                        <p className="text-xl font-black tracking-tight">{stat.value}</p>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Product List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <FaTags /> Inventory Catalog
                        </h3>
                        <div className="text-[10px] font-bold text-slate-500">
                            Showing {items.length} items
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
                        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {items.map((item) => (
                                <div key={item.id} className="group relative bg-card border border-slate-200 dark:border-slate-800/50 rounded-2xl p-3.5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="h-20 rounded-xl overflow-hidden mb-2.5 relative bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-2.5 group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-10">
                                                <FaBox className="text-2xl" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 flex gap-1.5">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border",
                                                item.status === "active"
                                                    ? "bg-emerald-500/90 text-white border-emerald-400/50"
                                                    : "bg-slate-500/90 text-white border-slate-400/50"
                                            )}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 relative z-10">
                                        <div>
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h3 className="font-black text-xs uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate">{item.name}</h3>
                                            </div>
                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1 min-h-[14px] leading-tight">
                                                {item.description || "Premium service guaranteed."}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
                                            <span className="font-black text-sm tracking-tighter text-indigo-600">Rs.{item.price}</span>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title="Edit"
                                                >
                                                    <FaPencil className="text-[10px]" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                    title="Delete"
                                                >
                                                    <FaTrash className="text-[10px]" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar - Orders & Info */}
                <div className="space-y-6">
                    <Card className="p-7 border-none shadow-2xl bg-indigo-900 text-white relative overflow-hidden group rounded-[2.5rem]">
                        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                            <FaCartShopping className="text-[180px]" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">
                                    Recent Orders
                                </h3>
                                <FaClock className="text-indigo-400" />
                            </div>

                            <div className="space-y-4">
                                {indexError ? (
                                    <div className="p-5 bg-white/5 border border-white/10 rounded-[1.5rem] space-y-3">
                                        <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest">Index Setup Required</p>
                                        <p className="text-[10px] text-indigo-100/60 leading-relaxed italic">Real-time order tracking requires a database index.</p>
                                        <a
                                            href="https://console.firebase.google.com/v1/r/project/tapntools-a6524/firestore/indexes?create_composite=ClVwcm9qZWN0cy90YXBudG9vbHMtYTY1MjQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL25vdGlmaWNhdGlvbnMvaW5kZXhlcy9fEAEaCAoEdHlwZRABGgoKBnVzZXJJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI"
                                            target="_blank"
                                            className="block text-center py-2.5 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
                                        >
                                            Fix in Console
                                        </a>
                                    </div>
                                ) : recentOrders.length === 0 ? (
                                    <div className="py-12 text-center bg-white/5 rounded-[2rem] border border-white/5">
                                        <p className="text-[10px] text-indigo-200/40 font-black uppercase tracking-widest">Awaiting first order</p>
                                    </div>
                                ) : (
                                    recentOrders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href="/dashboard/shop/orders"
                                            className="block p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group/order"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[11px] font-black uppercase">{order.customerName}</span>
                                                <span className="text-sm font-black text-indigo-400">Rs.{order.total}</span>
                                            </div>
                                            <div className="text-[9px] text-indigo-200/50 font-bold uppercase tracking-widest flex items-center gap-2">
                                                {order.items?.length || 0} Items <span className="w-1 h-1 bg-indigo-500 rounded-full" /> {new Date(order.createdAt?.toMillis()).toLocaleDateString()}
                                            </div>
                                        </Link>
                                    ))
                                )}

                                {recentOrders.length > 0 && (
                                    <Link
                                        href="/dashboard/shop/orders"
                                        className="flex items-center justify-center gap-2 py-3 text-[10px] font-black text-indigo-300 uppercase tracking-widest hover:text-white transition-colors border-t border-white/5 mt-4"
                                    >
                                        View Dashboard <FaArrowRight className="text-[8px]" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 bg-slate-50 dark:bg-slate-900/40 border-none shadow-sm relative overflow-hidden group rounded-[2.5rem]">
                        <div className="absolute right-0 bottom-0 opacity-5 group-hover:rotate-12 transition-transform duration-700 translate-x-1/4 translate-y-1/4">
                            <FaCircleInfo className="text-9xl" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-indigo-600">Merchant Tip</h4>
                        <p className="text-xs font-semibold leading-relaxed mb-6 text-slate-600 dark:text-slate-400">
                            Custom branding and professional product photos can increase your conversion rate by up to 40%.
                        </p>
                        <Link
                            href="/dashboard/settings"
                            className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-5 py-3 rounded-xl inline-block hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            Brand Settings
                        </Link>
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
