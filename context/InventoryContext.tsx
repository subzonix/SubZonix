"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InventoryItem } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface InventoryContextType {
    items: InventoryItem[];
    loading: boolean;
    addItem: (item: InventoryItem) => Promise<void>;
    updateItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType>({
    items: [],
    loading: true,
    addItem: async () => { },
    updateItem: async () => { },
    deleteItem: async () => { },
});

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, "users", user.uid, "inventory"));
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => {
                const itemData = d.data() as any;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { stock, ...rest } = itemData;
                return {
                    id: d.id,
                    ...rest,
                    cost: rest.cost ?? 0,
                    sell: rest.sell ?? 0
                };
            }) as InventoryItem[];
            setItems(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const addItem = async (item: InventoryItem) => {
        if (!user) return;
        const { name, type, cost, sell, plan } = item;
        await addDoc(collection(db, "users", user.uid, "inventory"), {
            name,
            type,
            cost,
            sell,
            plan: plan || "",
            userId: user.uid
        });
    };

    const updateItem = async (id: string, item: Partial<InventoryItem>) => {
        if (!user) return;
        await updateDoc(doc(db, "users", user.uid, "inventory", id), item);
    };

    const deleteItem = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "inventory", id));
    };

    return (
        <InventoryContext.Provider value={{ items, loading, addItem, updateItem, deleteItem }}>
            {children}
        </InventoryContext.Provider>
    );
};
