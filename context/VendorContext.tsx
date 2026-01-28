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
    const { user, merchantId } = useAuth();

    useEffect(() => {
        if (!merchantId) {
            setVendors([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, "users", merchantId, "vendors"));
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as any[];
            setVendors(data as Vendor[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [merchantId]);

    const addVendor = async (vendor: Omit<Vendor, "id">) => {
        if (!merchantId) return;
        await addDoc(collection(db, "users", merchantId, "vendors"), { ...vendor, userId: merchantId });
    };

    const updateVendor = async (id: string, vendor: Partial<Vendor>) => {
        if (!merchantId) return;
        await updateDoc(doc(db, "users", merchantId, "vendors", id), vendor);
    };

    const deleteVendor = async (id: string) => {
        if (!merchantId) return;
        await deleteDoc(doc(db, "users", merchantId, "vendors", id));
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
