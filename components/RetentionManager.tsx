"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useSales } from "@/context/SalesContext";
import { useToast } from "@/context/ToastContext";

function monthsAgoTimestamp(months: number) {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d.getTime();
}

function chunk<T>(arr: T[], size: number) {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

export default function RetentionManager() {
    const { merchantId, planFeatures, dataRetentionMonths } = useAuth();
    const { sales, loading } = useSales();
    const { showToast, confirm } = useToast();
    const [retentionMonths, setRetentionMonths] = useState<number>(0);

    useEffect(() => {
        if (!merchantId) return;
        const unsub = onSnapshot(
            doc(db, "users", merchantId, "settings", "general"),
            (snap) => {
                if (!snap.exists()) {
                    setRetentionMonths(0);
                    return;
                }
                const data = snap.data() as any;
                const val = Number(data.dataRetentionMonths || 0);
                setRetentionMonths(Number.isFinite(val) ? val : 0);
            }
        );
        return () => unsub();
    }, [merchantId]);

    const effectiveRetentionMonths = useMemo(() => {
        const m = dataRetentionMonths ?? 0;
        if (m <= 0) return 0;
        return m;
    }, [dataRetentionMonths]);

    useEffect(() => {
        const run = async () => {
            if (!merchantId) return;
            if (loading) return;
            if (!planFeatures?.export) return;

            const months = effectiveRetentionMonths;
            if (months <= 0) return;

            const lastKey = `retention:lastWarnAt:${merchantId}:${months}`;
            const last = Number(localStorage.getItem(lastKey) || 0);
            if (Date.now() - last < 24 * 60 * 60 * 1000) return;

            const cutoff = monthsAgoTimestamp(months);
            const oldSales = sales.filter((s) => (s.createdAt || 0) < cutoff && !!s.id);
            if (oldSales.length === 0) return;

            // Check if a retention warning already exists for this user
            const q = query(collection(db, "notifications"), where("target", "==", "user"), where("userId", "==", merchantId));
            const existing = await getDocs(q);
            const hasWarn = existing.docs.some(d => (d.data() as any).type === "warning" && (d.data() as any).message?.toLowerCase()?.includes("retention"));

            if (!hasWarn) {
                await addDoc(collection(db, "notifications"), {
                    message: `Your data retention window is reached. Upgrade your plan to extend retention.`,
                    type: "warning",
                    target: "user",
                    userId: merchantId,
                    behavior: "fixed",
                    createdAt: Date.now(),
                    expiresAt: Date.now() + (72 * 60 * 60 * 1000),
                });
            }

            localStorage.setItem(lastKey, Date.now().toString());
            showToast("Retention warning issued — check notifications.", "info");
        };
        run();
    }, [merchantId, loading, sales, planFeatures?.export, effectiveRetentionMonths, showToast]);

    return null;
}
