"use client";
import { useAuth } from "@/context/AuthContext";
import { FaBan } from "react-icons/fa6";
import { Button } from "@/components/ui/Shared";

export default function AccessPausedPage() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-2xl shadow-black/5 dark:shadow-black/40">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                    <FaBan className="text-4xl text-rose-600 dark:text-rose-400" />
                </div>
                <h1 className="text-2xl font-black text-foreground mb-2">Access Paused</h1>
                <p className="text-muted-foreground mb-8">
                    Your account access has been temporarily paused by the administrator.
                    Please contact support if you believe this is a mistake.
                </p>
                <Button onClick={() => logout()} variant="primary" className="w-full sm:w-auto">
                    Back to Login
                </Button>
            </div>
        </div>
    );
}
