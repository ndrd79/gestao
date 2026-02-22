"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StatusBadge from "@/components/StatusBadge";
import KPICard from "@/components/KPICard";

export default function CombustivelPage() {
    const [records, setRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [vehicleFilter, setVehicleFilter] = useState("todos");
    const [form, setForm] = useState({
        vehicle_id: "", date: "", liters: "", total: "", km: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const [fuelRes, vehRes] = await Promise.all([
            supabase
                .from("fuel_records")
                .select("*, vehicle:vehicles(name, plate)")
                .order("date", { ascending: false }),
            supabase.from("vehicles").select("id, name, plate").order("name"),
        ]);
        setRecords(fuelRes.data || []);
        setVehicles(vehRes.data || []);
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        const liters = parseFloat(form.liters);
        const total = parseFloat(form.total);

        await supabase.from("fuel_records").insert({
            vehicle_id: form.vehicle_id,
            date: form.date,
            liters,
            price_per_liter: parseFloat((total / liters).toFixed(2)),
            total,
            km: parseInt(form.km),
            status: "pendente",
        });

        // Atualizar KM do veículo
        await supabase
            .from("vehicles")
            .update({ km: parseInt(form.km) })
            .eq("id", form.vehicle_id);

        setForm({ vehicle_id: "", date: "", liters: "", total: "", km: "" });
        setSaving(false);
        fetchData();
    }

    // --- Métricas por veículo ---
    function calcVehicleMetrics() {
        const byVehicle = {};
        records.forEach((r) => {
            const vName = r.vehicle?.name || "—";
            const vPlate = r.vehicle?.plate || "";
            if (!byVehicle[vName]) byVehicle[vName] = { plate: vPlate, records: [] };
            byVehicle[vName].records.push(r);
        });

        return Object.entries(byVehicle).map(([name, data]) => {
            const sorted = [...data.records].sort((a, b) => a.km - b.km);
            const totalLiters = sorted.reduce((s, r) => s + Number(r.liters), 0);
            const totalSpent = sorted.reduce((s, r) => s + Number(r.total), 0);
            const kmDiff = sorted.length > 1 ? sorted[sorted.length - 1].km - sorted[0].km : 0;
            const avgKmL = kmDiff > 0 ? (kmDiff / totalLiters).toFixed(1) : "—";
            const avgPriceL = totalLiters > 0 ? (totalSpent / totalLiters).toFixed(2) : "0";
            const costPerKm = kmDiff > 0 ? (totalSpent / kmDiff).toFixed(2) : "—";
            return { name, plate: data.plate, totalLiters, totalSpent, kmDiff, avgKmL, avgPriceL, costPerKm, fillCount: sorted.length };
        });
    }

    const vehicleMetrics = calcVehicleMetrics();
    const totalLiters = records.reduce((s, r) => s + Number(r.liters), 0);
    const totalSpent = records.reduce((s, r) => s + Number(r.total), 0);
    const avgPrice = totalLiters > 0 ? (totalSpent / totalLiters).toFixed(2) : "0";

    const filtered = records.filter((r) => {
        const vName = r.vehicle?.name?.toLowerCase() || "";
        const matchSearch = vName.includes(search.toLowerCase());
        const matchVehicle = vehicleFilter === "todos" || r.vehicle_id === vehicleFilter;
        return matchSearch && matchVehicle;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Gestão de Combustível</h1>
                <p className="text-text-secondary mt-1">Registre e acompanhe abastecimentos da frota.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KPICard icon="local_gas_station" iconBg="bg-orange-100 text-orange-600" label="Total de Litros" value={`${totalLiters.toFixed(0)}L`} subtitle={`${records.length} abastecimentos`} />
                <KPICard icon="payments" iconBg="bg-accent/20 text-amber-700" label="Total Gasto" value={`R$ ${totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} subtitle="No período" />
                <KPICard icon="price_change" iconBg="bg-primary/10 text-primary" label="Preço Médio/Litro" value={`R$ ${avgPrice}`} subtitle="Média geral" />
                <KPICard icon="directions_car" iconBg="bg-emerald-50 text-emerald-600" label="Veículos" value={vehicleMetrics.length} subtitle="Com registros" />
            </div>

            {/* Consumo por veículo */}
            {vehicleMetrics.length > 0 && (
                <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-background/50">
                        <span className="material-symbols-outlined text-primary">analytics</span>
                        <h2 className="text-lg font-bold text-text-primary">Consumo Médio por Veículo</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 border-b border-border">
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Veículo</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-center">Abast.</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Litros</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Gasto</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">KM Rod.</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">⛽ km/L</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">R$/km</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {vehicleMetrics.map((v, i) => {
                                    const eff = parseFloat(v.avgKmL);
                                    let ec = "text-text-primary", eb = "";
                                    if (!isNaN(eff)) { if (eff >= 10) { ec = "text-emerald-700"; eb = "bg-emerald-50"; } else if (eff >= 7) { ec = "text-amber-700"; eb = "bg-amber-50"; } else { ec = "text-red-700"; eb = "bg-red-50"; } }
                                    return (
                                        <tr key={i} className="hover:bg-background/50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="text-sm font-semibold text-text-primary">{v.name}</div>
                                                <div className="text-xs text-text-secondary font-mono">{v.plate}</div>
                                            </td>
                                            <td className="px-5 py-3 text-center text-sm">{v.fillCount}</td>
                                            <td className="px-5 py-3 text-right text-sm">{v.totalLiters.toFixed(0)}L</td>
                                            <td className="px-5 py-3 text-right text-sm">R$ {v.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                            <td className="px-5 py-3 text-right text-sm text-text-secondary">{v.kmDiff > 0 ? `${v.kmDiff.toLocaleString("pt-BR")} km` : "—"}</td>
                                            <td className="px-5 py-3 text-right"><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-bold ${ec} ${eb}`}>{v.avgKmL} km/L</span></td>
                                            <td className="px-5 py-3 text-right text-sm font-semibold text-primary">{v.costPerKm !== "—" ? `R$ ${v.costPerKm}` : "—"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-3 border-t border-border bg-background/50 flex flex-wrap gap-4 text-xs text-text-secondary">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500"></span> ≥ 10 km/L (bom)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500"></span> 7–10 km/L (regular)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500"></span> &lt; 7 km/L (alto consumo)</span>
                    </div>
                </div>
            )}

            {/* Formulário */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-background/50">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    <h2 className="text-lg font-bold text-text-primary">Registrar Abastecimento</h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Veículo</label>
                            <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="">Selecionar veículo</option>
                                {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.name} - {v.plate}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Data</label>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Litros</label>
                            <input type="number" step="0.01" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} required placeholder="0" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Valor Total (R$)</label>
                            <input type="number" step="0.01" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} required placeholder="0,00" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">KM Atual</label>
                            <input type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} required placeholder="0" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="lg:col-span-6 flex justify-end pt-2">
                            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60">
                                <span className="material-symbols-outlined text-[20px]">save</span>
                                {saving ? "Salvando..." : "Registrar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Histórico */}
            <div>
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-text-primary">Histórico</h2>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary material-symbols-outlined">search</span>
                            <input value={search} onChange={(e) => setSearch(e.target.value)} className="block w-full sm:w-64 pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Buscar..." />
                        </div>
                        <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className="px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-primary focus:border-primary">
                            <option value="todos">Todos veículos</option>
                            {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
                        </select>
                    </div>
                </div>

                <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-text-secondary">
                            <span className="material-symbols-outlined text-4xl animate-pulse">sync</span>
                            <p className="mt-2 text-sm">Carregando...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-text-secondary">
                            <span className="material-symbols-outlined text-4xl">local_gas_station</span>
                            <p className="mt-2 text-sm">Nenhum abastecimento registrado.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-background/50 border-b border-border">
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Data</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Veículo</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Litros</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">R$/L</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Total</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">KM</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filtered.map((r) => (
                                        <tr key={r.id} className="hover:bg-background/50 transition-colors">
                                            <td className="px-5 py-3 text-sm text-text-secondary">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                                            <td className="px-5 py-3">
                                                <div className="text-sm font-medium text-text-primary">{r.vehicle?.name}</div>
                                                <div className="text-xs text-text-secondary">{r.vehicle?.plate}</div>
                                            </td>
                                            <td className="px-5 py-3 text-sm font-medium text-right">{Number(r.liters).toFixed(1)}L</td>
                                            <td className="px-5 py-3 text-sm text-text-secondary text-right">R$ {Number(r.price_per_liter).toFixed(2)}</td>
                                            <td className="px-5 py-3 text-sm font-semibold text-right">R$ {Number(r.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                            <td className="px-5 py-3 text-sm text-text-secondary text-right">{r.km?.toLocaleString("pt-BR")} km</td>
                                            <td className="px-5 py-3"><StatusBadge status={r.status === "pendente" ? "Pendente" : "Aprovado"} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
