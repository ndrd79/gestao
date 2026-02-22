"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import KPICard from "@/components/KPICard";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({ vehicles: 0, fuelTotal: 0, maintenanceTotal: 0, pending: 0 });
    const [allFuelRecords, setAllFuelRecords] = useState([]);
    const [recentFuel, setRecentFuel] = useState([]);
    const [recentMaint, setRecentMaint] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchDashboard(); }, []);

    async function fetchDashboard() {
        setLoading(true);
        setError(null);
        try {
            const [vRes, fAllRes, mAllRes, fRecentRes, mRecentRes] = await Promise.all([
                // Total de veículos
                supabase.from("vehicles").select("id, status"),
                // TODOS os combustíveis (com km, litros, total e veículo)
                supabase.from("fuel_records").select("total, liters, km, vehicle:vehicles(name, plate)"),
                // TODAS as manutenções (apenas campos para cálculo)
                supabase.from("maintenance").select("cost, status"),
                // Últimos 5 combustíveis (para tabela recente)
                supabase.from("fuel_records").select("*, vehicle:vehicles(name, plate)").order("date", { ascending: false }).limit(5),
                // Últimas 5 manutenções (para tabela recente)
                supabase.from("maintenance").select("*, vehicle:vehicles(name, plate)").order("date", { ascending: false }).limit(5),
            ]);

            if (vRes.error) throw vRes.error;
            if (fAllRes.error) throw fAllRes.error;
            if (mAllRes.error) throw mAllRes.error;

            const vehicles = vRes.data || [];
            const allFuel = fAllRes.data || [];
            const allMaint = mAllRes.data || [];

            const fuelTotal = allFuel.reduce((s, r) => s + Number(r.total || 0), 0);
            const maintTotal = allMaint.reduce((s, r) => s + Number(r.cost || 0), 0);
            const pendingMaint = allMaint.filter((m) => m.status === "pendente").length;

            setStats({ vehicles: vehicles.length, fuelTotal, maintenanceTotal: maintTotal, pending: pendingMaint });
            setAllFuelRecords(allFuel);
            setRecentFuel(fRecentRes.data || []);
            setRecentMaint(mRecentRes.data || []);
        } catch (err) {
            console.error("Erro ao carregar dashboard:", err);
            setError("Erro ao carregar dados. Tente recarregar a página.");
        } finally {
            setLoading(false);
        }
    }

    // --- Consumo por veículo ---
    const vehicleConsumption = useMemo(() => {
        const byVehicle = {};
        allFuelRecords.forEach((r) => {
            const vName = r.vehicle?.name || "Sem nome";
            const vPlate = r.vehicle?.plate || "";
            const key = `${vName}|${vPlate}`;
            if (!byVehicle[key]) byVehicle[key] = { name: vName, plate: vPlate, records: [] };
            byVehicle[key].records.push(r);
        });

        return Object.values(byVehicle)
            .map((data) => {
                const sorted = [...data.records].sort((a, b) => (a.km || 0) - (b.km || 0));
                const totalLiters = sorted.reduce((s, r) => s + Number(r.liters || 0), 0);
                const totalSpent = sorted.reduce((s, r) => s + Number(r.total || 0), 0);
                const kmDiff = sorted.length > 1 ? (sorted[sorted.length - 1].km || 0) - (sorted[0].km || 0) : 0;
                const avgKmL = kmDiff > 0 && totalLiters > 0 ? kmDiff / totalLiters : null;
                const costPerKm = kmDiff > 0 ? totalSpent / kmDiff : null;
                return {
                    name: data.name,
                    plate: data.plate,
                    totalLiters,
                    totalSpent,
                    kmDiff,
                    avgKmL,
                    costPerKm,
                    fillCount: sorted.length,
                };
            })
            .sort((a, b) => (b.avgKmL || 0) - (a.avgKmL || 0)); // Melhor consumo primeiro
    }, [allFuelRecords]);

    const fleetAvgKmL = useMemo(() => {
        const withData = vehicleConsumption.filter((v) => v.avgKmL !== null);
        if (withData.length === 0) return null;
        return withData.reduce((s, v) => s + v.avgKmL, 0) / withData.length;
    }, [vehicleConsumption]);

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
            {/* Error Banner */}
            {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                    <button onClick={fetchDashboard} className="ml-auto text-red-700 underline font-medium">Tentar novamente</button>
                </div>
            )}

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
                <KPICard icon="local_gas_station" iconBg="bg-orange-100 text-orange-600" label="Gastos Combustível" value={`R$ ${stats.fuelTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} subtitle="Total geral" />
                <KPICard icon="build" iconBg="bg-purple-100 text-purple-600" label="Gastos Manutenção" value={`R$ ${stats.maintenanceTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} subtitle="Total geral" />
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
                    <Link key={a.href} href={a.href} className={`${a.color} text-white rounded-xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity shadow-sm`}>
                        <span className="material-symbols-outlined">{a.icon}</span>
                        <span className="text-sm font-semibold">{a.label}</span>
                    </Link>
                ))}
            </div>

            {/* ⛽ Consumo por Veículo */}
            {vehicleConsumption.length > 0 && (
                <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">speed</span>
                            <h2 className="text-lg font-bold text-text-primary">Consumo por Veículo</h2>
                        </div>
                        {fleetAvgKmL !== null && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-text-secondary">Média da frota:</span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold ${fleetAvgKmL >= 10 ? "bg-emerald-50 text-emerald-700" : fleetAvgKmL >= 7 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                                    }`}>
                                    {fleetAvgKmL.toFixed(1)} km/L
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                        {vehicleConsumption.map((v, i) => {
                            const eff = v.avgKmL;
                            let borderColor = "border-border";
                            let bgColor = "";
                            let effColor = "text-text-secondary";
                            let effBg = "bg-slate-100";
                            let icon = "remove";
                            if (eff !== null) {
                                if (eff >= 10) { borderColor = "border-emerald-200"; bgColor = "bg-emerald-50/30"; effColor = "text-emerald-700"; effBg = "bg-emerald-50"; icon = "trending_up"; }
                                else if (eff >= 7) { borderColor = "border-amber-200"; bgColor = "bg-amber-50/30"; effColor = "text-amber-700"; effBg = "bg-amber-50"; icon = "trending_flat"; }
                                else { borderColor = "border-red-200"; bgColor = "bg-red-50/30"; effColor = "text-red-700"; effBg = "bg-red-50"; icon = "trending_down"; }
                            }
                            return (
                                <div key={i} className={`rounded-xl border ${borderColor} ${bgColor} p-4 flex flex-col gap-3 transition-shadow hover:shadow-md`}>
                                    {/* Vehicle Name */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-text-primary">{v.name}</div>
                                            <div className="text-xs text-text-secondary font-mono">{v.plate}</div>
                                        </div>
                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${effBg} ${effColor} font-bold text-base`}>
                                            <span className="material-symbols-outlined text-lg">{icon}</span>
                                            {eff !== null ? `${eff.toFixed(1)}` : "—"}
                                            <span className="text-xs font-medium ml-0.5">km/L</span>
                                        </div>
                                    </div>
                                    {/* Stats row */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-surface rounded-lg p-2">
                                            <div className="text-xs text-text-secondary">Litros</div>
                                            <div className="text-sm font-bold text-text-primary">{v.totalLiters.toFixed(0)}L</div>
                                        </div>
                                        <div className="bg-surface rounded-lg p-2">
                                            <div className="text-xs text-text-secondary">Gasto</div>
                                            <div className="text-sm font-bold text-text-primary">R$ {v.totalSpent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</div>
                                        </div>
                                        <div className="bg-surface rounded-lg p-2">
                                            <div className="text-xs text-text-secondary">KM Rod.</div>
                                            <div className="text-sm font-bold text-text-primary">{v.kmDiff > 0 ? v.kmDiff.toLocaleString("pt-BR") : "—"}</div>
                                        </div>
                                    </div>
                                    {/* Cost per km */}
                                    {v.costPerKm !== null && (
                                        <div className="text-xs text-text-secondary text-right">
                                            Custo: <span className="font-semibold text-primary">R$ {v.costPerKm.toFixed(2)}/km</span>
                                            <span className="mx-1">•</span>
                                            {v.fillCount} abastecimento{v.fillCount > 1 ? "s" : ""}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="px-6 py-3 border-t border-border bg-background/30 text-xs text-text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span>📗 ≥10 km/L (ótimo) • 📙 ≥7 km/L (regular) • 📕 &lt;7 km/L (alto consumo)</span>
                    </div>
                </div>
            )}

            {/* Recent Fuel */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">local_gas_station</span>
                        <h2 className="text-lg font-bold text-text-primary">Últimos Abastecimentos</h2>
                    </div>
                    <Link href="/combustivel" className="text-sm text-primary-light font-medium hover:underline">Ver todos →</Link>
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
                    <Link href="/manutencao" className="text-sm text-primary-light font-medium hover:underline">Ver todas →</Link>
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
