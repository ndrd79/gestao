import StatusBadge from "@/components/StatusBadge";
import KPICard from "@/components/KPICard";

// Múltiplos registros por veículo para calcular média
const fuelRecords = [
    { date: "12/05/2024", vehicle: "Fiorino 01", plate: "ABC-1234", driver: "João Silva", liters: 45, total: 265.05, km: 56320, status: "Aprovado" },
    { date: "05/05/2024", vehicle: "Fiorino 01", plate: "ABC-1234", driver: "João Silva", liters: 42, total: 247.38, km: 55780, status: "Aprovado" },
    { date: "28/04/2024", vehicle: "Fiorino 01", plate: "ABC-1234", driver: "João Silva", liters: 48, total: 282.72, km: 55200, status: "Aprovado" },
    { date: "11/05/2024", vehicle: "VW Gol", plate: "DEF-5678", driver: "Carlos Mendes", liters: 35, total: 202.65, km: 15800, status: "Pendente" },
    { date: "01/05/2024", vehicle: "VW Gol", plate: "DEF-5678", driver: "Carlos Mendes", liters: 32, total: 185.28, km: 15420, status: "Aprovado" },
    { date: "10/05/2024", vehicle: "Strada 02", plate: "GHI-9012", driver: "Roberto Dias", liters: 40, total: 235.60, km: 32150, status: "Aprovado" },
    { date: "02/05/2024", vehicle: "Strada 02", plate: "GHI-9012", driver: "Roberto Dias", liters: 38, total: 223.82, km: 31600, status: "Aprovado" },
    { date: "09/05/2024", vehicle: "Van Executiva", plate: "JKL-3456", driver: "Maria Oliveira", liters: 60, total: 371.40, km: 89500, status: "Aprovado" },
    { date: "30/04/2024", vehicle: "Van Executiva", plate: "JKL-3456", driver: "Maria Oliveira", liters: 55, total: 340.45, km: 88850, status: "Aprovado" },
];

// Calcular métricas por veículo
function calcVehicleMetrics(records) {
    const byVehicle = {};

    records.forEach((r) => {
        if (!byVehicle[r.vehicle]) {
            byVehicle[r.vehicle] = { plate: r.plate, records: [] };
        }
        byVehicle[r.vehicle].records.push(r);
    });

    return Object.entries(byVehicle).map(([name, data]) => {
        const sorted = data.records.sort((a, b) => a.km - b.km);
        const totalLiters = sorted.reduce((sum, r) => sum + r.liters, 0);
        const totalSpent = sorted.reduce((sum, r) => sum + r.total, 0);
        const kmDiff = sorted[sorted.length - 1].km - sorted[0].km;
        const avgKmL = kmDiff > 0 ? (kmDiff / totalLiters).toFixed(1) : "—";
        const avgPriceL = (totalSpent / totalLiters).toFixed(2);
        const costPerKm = kmDiff > 0 ? (totalSpent / kmDiff).toFixed(2) : "—";
        const fillCount = sorted.length;

        return {
            name,
            plate: data.plate,
            totalLiters,
            totalSpent,
            kmDiff,
            avgKmL,
            avgPriceL,
            costPerKm,
            fillCount,
        };
    });
}

// Totais gerais
function calcTotals(records) {
    const totalLiters = records.reduce((s, r) => s + r.liters, 0);
    const totalSpent = records.reduce((s, r) => s + r.total, 0);
    const avgPriceL = (totalSpent / totalLiters).toFixed(2);
    return { totalLiters, totalSpent, avgPriceL, totalRecords: records.length };
}

