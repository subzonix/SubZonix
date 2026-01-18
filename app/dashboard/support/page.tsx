"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Input } from "@/components/ui/Shared";
import { useToast } from "@/context/ToastContext";
import { FaHeadset, FaPaperPlane, FaWhatsapp, FaCircleInfo, FaArrowLeft, FaTriangleExclamation } from "react-icons/fa6";
import Link from "next/link";
import clsx from "clsx";

export default function SupportPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [appConfig, setAppConfig] = useState<any>(null);

    useEffect(() => {
        const loadConfig = async () => {
            const snap = await getDoc(doc(db, "settings", "app_config"));
            if (snap.exists()) setAppConfig(snap.data());
        };
        loadConfig();
    }, []);

    const wordCount = query.trim() ? query.trim().split(/\s+/).length : 0;
    const charCount = query.length;

    const isOverLimit = wordCount > 40 || charCount > 300;

    const handleSubmit = async () => {
        if (!user) return;
        if (!query.trim()) return showToast("Please enter your query", "error");
        if (isOverLimit) return showToast("Query exceeds limits", "error");

        setLoading(true);
        try {
            await addDoc(collection(db, "support_queries"), {
                userId: user.uid,
                userEmail: user.email,
                query: query.trim(),
                status: "unread",
                createdAt: serverTimestamp(),
            });
            showToast("Your query has been submitted successfully!", "success");
            setQuery("");
        } catch (error: any) {
            showToast("Error: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <FaArrowLeft className="text-slate-500" />
                </Link>
                <div>
                    <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight italic">Support Center</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">How can we help you today?</p>
                </div>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
                {/* Query Form */}
                <div className="md:col-span-3 space-y-6">
                    <Card className="p-6 bg-slate-900 border-slate-800 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <FaHeadset />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Submit a Query</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Our team will respond via email</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Describe your issue or question here..."
                                className={clsx(
                                    "w-full h-40 bg-slate-800 border-2 rounded-2xl p-4 text-sm text-slate-200 outline-none transition-all resize-none",
                                    isOverLimit ? "border-rose-500/50 focus:border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : "border-slate-700 focus:border-indigo-500"
                                )}
                            />
                            <div className="flex justify-between items-center px-1">
                                <div className="flex gap-4">
                                    <span className={clsx("text-[10px] font-black uppercase tracking-widest", wordCount > 40 ? "text-rose-500" : "text-slate-500")}>
                                        Words: {wordCount} / 40
                                    </span>
                                    <span className={clsx("text-[10px] font-black uppercase tracking-widest", charCount > 300 ? "text-rose-500" : "text-slate-500")}>
                                        Chars: {charCount} / 300
                                    </span>
                                </div>
                                {isOverLimit && (
                                    <span className="text-[10px] text-rose-500 font-bold uppercase flex items-center gap-1">
                                        <FaTriangleExclamation /> Limit Exceeded
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button
                            className="w-full py-4 mt-2 rounded-xl shadow-lg shadow-indigo-500/10"
                            onClick={handleSubmit}
                            disabled={loading || isOverLimit || !query.trim()}
                        >
                            {loading ? "Submitting..." : (
                                <span className="flex items-center gap-2">
                                    Submit Query <FaPaperPlane className="text-[10px]" />
                                </span>
                            )}
                        </Button>
                    </Card>

                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                            <FaCircleInfo className="text-xl" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Response Time</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                We usually respond within 24 hours. You will be notified via email once our team reviews your request.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Instant Contact Box */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6 bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <FaWhatsapp className="text-[150px] text-emerald-500" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <FaWhatsapp /> Instant Contact
                            </h3>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                                Have an urgent issue? Reach out to our owner directly via WhatsApp for a faster response.
                            </p>
                            {appConfig?.ownerWhatsApp ? (
                                <a
                                    href={`https://wa.me/${appConfig.ownerWhatsApp.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent("Hi, I need assistance with Tapn Tools.")}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 w-full justify-center"
                                >
                                    <FaWhatsapp className="text-lg" /> Chat with Owner
                                </a>
                            ) : (
                                <div className="text-[10px] text-slate-500 font-bold uppercase italic text-center py-2 border border-dashed border-slate-800 rounded-xl">Contact number not set</div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 bg-slate-900 border-slate-800 shadow-2xl">
                        <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Quick Tips</h4>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-indigo-500 font-bold">1</div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">Be clear and concise about your issue.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-indigo-500 font-bold">2</div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">Mention any error messages you see.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-indigo-500 font-bold">3</div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">Ensure your registered email is active.</p>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}
