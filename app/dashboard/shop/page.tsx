"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Input } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { FaShop, FaPlus, FaPencil, FaTrash, FaLink, FaCartShopping, FaCircleInfo, FaArrowRight, FaClock } from "react-icons/fa6";
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
                limit(10)
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

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight italic">Mart Management</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Manage your public products and orders</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={companyName ? `/shop/${slugify(companyName)}` : "#"}
                        onClick={(e) => {
                            if (!companyName) {
                                e.preventDefault();
                                showToast("Please set company name in settings first", "error");
                            }
                        }}
                        target="_blank"
                        className="btn-whatsapp"
                    >
                        <FaLink /> View My Shop
                    </Link>
                    <Button onClick={() => handleOpenModal()} variant="secondary" className="btn-save">
                        <FaPlus className="mr-2" /> Add Product
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Product List */}
                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-48 rounded-3xl  animate-pulse" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <Card className="p-20 text-center flex flex-col items-center justify-center border-dashed border-2">
                            <FaShop className="text-5xl text-slate-300 mb-4" />
                            <p className="text-slate-500 font-black uppercase tracking-widest">No products yet</p>
                            <p className="text-xs text-slate-400 mt-2">Start adding products to your public shop.</p>
                            <Button onClick={() => handleOpenModal()} variant="secondary" className="mt-6">
                                Create Your First Product
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="group relative  border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1">
                                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative border border-slate-100 dark:border-slate-800">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-10">
                                                <FaShop className="text-5xl" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3">
                                            <span className={clsx(
                                                "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md",
                                                item.status === "active" ? "bg-emerald-500/90 " : "bg-slate-500/90"
                                            )}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-black text-sm uppercase tracking-tight  group-hover:text-indigo-500 transition-colors truncate">{item.name}</h3>
                                            <span className="font-black text-indigo-500 text-sm">Rs.{item.price}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed">
                                            {item.description || "Premium tool with full support and guarantee."}
                                        </p>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="btn-edit"
                                            >
                                                <FaPencil className="inline mr-1.5" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="btn-delete"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar - Orders & Info */}
                <div className="space-y-6">
                    <Card className="p-6 border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <FaCartShopping className="text-[150px] text-indigo-500" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <FaClock /> Recent Shop Orders
                            </h3>
                            <div className="space-y-3">
                                {indexError ? (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                                        <p className="text-[10px] font-black text-amber-500 uppercase">Index Required</p>
                                        <p className="text-[9px] text-slate-400 leading-relaxed italic">Firebase requires an index to show recent orders. Please click the button below to create it.</p>
                                        <a
                                            href="https://console.firebase.google.com/v1/r/project/tapntools-a6524/firestore/indexes?create_composite=ClVwcm9qZWN0cy90YXBudG9vbHMtYTY1MjQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL25vdGlmaWNhdGlvbnMvaW5kZXhlcy9fEAEaCAoEdHlwZRABGgoKBnVzZXJJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI"
                                            target="_blank"
                                            className="block text-center py-2 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-600 transition-colors"
                                        >
                                            Create Index Now
                                        </a>
                                    </div>
                                ) : recentOrders.length === 0 ? (
                                    <p className="text-[10px] text-slate-500 py-10 text-center font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 rounded-2xl">No orders yet</p>
                                ) : (
                                    recentOrders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href="/dashboard/shop/orders"
                                            className="block p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all group/order"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-black uppercase truncate">{order.customerName}</span>
                                                <span className="text-[10px] font-black text-indigo-500">Rs.{order.total}</span>
                                            </div>
                                            <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                                {order.items?.length || 0} Items • {new Date(order.createdAt?.toMillis()).toLocaleDateString()}
                                            </div>
                                        </Link>
                                    ))
                                )}
                                {recentOrders.length > 0 && (
                                    <Link
                                        href="/dashboard/shop/orders"
                                        className="block text-center py-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors mt-2"
                                    >
                                        View All Orders <FaArrowRight className="inline ml-1 text-[8px]" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 border-none relative overflow-hidden group">
                        <div className="absolute right-0 bottom-0 opacity-10 group-hover:rotate-12 transition-transform duration-500 translate-x-1/4 translate-y-1/4">
                            <FaCircleInfo className="text-8xl" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Quick Tip</h4>
                        <p className="text-xs font-medium leading-relaxed mb-4 relative z-10">
                            Encourage customers to use your public shop link for automated order management and faster processing.
                        </p>
                        <Link
                            href="/dashboard/settings"
                            className="text-[9px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 p-2 rounded-lg inline-block transition-colors"
                        >
                            Update Branding
                        </Link>
                    </Card>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg bg-[var(--card)] border-[var(--border)] shadow-2xl relative overflow-hidden">
                        <div className="p-6 border-b border-[var(--border)] bg-slate-50/50 dark:bg-slate-800/10">
                            <h3 className="text-xl font-black text-[var(--foreground)] uppercase italic tracking-tight">
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
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full h-11 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700/50 rounded-xl px-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
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
