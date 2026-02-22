"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Header() {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifCount, setNotifCount] = useState(null);
    const [logoUrl, setLogoUrl] = useState(null);
    const [companyName, setCompanyName] = useState("Maxxi Internet");
    const { profile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        supabase
            .from("company_settings")
            .select("logo_url, company_name")
            .limit(1)
            .single()
            .then(({ data }) => {
                if (data?.logo_url) setLogoUrl(data.logo_url);
                if (data?.company_name) setCompanyName(data.company_name);
            });
    }, []);
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

    async function fetchNotifications() {
        setNotifLoading(true);
        try {
            const [maintRes, fuelRes, schedRes] = await Promise.all([
                supabase
                    .from("maintenance")
                    .select("id, service_type, status, date, cost, vehicle:vehicles(name, plate)")
                    .in("status", ["pendente", "agendado"])
                    .order("date", { ascending: false })
                    .limit(10),
                supabase
                    .from("fuel_records")
                    .select("id, date, liters, total, vehicle:vehicles(name, plate)")
                    .order("date", { ascending: false })
                    .limit(5),
                supabase
                    .from("schedule")
                    .select("id, title, start_date, status, vehicle:vehicles(name)")
                    .gte("start_date", new Date().toISOString().split("T")[0])
                    .order("start_date", { ascending: true })
                    .limit(5),
            ]);

            const items = [];
            const today = new Date().toISOString().split("T")[0];

            // Manutenções pendentes/atrasadas
            (maintRes.data || []).forEach((m) => {
                const isOverdue = m.date < today && m.status === "pendente";
                items.push({
                    id: `maint-${m.id}`,
                    type: isOverdue ? "danger" : "warning",
                    icon: isOverdue ? "error" : "build",
                    title: isOverdue ? "Manutenção atrasada" : "Manutenção pendente",
                    desc: `${m.service_type} — ${m.vehicle?.name || "Veículo"} (${m.vehicle?.plate || ""})`,
                    detail: `R$ ${Number(m.cost || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    date: m.date,
                    href: "/manutencao",
                });
            });

            // Agendamentos próximos
            (schedRes.data || []).forEach((s) => {
                items.push({
                    id: `sched-${s.id}`,
                    type: "info",
                    icon: "calendar_month",
                    title: "Agendamento próximo",
                    desc: `${s.title} — ${s.vehicle?.name || ""}`,
                    date: s.start_date,
                    href: "/agenda",
                });
            });

            // Abastecimentos recentes
            (fuelRes.data || []).forEach((f) => {
                items.push({
                    id: `fuel-${f.id}`,
                    type: "success",
                    icon: "local_gas_station",
                    title: "Abastecimento registrado",
                    desc: `${f.vehicle?.name || "Veículo"} — ${Number(f.liters).toFixed(1)}L`,
                    detail: `R$ ${Number(f.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    date: f.date,
                    href: "/combustivel",
                });
            });

            // Ordenar por data desc
            items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

            setNotifications(items);
            const actionable = (maintRes.data || []).length;
            setNotifCount(actionable);
        } catch (err) {
            console.error("Erro ao carregar notificações:", err);
            setNotifications([{ id: "err", type: "danger", icon: "error", title: "Erro ao carregar", desc: err.message }]);
        } finally {
            setNotifLoading(false);
        }
    }

    function handleNotifToggle() {
        const next = !showNotifications;
        setShowNotifications(next);
        setShowProfileMenu(false);
        if (next) fetchNotifications();
    }

    const typeColors = {
        danger: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
        warning: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
        info: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
        success: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
    };

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
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center overflow-hidden ${logoUrl ? "bg-transparent" : "bg-accent"}`}>
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <span className="material-symbols-outlined text-primary text-base">local_shipping</span>
                        )}
                    </div>
                    <span className="font-bold text-sm text-primary">{companyName}</span>
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
                <div className="relative">
                    <button
                        onClick={handleNotifToggle}
                        className="relative p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[22px]">notifications</span>
                        {(notifCount === null || notifCount > 0) && (
                            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-danger rounded-full border-2 border-surface">
                                {notifCount ?? ""}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface rounded-xl shadow-2xl border border-border z-50 overflow-hidden">
                                <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-background/50">
                                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">notifications</span>
                                        Notificações
                                    </h3>
                                    {notifCount > 0 && (
                                        <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full font-bold">
                                            {notifCount} pendente{notifCount > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifLoading ? (
                                        <div className="p-8 text-center text-text-secondary">
                                            <span className="material-symbols-outlined text-2xl animate-pulse">sync</span>
                                            <p className="text-xs mt-1">Carregando...</p>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-8 text-center text-text-secondary">
                                            <span className="material-symbols-outlined text-3xl">notifications_off</span>
                                            <p className="text-sm mt-2 font-medium">Nenhuma notificação</p>
                                            <p className="text-xs mt-0.5">Tudo em ordem! 🎉</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => {
                                            const colors = typeColors[n.type] || typeColors.info;
                                            return (
                                                <Link
                                                    key={n.id}
                                                    href={n.href || "#"}
                                                    onClick={() => setShowNotifications(false)}
                                                    className="flex items-start gap-3 px-5 py-3 hover:bg-background/50 transition-colors border-b border-border/50 last:border-0"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                        <span className="material-symbols-outlined text-lg">{n.icon}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-text-primary truncate">{n.title}</p>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} flex-shrink-0`}></span>
                                                        </div>
                                                        <p className="text-xs text-text-secondary mt-0.5 truncate">{n.desc}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {n.date && (
                                                                <span className="text-[10px] text-text-secondary">
                                                                    {new Date(n.date + "T00:00:00").toLocaleDateString("pt-BR")}
                                                                </span>
                                                            )}
                                                            {n.detail && (
                                                                <span className="text-[10px] font-semibold text-text-secondary">{n.detail}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="px-5 py-2.5 border-t border-border bg-background/30 text-center">
                                        <Link
                                            href="/manutencao"
                                            onClick={() => setShowNotifications(false)}
                                            className="text-xs text-primary font-semibold hover:underline"
                                        >
                                            Ver todas as manutenções →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

                {/* Profile */}
                <div className="relative">
                    <button
                        onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
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
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${logoUrl ? "bg-transparent" : "bg-accent"}`}>
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <span className="text-sm font-bold text-accent truncate block">{companyName}</span>
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
                                { href: "/diario", icon: "route", label: "Diário de Bordo" },
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

