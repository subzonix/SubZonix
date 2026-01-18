export interface Client {
    name: string;
    phone: string;
    status: "Clear" | "Pending" | "Partial";
    email?: string;
}

export interface Vendor {
    id?: string;
    name: string;
    phone: string;
    status: "Paid" | "Unpaid" | "Credit";
    email?: string;
    isMe?: boolean;
    isTransient?: boolean;
    userId?: string;
    relatedTools?: string[];
}

export interface ToolItem {
    name: string;
    type: "Shared" | "Private";
    plan?: string;
    pDate: string; // YYYY-MM-DD
    eDate: string; // YYYY-MM-DD
    email?: string;
    pass?: string;
    profileName?: string;
    profilePin?: string;
    sell: number;
    cost: number;
    inventoryId?: string;
    remindersSent?: number;
}

export interface InventoryItem {
    id?: string;
    name: string;
    type: "Shared" | "Private";
    plan?: string; // e.g. "Pro", "Premium" default text
    cost: number;
    sell: number;
    userId?: string;
}

export interface Finance {
    totalSell: number;
    totalCost: number;
    totalProfit: number;
    pendingAmount: number;
}

export interface Sale {
    id?: string;
    client: Client;
    vendor: Vendor;
    items: ToolItem[];
    finance: Finance;
    instructions: string;
    createdAt: number; // timestamp
    userId?: string;
}

export interface PlanFeatures {
    export: boolean;
    pdf: boolean;
    whatsappAlerts: boolean;
    editReminders: boolean;
    support: boolean;
    exportPreference: boolean;
    importData: boolean;
    dateRangeFilter: boolean;
    // Page Access
    dashboard?: boolean;
    newSale?: boolean;
    expiry?: boolean;
    pending?: boolean;
    vendors?: boolean;
    inventory?: boolean;
    history?: boolean;
    customers?: boolean;
    analytics?: boolean;
    settings?: boolean;
}

export interface Plan {
    id: string;
    name: string;
    salesLimit: number;
    price: number;
    yearlyDiscount?: number; // Percentage discount for yearly billing
    level: number; // For identifying upgrade vs switch (e.g., 1, 2, 3)
    isContactOnly?: boolean; // For Business/Enterprise plans
    features: string[];
    planFeatures?: PlanFeatures; // Feature toggles for premium features
    isPublic?: boolean; // Show on public landing page (default: true)
    category?: 'personal' | 'business'; // For landing page toggle
}

