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
    };
}

const SalesContext = createContext<SalesContextType>({
    sales: [],
    loading: true,
    counts: { expiry: 0, clientPending: 0, vendorDue: 0 },
});

export const useSales = () => useContext(SalesContext);

export const SalesProvider = ({ children }: { children: React.ReactNode }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ expiry: 0, clientPending: 0, vendorDue: 0 });
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setSales([]);
            setLoading(false);
            return;
        }

        // Fetch all sales ordered by creation date desc
        const q = query(collection(db, "users", user.uid, "salesHistory")); // Removing orderBy to ensure index compatibility for now, client side sort is fine for small apps

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sale[];

            // Client-side sort to avoid index requirement errors if not set up
            data.sort((a, b) => b.createdAt - a.createdAt);

            setSales(data);

            // Calculate Counts
            const todayStr = new Date().toISOString().slice(0, 10);
            let expiry = 0;
            let clientPending = 0;
            let vendorDue = 0;

            data.forEach(s => {
                // Expiry Check
                s.items.forEach(item => {
                    if (item.eDate === todayStr) expiry++;
                });

                // Pending Check
                if (s.client?.status === "Pending" || s.client?.status === "Partial") clientPending++;

                // Vendor Check
                if (s.vendor?.status === "Unpaid" || s.vendor?.status === "Credit") vendorDue++;
            });

            setCounts({ expiry, clientPending, vendorDue });
            setLoading(false);
        }, (error) => {
            console.error("Sales fetch error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <SalesContext.Provider value={{ sales, loading, counts }}>
            {children}
        </SalesContext.Provider>
    );
};
