"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vendor } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface VendorContextType {
    vendors: Vendor[];
    loading: boolean;
    addVendor: (vendor: Omit<Vendor, "id">) => Promise<void>;
    updateVendor: (id: string, vendor: Partial<Vendor>) => Promise<void>;
    deleteVendor: (id: string) => Promise<void>;
    getVendorByPhone: (phone: string) => Vendor | undefined;
}

const VendorContext = createContext<VendorContextType>({
    vendors: [],
    loading: true,
    addVendor: async () => { },
    updateVendor: async () => { },
    deleteVendor: async () => { },
    getVendorByPhone: () => undefined,
});

export const useVendors = () => useContext(VendorContext);

export const VendorProvider = ({ children }: { children: React.ReactNode }) => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setVendors([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, "users", user.uid, "vendors"));
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as any[];
            setVendors(data as Vendor[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const addVendor = async (vendor: Omit<Vendor, "id">) => {
        if (!user) return;
        await addDoc(collection(db, "users", user.uid, "vendors"), { ...vendor, userId: user.uid });
    };

    const updateVendor = async (id: string, vendor: Partial<Vendor>) => {
        if (!user) return;
        await updateDoc(doc(db, "users", user.uid, "vendors", id), vendor);
    };

    const deleteVendor = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "vendors", id));
    };

    const getVendorByPhone = (phone: string) => {
        return vendors.find(v => v.phone === phone);
    };

    return (
        <VendorContext.Provider value={{ vendors, loading, addVendor, updateVendor, deleteVendor, getVendorByPhone }}>
            {children}
        </VendorContext.Provider>
    );
};
