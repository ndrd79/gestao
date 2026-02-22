"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import KPICard from "@/components/KPICard";

export default function RelatoriosPage() {
    const [fuelRecords, setFuelRecords] = useState([]);
    const [maintRecords, setMaintRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtro de período
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(0); // 0 = todos

    const MONTHS = ["Todos os Meses", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const [fRes, mRes, vRes] = await Promise.all([
                supabase.from("fuel_records").select("*, vehicle:vehicles(name, plate)").order("date", { ascending: false }),
                supabase.from("maintenance").select("*, vehicle:vehicles(name, plate)").order("date", { ascending: false }),
                supabase.from("vehicles").select("id, name, plate, km").order("name"),
            ]);

            if (fRes.error) throw fRes.error;
            if (mRes.error) throw mRes.error;
            if (vRes.error) throw vRes.error;

            setFuelRecords(fRes.data || []);
            setMaintRecords(mRes.data || []);
            setVehicles(vRes.data || []);
        } catch (err) {
            console.error("Erro ao carregar relatórios:", err);
            setError("Erro ao carregar dados. Tente recarregar.");
        } finally {
            setLoading(false);
        }
    }

    // Filtrar registros por período
    const filteredFuel = useMemo(() => {
        return fuelRecords.filter((r) => {
            const d = new Date(r.date);
            if (d.getFullYear() !== selectedYear) return false;
            if (selectedMonth > 0 && d.getMonth() + 1 !== selectedMonth) return false;
            return true;
        });
    }, [fuelRecords, selectedYear, selectedMonth]);

    const filteredMaint = useMemo(() => {
        return maintRecords.filter((r) => {
            const d = new Date(r.date);
            if (d.getFullYear() !== selectedYear) return false;
            if (selectedMonth > 0 && d.getMonth() + 1 !== selectedMonth) return false;
            return true;
        });
    }, [maintRecords, selectedYear, selectedMonth]);

    // KPIs
    const totalFuelSpent = useMemo(() => filteredFuel.reduce((s, r) => s + Number(r.total || 0), 0), [filteredFuel]);
    const totalMaintSpent = useMemo(() => filteredMaint.reduce((s, r) => s + Number(r.cost || 0), 0), [filteredMaint]);
    const totalSpent = totalFuelSpent + totalMaintSpent;
    const totalLiters = useMemo(() => filteredFuel.reduce((s, r) => s + Number(r.liters || 0), 0), [filteredFuel]);

    // Dados por veículo (para gráfico de barras e tabela)
    const vehicleData = useMemo(() => {
        const map = {};
        vehicles.forEach((v) => {
            map[v.id] = { id: v.id, name: v.name, plate: v.plate, fuel: 0, maint: 0, liters: 0, fuelKms: [] };
        });

        filteredFuel.forEach((r) => {
            if (map[r.vehicle_id]) {
                map[r.vehicle_id].fuel += Number(r.total || 0);
                map[r.vehicle_id].liters += Number(r.liters || 0);
                if (r.km) map[r.vehicle_id].fuelKms.push(r.km);
            }
        });

        filteredMaint.forEach((r) => {
            if (map[r.vehicle_id]) {
                map[r.vehicle_id].maint += Number(r.cost || 0);
            }
        });

        return Object.values(map)
            .filter((v) => v.fuel > 0 || v.maint > 0)
            .map((v) => {
                const totalCost = v.fuel + v.maint;
                const kms = v.fuelKms.sort((a, b) => a - b);
                const kmDiff = kms.length > 1 ? kms[kms.length - 1] - kms[0] : 0;
                const costPerKm = kmDiff > 0 ? (totalCost / kmDiff).toFixed(2) : "—";
                const avgKmL = kmDiff > 0 && v.liters > 0 ? (kmDiff / v.liters).toFixed(1) : "—";
                return { ...v, total: totalCost, kmDiff, costPerKm, avgKmL };
            })
            .sort((a, b) => b.total - a.total);
    }, [vehicles, filteredFuel, filteredMaint]);

    // Dados mensais (para gráfico de colunas)
    const monthlyData = useMemo(() => {
        const months = {};
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        // Inicializar meses do ano selecionado
        for (let i = 0; i < 12; i++) {
            months[i] = { month: monthNames[i], fuel: 0, maint: 0, total: 0 };
        }

        fuelRecords.forEach((r) => {
            const d = new Date(r.date);
            if (d.getFullYear() === selectedYear) {
                months[d.getMonth()].fuel += Number(r.total || 0);
                months[d.getMonth()].total += Number(r.total || 0);
            }
        });

        maintRecords.forEach((r) => {
            const d = new Date(r.date);
            if (d.getFullYear() === selectedYear) {
                months[d.getMonth()].maint += Number(r.cost || 0);
                months[d.getMonth()].total += Number(r.cost || 0);
            }
        });

        return Object.values(months);
    }, [fuelRecords, maintRecords, selectedYear]);

    const maxMonthly = useMemo(() => Math.max(...monthlyData.map((m) => m.total), 1), [monthlyData]);
    const maxVehicle = useMemo(() => Math.max(...vehicleData.map((v) => v.total), 1), [vehicleData]);

    // Calcular KM total rodado
    const totalKm = useMemo(() => vehicleData.reduce((s, v) => s + v.kmDiff, 0), [vehicleData]);

    // Gerar anos disponíveis
    const availableYears = useMemo(() => {
        const years = new Set();
        fuelRecords.forEach((r) => years.add(new Date(r.date).getFullYear()));
        maintRecords.forEach((r) => years.add(new Date(r.date).getFullYear()));
        years.add(now.getFullYear());
        return [...years].sort((a, b) => b - a);
    }, [fuelRecords, maintRecords]);

    // Exportar CSV
    function handleExport() {
        if (vehicleData.length === 0) return;

        const headers = ["Veículo", "Placa", "Combustível (R$)", "Manutenção (R$)", "Total (R$)", "KM Rodados", "Custo/Km", "km/L"];
        const rows = vehicleData.map((v) => [
            v.name,
            v.plate,
            v.fuel.toFixed(2),
            v.maint.toFixed(2),
            v.total.toFixed(2),
            v.kmDiff || 0,
            v.costPerKm,
            v.avgKmL,
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio_frota_${selectedYear}${selectedMonth > 0 ? `_${String(selectedMonth).padStart(2, "0")}` : ""}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-8 text-center text-text-secondary">
                <span className="material-symbols-outlined text-4xl animate-pulse">sync</span>
                <p className="mt-2 text-sm">Carregando relatórios...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                    <button onClick={fetchData} className="ml-auto text-red-700 underline font-medium">Tentar novamente</button>
                </div>
            )}

            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Relatórios e Gráficos</h1>
                    <p className="text-text-secondary mt-1">Análise de custos e desempenho da frota.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-primary focus:border-primary"
                    >
                        {availableYears.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-primary focus:border-primary"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleExport}
                        disabled={vehicleData.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm font-semibold text-text-primary hover:bg-background transition-colors shadow-sm disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KPICard icon="payments" iconBg="bg-accent/20 text-amber-700" label="Gasto Total" value={`R$ ${totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} subtitle="Combustível + Manutenção" />
                <KPICard icon="local_gas_station" iconBg="bg-orange-100 text-orange-600" label="Combustível" value={`R$ ${totalFuelSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} subtitle={`${totalLiters.toFixed(0)}L consumidos`} />
                <KPICard icon="build" iconBg="bg-purple-100 text-purple-600" label="Manutenção" value={`R$ ${totalMaintSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} subtitle={`${filteredMaint.length} serviços`} />
                <KPICard icon="speed" iconBg="bg-primary/10 text-primary" label="Km Rodados" value={`${totalKm.toLocaleString("pt-BR")} km`} subtitle={`${vehicleData.length} veículos com registros`} />
            </div>

            {/* Charts */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-6">Gastos por Veículo</h3>
                    {vehicleData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-text-secondary text-sm">
                            <span className="material-symbols-outlined text-3xl mr-2">bar_chart</span>
                            Nenhum dado no período.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {vehicleData.slice(0, 8).map((v, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-text-secondary w-24 text-right truncate">{v.name}</span>
                                    <div className="flex-1 bg-background rounded-full h-6 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                            style={{ width: `${Math.max((v.total / maxVehicle) * 100, 8)}%` }}
                                        >
                                            <span className="text-[10px] font-bold text-white whitespace-nowrap">R$ {v.total.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Monthly Column Chart */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-6">Gastos Mensais ({selectedYear})</h3>
                    <div className="flex items-end gap-1.5 h-48">
                        {monthlyData.map((point, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                {point.total > 0 && (
                                    <span className="text-[9px] font-bold text-text-primary whitespace-nowrap">
                                        {(point.total / 1000).toFixed(1)}k
                                    </span>
                                )}
                                <div className="w-full bg-background rounded-t-md overflow-hidden flex-1 flex items-end">
                                    <div
                                        className="w-full rounded-t-md transition-all duration-500 flex flex-col"
                                        style={{ height: `${point.total > 0 ? Math.max((point.total / maxMonthly) * 100, 4) : 0}%` }}
                                    >
                                        {/* Fuel portion */}
                                        <div
                                            className="w-full bg-gradient-to-t from-orange-400 to-orange-300"
                                            style={{ flex: point.total > 0 ? point.fuel / point.total : 0 }}
                                        ></div>
                                        {/* Maintenance portion */}
                                        <div
                                            className="w-full bg-gradient-to-t from-purple-400 to-purple-300"
                                            style={{ flex: point.total > 0 ? point.maint / point.total : 0 }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium text-text-secondary">{point.month}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-text-secondary">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-400"></span> Combustível</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-400"></span> Manutenção</span>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border">
                    <h3 className="text-lg font-bold text-text-primary">Dados Detalhados por Veículo</h3>
                </div>
                {vehicleData.length === 0 ? (
                    <div className="p-12 text-center text-text-secondary text-sm">
                        <span className="material-symbols-outlined text-4xl">analytics</span>
                        <p className="mt-2">Nenhum dado para o período selecionado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-background/50 border-b border-border">
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Veículo</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Combustível</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Manutenção</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Total</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Km Rodados</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">km/L</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Custo/Km</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {vehicleData.map((v, i) => {
                                    const eff = parseFloat(v.avgKmL);
                                    let ec = "text-text-primary", eb = "";
                                    if (!isNaN(eff)) {
                                        if (eff >= 10) { ec = "text-emerald-700"; eb = "bg-emerald-50"; }
                                        else if (eff >= 7) { ec = "text-amber-700"; eb = "bg-amber-50"; }
                                        else { ec = "text-red-700"; eb = "bg-red-50"; }
                                    }
                                    return (
                                        <tr key={i} className="hover:bg-background/50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="font-medium text-text-primary">{v.name}</div>
                                                <div className="text-xs text-text-secondary">{v.plate}</div>
                                            </td>
                                            <td className="px-5 py-3 text-right font-medium text-text-primary">R$ {v.fuel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                            <td className="px-5 py-3 text-right text-text-secondary">R$ {v.maint.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                            <td className="px-5 py-3 text-right font-bold text-text-primary">R$ {v.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                            <td className="px-5 py-3 text-right text-text-secondary">{v.kmDiff > 0 ? `${v.kmDiff.toLocaleString("pt-BR")} km` : "—"}</td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-bold ${ec} ${eb}`}>{v.avgKmL} km/L</span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-semibold text-primary">{v.costPerKm !== "—" ? `R$ ${v.costPerKm}` : "—"}</td>
                                        </tr>
                                    );
                                })}
                                {/* Totals Row */}
                                <tr className="bg-background/50 font-bold">
                                    <td className="px-5 py-3 text-text-primary">TOTAL</td>
                                    <td className="px-5 py-3 text-right text-text-primary">R$ {totalFuelSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                    <td className="px-5 py-3 text-right text-text-primary">R$ {totalMaintSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                    <td className="px-5 py-3 text-right text-primary">R$ {totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                    <td className="px-5 py-3 text-right text-text-secondary">{totalKm.toLocaleString("pt-BR")} km</td>
                                    <td className="px-5 py-3 text-right">—</td>
                                    <td className="px-5 py-3 text-right text-primary">{totalKm > 0 ? `R$ ${(totalSpent / totalKm).toFixed(2)}` : "—"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
                {vehicleData.length > 0 && (
                    <div className="px-6 py-3 border-t border-border bg-background/50 flex flex-wrap gap-4 text-xs text-text-secondary">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500"></span> ≥ 10 km/L (bom)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500"></span> 7–10 km/L (regular)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500"></span> &lt; 7 km/L (alto consumo)</span>
                    </div>
                )}
            </div>
        </div>
    );
}
