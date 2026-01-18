"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FaShop,
  FaCartShopping,
  FaPlus,
  FaMinus,
  FaXmark,
  FaCircleCheck,
  FaBuilding,
  FaWhatsapp,
  FaEnvelope,
  FaUser,
  FaCircleInfo,
  FaArrowRight,
  FaHouse,
  FaCopy,
  FaCheck,
  FaArrowLeft,
  FaPaperPlane,
  FaHashtag,
  FaGlobe,
  FaBuildingColumns,
  FaBagShopping,
  FaShield,
} from "react-icons/fa6";

import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface MerchantSettings {
    companyName: string;
    slogan: string;
    logoUrl: string;
    companyPhone: string;
    accountNumber: string;
    iban: string;
    bankName: string;
    accountHolder: string;
    shopEnabled?: boolean;
}

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
}

interface CartItem extends ShopItem {
    quantity: number;
}

export default function PublicShopPage() {
    const params = useParams();
    const path = params.path as string[];

    const [merchant, setMerchant] = useState<MerchantSettings | null>(null);
    const [products, setProducts] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolvedUid, setResolvedUid] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"home" | "mart">("home");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        email: "",
        phone: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const resolveUid = async () => {
            if (!path || path.length === 0) {
                setLoading(false);
                return;
            }

            try {
                // If path is [slug, uid] (legacy/direct) - NO CHANGE
                if (path.length > 1) {
                    setResolvedUid(path[1]);
                    return;
                }

                // If path is [something]
                const identifier = path[0];

                // Check dedicated slugs collection
                const slugDoc = await getDoc(doc(db, "slugs", identifier));
                if (slugDoc.exists()) {
                    setResolvedUid(slugDoc.data().uid);
                    return;
                }

                // Fallback: check users collection for backward compatibility
                const q = query(collection(db, "users"), where("companySlug", "==", identifier));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setResolvedUid(snap.docs[0].id);
                    return;
                }

                // Final Fallback: assume it is a UID directly
                setResolvedUid(identifier);

            } catch (err) {
                console.error("Error resolving shop:", err);
                setLoading(false);
            }
        };
        resolveUid();
    }, [path]);

    useEffect(() => {
        if (resolvedUid) {
            loadMerchantData();
        }
    }, [resolvedUid]);

    const loadMerchantData = async () => {
        try {
            // Load Settings
            if (!resolvedUid) return;
            const uid = resolvedUid;
            const setSnap = await getDoc(doc(db, "users", uid, "settings", "general"));
            if (setSnap.exists()) {
                const data = setSnap.data() as MerchantSettings;
                if (data.shopEnabled === false) {
                    setMerchant(null);
                    setLoading(false);
                    return;
                }
                setMerchant(data);
            }

            // Load Products
            const q = query(
                collection(db, "users", uid, "shop_items"),
                where("status", "==", "active")
            );
            const prodSnap = await getDocs(q);
            const items = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as ShopItem));
            // Sort in memory to avoid index requirements
            setProducts(items.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        } catch (error) {
            console.error("Error loading shop data:", error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: ShopItem) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (!customerInfo.name || !customerInfo.phone || !resolvedUid) return;
        setSubmitting(true);
        try {
            const orderDetails = cart.map(item => `${item.name} x${item.quantity}`).join(", ");
            const message = `New Shop Order!\nCustomer: ${customerInfo.name}\nEmail: ${customerInfo.email || "N/A"}\nItems: ${orderDetails}\nTotal: Rs. ${totalAmount}`;

            await addDoc(collection(db, "notifications"), {
                userId: resolvedUid,
                type: "shop_order",
                customerName: customerInfo.name,
                customerEmail: customerInfo.email,
                customerPhone: customerInfo.phone,
                items: cart,
                total: totalAmount,
                message,
                status: "unread",
                createdAt: serverTimestamp()
            });

            setOrderSuccess(true);
            setCart([]);
            setShowCheckout(false);
        } catch (error) {
            console.error("Order failed:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!merchant || merchant.shopEnabled === false) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <FaShop className="text-6xl text-slate-200 mb-4" />
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Shop Unavailable</h2>
                <p className="text-slate-500 text-sm mt-2">The shop you are looking for does not exist or is currently private.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-200">
                        {merchant.logoUrl ? (
                            <img src={merchant.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                            <span className="text-white font-black italic">{merchant.companyName?.[0]}</span>
                        )}
                    </div>
                    <div className="hidden sm:block">
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{merchant.companyName}</div>
                        <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{merchant.slogan || "Official Shop"}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-6">
                    <button
                        onClick={() => setActiveTab("home")}
                        className={clsx(
                            "text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5",
                            activeTab === "home" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <FaHouse /> Home
                    </button>
                    <button
                        onClick={() => setActiveTab("mart")}
                        className={clsx(
                            "text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5",
                            activeTab === "mart" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <FaShop /> Mart
                    </button>
                    <button
                        onClick={() => setShowCart(true)}
                        className="relative p-2.5 rounded-full bg-slate-900 text-white shadow-lg active:scale-90 transition-transform"
                    >
                        <FaCartShopping />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === "home" ? (
                        <motion.section
                            key="home"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center py-20 space-y-6"
                        >
                            <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4">
                                Welcome to our official store
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[0.9] max-w-4xl mx-auto uppercase">
                                YOUR ONE-STOP SHOP FOR <span className="text-indigo-600 italic">PREMIUM TOOLS</span>
                            </h1>
                            <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
                                {merchant.slogan || "We provide high-quality digital solutions at competitive prices. Explore our inventory and get instant access today."}
                            </p>
                            <div className="pt-8">
                                <button
                                    onClick={() => setActiveTab("mart")}
                                    className="px-10 py-5 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.3em] rounded-full shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                                >
                                    Browse Shop <FaArrowRight className="inline ml-3" />
                                </button>
                            </div>
                        </motion.section>
                    ) : (
                        <motion.section
                            key="mart"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8 py-10"
                        >
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Available Tools</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Direct from {merchant.companyName}</p>
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl">
                                    {products.length} Products Found
                                </div>
                            </div>

                            {products.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                                    <FaShop className="text-5xl text-slate-100 mx-auto mb-4" />
                                    <p className="text-slate-400 font-black uppercase tracking-widest">No products available</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {products.map((p) => (
                                        <div key={p.id} className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                            <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-6 relative">
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-10">
                                                        <FaShop className="text-6xl" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest text-indigo-600 rounded-full shadow-sm">Verified Tool</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                                                    <span className="font-black text-indigo-500">Rs.{p.price}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed">
                                                    {p.description || "Premium tool with full support and guarantee."}
                                                </p>
                                                <button
                                                    onClick={() => addToCart(p)}
                                                    className="w-full py-3.5 bg-slate-50 hover:bg-indigo-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] mt-4"
                                                >
                                                    Add to Order
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>

            {/* Cart Sidebar */}
            <AnimatePresence>
                {showCart && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCart(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Your Order</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{cart.length} Items Selected</p>
                                </div>
                                <button onClick={() => setShowCart(false)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
                                    <FaXmark />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                                        <FaCartShopping className="text-6xl" />
                                        <p className="text-xs font-black uppercase tracking-widest">Order is empty</p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.id} className="flex gap-4 group">
                                            <div className="w-20 h-20 bg-slate-50 rounded-2xl shrink-0 overflow-hidden">
                                                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between">
                                                    <h4 className="text-xs font-black uppercase tracking-tight">{item.name}</h4>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <FaXmark className="text-[10px]" />
                                                    </button>
                                                </div>
                                                <div className="text-indigo-500 text-xs font-black">Rs.{item.price * item.quantity}</div>
                                                <div className="flex items-center gap-3 pt-2">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                                                        <FaMinus className="text-[8px]" />
                                                    </button>
                                                    <span className="text-xs font-black">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                                                        <FaPlus className="text-[8px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Grand Total</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tighter">Rs.{totalAmount}</span>
                                    </div>
                                    <button
                                        onClick={() => setShowCheckout(true)}
                                        className="w-full py-5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                                    >
                                        Proceed to Confirmation
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Checkout & Success Modals */}
            <AnimatePresence>
                {showCheckout && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg bg-white rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10 border-b border-slate-50 text-center">
                                <h3 className="text-2xl font-black tracking-tight uppercase">Confirm Your Order</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Enter your details to receive credentials</p>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Full Name *"
                                            className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                                            value={customerInfo.name}
                                            onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                                            value={customerInfo.email}
                                            onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <FaWhatsapp className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                        <input
                                            type="tel"
                                            placeholder="WhatsApp Number *"
                                            className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                                            value={customerInfo.phone}
                                            onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setShowCheckout(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl">Cancel</button>

                                    <button
                                        onClick={handleCheckout}
                                        disabled={submitting}
                                        className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-300 disabled:opacity-50"
                                    >
                                        {submitting ? "Processing..." : "Confirm & Pay"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {orderSuccess && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 backdrop-blur-xl">
    <div className="absolute inset-0 bg-black/20"></div>
    
    <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300,
            mass: 0.8 
        }}
        className="relative w-full max-w-md max-h-[90vh] bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-violet-900/40 border border-white/30"
    >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-indigo-400 to-violet-400"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-300/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-300/10 rounded-full blur-3xl"></div>

        {/* Scrollable content container */}
        <div className="overflow-y-auto max-h-[calc(90vh-2rem)] min-w-90% custom-scrollbar">
            <div className="p-6 md:p-10">
                {/* Success Icon */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 blur-2xl rounded-full"></div>
                    <div className="relative">
                        <FaCircleCheck className="text-6xl md:text-7xl text-emerald-500 drop-shadow-lg animate-soft-bounce" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                            <FaCheck className="text-xs text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Title & Description */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-cyan-50 text-emerald-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mb-5 border border-emerald-100 shadow-sm">
                        <span className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-pulse"></span>
                        Payment Required
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 leading-tight">
                        Order Requested
                        <span className="block text-xl text-emerald-600 font-semibold mt-1">Successfully!</span>
                    </h2>
                    <p className="text-gray-500 text-sm md:text-base font-medium max-w-sm mx-auto leading-relaxed">
                        Your request has been sent to the merchant. Complete payment to receive credentials instantly.
                    </p>
                </div>

                {/* Payment Info Card */}
                <div className="bg-gradient-to-br from-gray-50/80 to-white rounded-2xl md:rounded-3xl p-6 md:p-8 text-left mb-10 border border-gray-200/80 shadow-lg shadow-gray-200/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl shadow-sm">
                                <FaBuilding className="text-indigo-600 text-base" />
                            </div>
                            <div>
                                <h4 className="text-xs text-gray-700 font-bold uppercase tracking-wider">
                                    Merchant Payment Details
                                </h4>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Secure & Verified</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                            COPY
                        </span>
                    </div>

                    <div className="space-y-4">
                        {/* Bank Name */}
                        <div className="group hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white p-3.5 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                                    <FaBuildingColumns className="text-xs text-gray-400" />
                                    Bank Name
                                </span>
                                <span className="text-sm font-bold text-gray-900 truncate max-w-[180px] px-3 py-1.5 bg-gray-100/50 rounded-lg">
                                    {merchant.bankName || "N/A"}
                                </span>
                            </div>
                        </div>

                        {/* Account Number */}
                        <div className="group hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-white p-3.5 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-200/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                                    <FaHashtag className="text-xs text-gray-400" />
                                    Account No.
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-mono font-black text-indigo-700 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                                        {merchant.accountNumber || "N/A"}
                                    </span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-400 hover:text-indigo-600 hover:scale-110 p-2">
                                        <FaCopy className="text-sm" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* IBAN */}
                        <div className="group hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white p-3.5 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                                    <FaGlobe className="text-xs text-gray-400" />
                                    IBAN
                                </span>
                                <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100/50 px-3 py-2 rounded-lg border border-gray-200">
                                    {merchant.iban || "N/A"}
                                </span>
                            </div>
                        </div>

                        {/* Account Holder */}
                        <div className="group hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white p-3.5 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-2">
                                    <FaUser className="text-xs text-gray-400" />
                                    Account Holder
                                </span>
                                <span className="text-sm font-bold text-gray-900 bg-gradient-to-r from-gray-50 to-white px-3 py-2 rounded-lg border border-gray-200">
                                    {merchant.accountHolder || "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4 px-1">
                    {merchant.companyPhone && (
                        <a
                            href={`https://wa.me/${merchant.companyPhone.replace(/\+/g, '').replace(/\s/g, '')}?text=Payment%20Screenshot%20Attached%20for%20Order`}
                            target="_blank"
                            rel="noreferrer"
                            className="group block w-full py-4 bg-gradient-to-r from-[#25D366] via-emerald-500 to-[#25D366] text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                        >
                            <div className="relative">
                                <FaWhatsapp className="text-xl" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            <span>Send Payment Proof</span>
                            <FaPaperPlane className="text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </a>
                    )}

                    <button
                        onClick={() => setOrderSuccess(false)}
                        className="group w-full py-4 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-300 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:shadow-xl hover:shadow-gray-900/30 transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-800 flex items-center justify-center gap-2"
                    >
                        <FaArrowLeft className="text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        <span>Continue Shopping</span>
                        <FaBagShopping className="text-xs ml-1" />
                    </button>

                    {/* Helper Text */}
                    <div className="pt-6 border-t border-gray-100">
                        <p className="text-[11px] text-gray-400 font-medium text-center">
                            <FaShield className="inline mr-1.5 text-gray-300" />
                            Secure payment • 15 min delivery • 24/7 support
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Close button */}
        <button
            onClick={() => setOrderSuccess(false)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-full transition-all duration-200 z-10"
        >
            <FaXmark className="text-sm" />
        </button>
    </motion.div>
</div>
                )}
            </AnimatePresence>
        </div>
    );
}
