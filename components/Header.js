"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";

export default function Header() {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { profile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    const displayName = profile?.name || "Usuário";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const roleName =
        profile?.role === "admin" ? "Administrador" : profile?.role === "gestor" ? "Gestor" : "Motorista";

    async function handleLogout() {
        await signOut();
        router.push("/login");
    }

    return (
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
            {/* Left: Mobile menu + Title */}
            <div className="flex items-center gap-4">
                <button
                    className="lg:hidden p-2 text-text-secondary hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="lg:hidden flex items-center gap-2">
                    <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-base">local_shipping</span>
                    </div>
                    <span className="font-bold text-sm text-primary">Maxxi</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
                >
                    <span className="material-symbols-outlined text-[22px]">
                        {theme === "dark" ? "light_mode" : "dark_mode"}
                    </span>
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-danger rounded-full border-2 border-surface"></span>
                </button>

                {/* Divider */}
                <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

                {/* Profile */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xs font-bold ring-2 ring-surface shadow-sm">
                            {initials}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-text-primary leading-none group-hover:text-primary transition-colors">
                                {displayName}
                            </p>
                            <p className="text-xs text-text-secondary mt-0.5">{roleName}</p>
                        </div>
                        <span className="material-symbols-outlined text-text-secondary text-lg hidden md:block group-hover:text-primary transition-colors">
                            expand_more
                        </span>
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl shadow-lg border border-border z-50 py-2">
                                <div className="px-4 py-3 border-b border-border">
                                    <p className="text-sm font-semibold text-text-primary">{displayName}</p>
                                    <p className="text-xs text-text-secondary">{profile?.email}</p>
                                </div>
                                <Link href="/configuracoes" onClick={() => setShowProfileMenu(false)} className="w-full px-4 py-2.5 text-left text-sm text-text-secondary hover:bg-background hover:text-text-primary transition-colors flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">settings</span>
                                    Configurações
                                </Link>
                                <div className="border-t border-border my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    Sair do Sistema
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile navigation overlay */}
            {showMobileMenu && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="fixed inset-0 bg-black/40"
                        onClick={() => setShowMobileMenu(false)}
                    ></div>
                    <div className="fixed left-0 top-0 bottom-0 w-64 bg-primary text-white p-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
                            </div>
                            <div>
                                <span className="text-sm font-bold text-accent">Maxxi Internet</span>
                                <p className="text-[11px] text-white/60">Gestão de Frota</p>
                            </div>
                        </div>
                        <nav className="space-y-1">
                            {[
                                { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
                                { href: "/veiculos", icon: "directions_car", label: "Veículos" },
                                { href: "/combustivel", icon: "local_gas_station", label: "Combustível" },
                                { href: "/manutencao", icon: "build", label: "Manutenção" },
                                { href: "/despesas", icon: "receipt_long", label: "Despesas" },
                                { href: "/agenda", icon: "calendar_month", label: "Agenda" },
                                { href: "/relatorios", icon: "bar_chart", label: "Relatórios" },
                                { href: "/usuarios", icon: "group", label: "Usuários" },
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                        <div className="absolute bottom-4 left-4 right-4">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300 hover:bg-white/10 text-sm font-medium transition-colors w-full"
                            >
                                <span className="material-symbols-outlined text-[22px]">logout</span>
                                <span>Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
