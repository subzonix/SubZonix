"use client";
import SaleForm from "@/components/sales/SaleForm";
import PlanFeatureGuard from "@/components/PlanFeatureGuard";

export default function NewSalePage() {
    return (
        <PlanFeatureGuard feature="newSale">
            <SaleForm />
        </PlanFeatureGuard>
    );
}
