"use client"; // Fixed: Added directive

import { createContext, useContext, useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sale } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface SalesContextType {
    sales: Sale[];
    loading: boolean;
    counts: {
        expiry: number;
        clientPending: number;
        vendorDue: number;
        martOrders: number;
        total: number;
    };
}

const SalesContext = createContext<SalesContextType>({
    sales: [],
    loading: true,
    counts: { expiry: 0, clientPending: 0, vendorDue: 0, martOrders: 0, total: 0 },
});

export const useSales = () => useContext(SalesContext);

export const SalesProvider = ({ children }: { children: React.ReactNode }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ expiry: 0, clientPending: 0, vendorDue: 0, martOrders: 0, total: 0 });
    const { user, merchantId } = useAuth();

    useEffect(() => {
        if (!merchantId) {
            setSales([]);
            setLoading(false);
            return;
        }

        // Fetch all sales ordered by creation date desc
        const q = query(collection(db, "users", merchantId, "salesHistory"));

        // Notifications listener for Mart Orders
        const notifQuery = query(
            collection(db, "notifications"),
            where("userId", "==", merchantId),
            where("type", "==", "shop_order"),
            where("read", "==", false)
        );

        const unsubNotif = onSnapshot(notifQuery, (snap) => {
            setCounts(prev => ({ ...prev, martOrders: snap.size }));
        });

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sale[];

            // Client-side sort to avoid index requirement errors if not set up
            data.sort((a, b) => b.createdAt - a.createdAt);

            setSales(data);

            // Calculate Counts & Shared Tool Cost Distribution
            const todayStr = new Date().toISOString().slice(0, 10);
            let expiry = 0;
            let clientPending = 0;
            let vendorDue = 0;

            data.forEach(s => {
                let saleTotalCost = 0;
                let saleTotalProfit = 0;

                // Expiry Check
                const safeItems = Array.isArray(s.items) ? s.items : [];
                safeItems.forEach(item => {
                    if (!item) return;
                    if (item.eDate === todayStr) expiry++;

                    saleTotalCost += item.cost || 0;
                    saleTotalProfit += ((item.sell || 0) - (item.cost || 0));
                });

                // Update finance totals based on shared cost
                s.finance.totalCost = saleTotalCost;
                s.finance.totalProfit = saleTotalProfit;

                // Pending Check
                if (s.client?.status === "Pending" || s.client?.status === "Partial") clientPending++;

                // Vendor Check
                if (s.vendor?.status === "Unpaid" || s.vendor?.status === "Credit") vendorDue++;
            });

            setCounts(prev => ({ ...prev, expiry, clientPending, vendorDue, total: data.length }));
            setLoading(false);
        }, (error) => {
            console.error("Sales fetch error:", error);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            unsubNotif();
        };
    }, [merchantId]);

    return (
        <SalesContext.Provider value={{ sales, loading, counts }}>
            {children}
        </SalesContext.Provider>
    );
};
