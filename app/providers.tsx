import { AuthProvider } from "@/context/AuthContext";
import { SalesProvider } from "@/context/SalesContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { VendorProvider } from "@/context/VendorContext";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SalesProvider>
                <InventoryProvider>
                    <VendorProvider>
                        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                            {children}
                        </ThemeProvider>
                    </VendorProvider>
                </InventoryProvider>
            </SalesProvider>
        </AuthProvider>
    );
}
