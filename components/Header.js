"use client";
import { useState } from "react";

export default function Header() {
    const [showMobileMenu, setShowMobileMenu] = useState(false);

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
                {/* Notifications */}
                <button className="relative p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-danger rounded-full border-2 border-surface"></span>
                </button>

                {/* Settings */}
                <button className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors hidden sm:flex">
                    <span className="material-symbols-outlined text-[22px]">settings</span>
                </button>

                {/* Divider */}
                <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

                {/* Profile */}
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xs font-bold ring-2 ring-surface shadow-sm">
                        AD
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-semibold text-text-primary leading-none group-hover:text-primary transition-colors">
                            Admin
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                            Gestor de Frota
                        </p>
                    </div>
                    <span className="material-symbols-outlined text-text-secondary text-lg hidden md:block group-hover:text-primary transition-colors">
                        expand_more
                    </span>
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
                                { href: "/agenda", icon: "calendar_month", label: "Agenda" },
                                { href: "/relatorios", icon: "bar_chart", label: "Relatórios" },
                                { href: "/usuarios", icon: "group", label: "Usuários" },
                            ].map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                    <span>{item.label}</span>
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
