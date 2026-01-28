import { AuthProvider } from "@/context/AuthContext";
import { SalesProvider } from "@/context/SalesContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { VendorProvider } from "@/context/VendorContext";
import { ThemeProvider } from "next-themes";
import { ThemeConfigProvider } from "@/components/ThemeConfigProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SalesProvider>
                <InventoryProvider>
                    <VendorProvider>
                        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                            <ThemeConfigProvider>{children}</ThemeConfigProvider>
                        </ThemeProvider>
                    </VendorProvider>
                </InventoryProvider>
            </SalesProvider>
        </AuthProvider>
    );
}