export default function CombustivelPage() {
    const vehicleMetrics = calcVehicleMetrics(fuelRecords);
    const totals = calcTotals(fuelRecords);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Gestão de Combustível</h1>
                    <p className="text-text-secondary mt-1">Registre e acompanhe abastecimentos da frota.</p>
                </div>
            </div>

            {/* KPI Resumo Geral */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KPICard
                    icon="local_gas_station"
                    iconBg="bg-orange-100 text-orange-600"
                    label="Total de Litros"
                    value={`${totals.totalLiters}L`}
                    subtitle={`${totals.totalRecords} abastecimentos`}
                />
                <KPICard
                    icon="payments"
                    iconBg="bg-accent/20 text-amber-700"
                    label="Total Gasto"
                    value={`R$ ${totals.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    subtitle="No período"
                />
                <KPICard
                    icon="price_change"
                    iconBg="bg-primary/10 text-primary"
                    label="Preço Médio/Litro"
                    value={`R$ ${totals.avgPriceL}`}
                    subtitle="Média de todos os registros"
                />
                <KPICard
                    icon="directions_car"
                    iconBg="bg-emerald-50 text-emerald-600"
                    label="Veículos Abastecidos"
                    value={vehicleMetrics.length}
                    subtitle="Com registros no período"
                />
            </div>

            {/* ===== RESUMO POR VEÍCULO ===== */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-background/50">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                    <h2 className="text-lg font-bold text-text-primary">Consumo Médio por Veículo</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 border-b border-border">
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Veículo</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">Abastecimentos</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Total Litros</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Total Gasto</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">KM Rodados</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">
                                    <span className="inline-flex items-center gap-1">
                                        ⛽ Média km/L
                                    </span>
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">R$/Litro</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">R$/km</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {vehicleMetrics.map((v, i) => {
                                const efficiency = parseFloat(v.avgKmL);
                                let effColor = "text-text-primary";
                                let effBg = "";
                                if (!isNaN(efficiency)) {
                                    if (efficiency >= 10) { effColor = "text-emerald-700"; effBg = "bg-emerald-50"; }
                                    else if (efficiency >= 7) { effColor = "text-amber-700"; effBg = "bg-amber-50"; }
                                    else { effColor = "text-red-700"; effBg = "bg-red-50"; }
                                }

                                return (
                                    <tr key={i} className="hover:bg-background/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                                    <span className="material-symbols-outlined text-lg">directions_car</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-text-primary">{v.name}</div>
                                                    <div className="text-xs text-text-secondary font-mono">{v.plate}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-7 h-7 bg-background rounded-full text-sm font-bold text-text-primary">
                                                {v.fillCount}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-text-primary font-medium text-right">{v.totalLiters}L</td>
                                        <td className="px-5 py-4 text-sm text-text-primary font-medium text-right">
                                            R$ {v.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-text-secondary text-right">
                                            {v.kmDiff > 0 ? `${v.kmDiff.toLocaleString("pt-BR")} km` : "—"}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-bold ${effColor} ${effBg}`}>
                                                {v.avgKmL} km/L
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-text-secondary text-right">R$ {v.avgPriceL}</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-right">
                                            {v.costPerKm !== "—" ? (
                                                <span className="text-primary">R$ {v.costPerKm}</span>
                                            ) : "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Legenda */}
                <div className="px-6 py-3 border-t border-border bg-background/50 flex flex-wrap gap-4 text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> ≥ 10 km/L (bom)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-amber-500"></span> 7–10 km/L (regular)
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-red-500"></span> &lt; 7 km/L (alto consumo)
                    </span>
                </div>
            </div>

            {/* ===== Formulário ===== */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-background/50">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    <h2 className="text-lg font-bold text-text-primary">Registrar Novo Abastecimento</h2>
                </div>
                <div className="p-6">
                    <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Veículo</label>
                            <select className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="">Selecionar veículo</option>
                                <option>Fiorino 01 - ABC-1234</option>
                                <option>VW Gol - DEF-5678</option>
                                <option>Strada 02 - GHI-9012</option>
                                <option>Van Executiva - JKL-3456</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Data</label>
                            <input type="date" className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Litros</label>
                            <input type="number" placeholder="0" className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Valor Total (R$)</label>
                            <input type="number" placeholder="0,00" step="0.01" className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">KM Atual</label>
                            <input type="number" placeholder="0" className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="lg:col-span-6 flex justify-end pt-2">
                            <button type="button" className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg shadow-sm text-sm font-bold transition-all active:scale-[0.98]">
                                <span className="material-symbols-outlined text-[20px]">save</span>
                                Registrar Abastecimento
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ===== Histórico ===== */}
            <div>
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-text-primary">Histórico de Abastecimentos</h2>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary material-symbols-outlined">search</span>
                            <input className="block w-full sm:w-64 pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Buscar..." />
                        </div>
                        <select className="px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-primary focus:border-primary">
                            <option>Todos veículos</option>
                        </select>
                    </div>
                </div>

                <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 border-b border-border">
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Data</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Veículo</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Motorista</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Litros</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">R$/L</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Total</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">KM</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {fuelRecords.map((r, i) => (
                                    <tr key={i} className="hover:bg-background/50 transition-colors">
                                        <td className="px-5 py-3 text-sm text-text-secondary">{r.date}</td>
                                        <td className="px-5 py-3">
                                            <div className="text-sm font-medium text-text-primary">{r.vehicle}</div>
                                            <div className="text-xs text-text-secondary">{r.plate}</div>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-text-secondary">{r.driver}</td>
                                        <td className="px-5 py-3 text-sm text-text-primary font-medium text-right">{r.liters}L</td>
                                        <td className="px-5 py-3 text-sm text-text-secondary text-right">
                                            R$ {(r.total / r.liters).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-text-primary font-semibold text-right">
                                            R$ {r.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-text-secondary text-right">
                                            {r.km.toLocaleString("pt-BR")} km
                                        </td>
                                        <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
