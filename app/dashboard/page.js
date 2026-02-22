"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import KPICard from "@/components/KPICard";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({ vehicles: 0, fuelTotal: 0, maintenanceTotal: 0, pending: 0 });
    const [recentFuel, setRecentFuel] = useState([]);
    const [recentMaint, setRecentMaint] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDashboard(); }, []);

    async function fetchDashboard() {
        setLoading(true);
        const [vRes, fRes, mRes] = await Promise.all([
            supabase.from("vehicles").select("id, status"),
            supabase.from("fuel_records").select("*, vehicle:vehicles(name, plate)").order("date", { ascending: false }).limit(5),
            supabase.from("maintenance").select("*, vehicle:vehicles(name, plate)").order("date", { ascending: false }).limit(5),
        ]);

        const vehicles = vRes.data || [];
        const fuel = fRes.data || [];
        const maint = mRes.data || [];

        const fuelTotal = fuel.reduce((s, r) => s + Number(r.total), 0);
        const maintTotal = maint.reduce((s, r) => s + Number(r.cost), 0);
        const pendingMaint = maint.filter((m) => m.status === "pendente").length;

        setStats({ vehicles: vehicles.length, fuelTotal, maintenanceTotal: maintTotal, pending: pendingMaint });
        setRecentFuel(fuel);
        setRecentMaint(maint);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-8 text-center text-text-secondary">
                <span className="material-symbols-outlined text-4xl animate-pulse">sync</span>
                <p className="mt-2 text-sm">Carregando dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">
                    Olá, {profile?.name?.split(" ")[0] || "Usuário"}! 👋
                </h1>
                <p className="text-text-secondary mt-1">Aqui está o resumo da sua frota.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KPICard icon="directions_car" iconBg="bg-primary/10 text-primary" label="Total de Veículos" value={stats.vehicles} subtitle="Cadastrados" />
                <KPICard icon="local_gas_station" iconBg="bg-orange-100 text-orange-600" label="Gastos Combustível" value={`R$ ${stats.fuelTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} subtitle="Últimos registros" />
                <KPICard icon="build" iconBg="bg-purple-100 text-purple-600" label="Gastos Manutenção" value={`R$ ${stats.maintenanceTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} subtitle="Últimos registros" />
                <KPICard icon="warning" iconBg="bg-amber-100 text-amber-600" label="Manutenções Pendentes" value={stats.pending} subtitle="Aguardando conclusão" badge={stats.pending > 0 ? { text: "Atenção", color: "bg-amber-100 text-amber-700" } : undefined} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { href: "/veiculos", icon: "add", label: "Novo Veículo", color: "bg-primary" },
                    { href: "/combustivel", icon: "local_gas_station", label: "Abastecimento", color: "bg-orange-500" },
                    { href: "/manutencao", icon: "build", label: "Manutenção", color: "bg-purple-500" },
                    { href: "/relatorios", icon: "bar_chart", label: "Relatórios", color: "bg-emerald-500" },
                ].map((a) => (
                    <a key={a.href} href={a.href} className={`${a.color} text-white rounded-xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity shadow-sm`}>
                        <span className="material-symbols-outlined">{a.icon}</span>
                        <span className="text-sm font-semibold">{a.label}</span>
                    </a>
                ))}
            </div>

            {/* Recent Fuel */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">local_gas_station</span>
                        <h2 className="text-lg font-bold text-text-primary">Últimos Abastecimentos</h2>
                    </div>
                    <a href="/combustivel" className="text-sm text-primary-light font-medium hover:underline">Ver todos →</a>
                </div>
                {recentFuel.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary text-sm">Nenhum abastecimento registrado.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-background/50 border-b border-border">
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Data</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Veículo</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Litros</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Total</th>
                            </tr></thead>
                            <tbody className="divide-y divide-border">
                                {recentFuel.map((r) => (
                                    <tr key={r.id} className="hover:bg-background/50">
                                        <td className="px-5 py-3 text-sm text-text-secondary">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                                        <td className="px-5 py-3 text-sm font-medium text-text-primary">{r.vehicle?.name}</td>
                                        <td className="px-5 py-3 text-sm text-right">{Number(r.liters).toFixed(1)}L</td>
                                        <td className="px-5 py-3 text-sm font-semibold text-right">R$ {Number(r.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Maintenance */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">build</span>
                        <h2 className="text-lg font-bold text-text-primary">Últimas Manutenções</h2>
                    </div>
                    <a href="/manutencao" className="text-sm text-primary-light font-medium hover:underline">Ver todas →</a>
                </div>
                {recentMaint.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary text-sm">Nenhuma manutenção registrada.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-background/50 border-b border-border">
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Data</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Veículo</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Serviço</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Custo</th>
                            </tr></thead>
                            <tbody className="divide-y divide-border">
                                {recentMaint.map((r) => (
                                    <tr key={r.id} className="hover:bg-background/50">
                                        <td className="px-5 py-3 text-sm text-text-secondary">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                                        <td className="px-5 py-3 text-sm font-medium text-text-primary">{r.vehicle?.name}</td>
                                        <td className="px-5 py-3 text-sm text-text-secondary">{r.service_type}</td>
                                        <td className="px-5 py-3 text-sm font-semibold text-right">R$ {Number(r.cost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
