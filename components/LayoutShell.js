"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function LayoutShell({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();
    const isLoginPage = pathname === "/login";

    useEffect(() => {
        if (!loading && !user && !isLoginPage) {
            router.push("/login");
        }
        if (!loading && user && isLoginPage) {
            router.push("/dashboard");
        }
    }, [user, loading, isLoginPage, router]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center animate-pulse">
                        <span className="material-symbols-outlined text-primary text-2xl">local_shipping</span>
                    </div>
                    <p className="text-sm text-text-secondary">Carregando...</p>
                </div>
            </div>
        );
    }

    // Login page
    if (isLoginPage) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center p-4">
                {children}
            </div>
        );
    }

    // Not authenticated
    if (!user) return null;

    // Authenticated layout
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
            </div>
        </div>
    );
}
