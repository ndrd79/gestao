import KPICard from "@/components/KPICard";

const vehicleData = [
    { vehicle: "Fiorino 01", plate: "ABC-1234", fuel: "R$ 1.250", maint: "R$ 350", km: "5.200 km", unit: "R$ 0,31/km" },
    { vehicle: "VW Gol", plate: "DEF-5678", fuel: "R$ 820", maint: "R$ 650", km: "3.100 km", unit: "R$ 0,47/km" },
    { vehicle: "Strada 02", plate: "GHI-9012", fuel: "R$ 980", maint: "R$ 120", km: "4.800 km", unit: "R$ 0,23/km" },
    { vehicle: "Van Executiva", plate: "JKL-3456", fuel: "R$ 1.800", maint: "R$ 0", km: "6.500 km", unit: "R$ 0,28/km" },
    { vehicle: "Caminhão 03", plate: "XYZ-9876", fuel: "R$ 2.100", maint: "R$ 1.200", km: "8.200 km", unit: "R$ 0,40/km" },
];

const barData = [
    { label: "Fiorino 01", value: 1600, max: 3300 },
    { label: "VW Gol", value: 1470, max: 3300 },
    { label: "Strada 02", value: 1100, max: 3300 },
    { label: "Van Exec.", value: 1800, max: 3300 },
    { label: "Caminhão", value: 3300, max: 3300 },
];

const linePoints = [
    { month: "Jan", value: 2800 },
    { month: "Fev", value: 3200 },
    { month: "Mar", value: 2900 },
    { month: "Abr", value: 3500 },
    { month: "Mai", value: 4250 },
];

export default function RelatoriosPage() {
    const maxLine = Math.max(...linePoints.map((p) => p.value));

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Relatórios e Gráficos</h1>
                    <p className="text-text-secondary mt-1">Análise de custos e desempenho da frota.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-primary focus:border-primary">
                        <option>Maio 2024</option>
                        <option>Abril 2024</option>
                        <option>Março 2024</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm font-semibold text-text-primary hover:bg-background transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Exportar
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <KPICard icon="payments" iconBg="bg-accent/20 text-amber-700" label="Gasto Total" value="R$ 8.970" badge={{ text: "+5%", color: "bg-emerald-100 text-emerald-700" }} subtitle="Combustível + Manutenção" />
                <KPICard icon="local_gas_station" iconBg="bg-orange-100 text-orange-600" label="Litros Consumidos" value="1.280L" subtitle="Média: 256L por veículo" />
                <KPICard icon="speed" iconBg="bg-primary/10 text-primary" label="Km Rodados" value="27.800 km" subtitle="Média: 5.560 km por veículo" />
            </div>

            {/* Charts */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-6">Gastos por Veículo</h3>
                    <div className="space-y-4">
                        {barData.map((bar, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs font-medium text-text-secondary w-20 text-right truncate">{bar.label}</span>
                                <div className="flex-1 bg-background rounded-full h-6 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                        style={{ width: `${(bar.value / bar.max) * 100}%` }}
                                    >
                                        <span className="text-[10px] font-bold text-white whitespace-nowrap">R$ {bar.value.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Line Chart (CSS-based) */}
                <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-6">Consumo Mensal (R$)</h3>
                    <div className="flex items-end gap-3 h-48">
                        {linePoints.map((point, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-text-primary">R$ {point.value.toLocaleString()}</span>
                                <div className="w-full bg-background rounded-t-md overflow-hidden flex-1 flex items-end">
                                    <div
                                        className="w-full bg-gradient-to-t from-accent to-accent/60 rounded-t-md transition-all duration-500"
                                        style={{ height: `${(point.value / maxLine) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs font-medium text-text-secondary">{point.month}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border">
                    <h3 className="text-lg font-bold text-text-primary">Dados Detalhados</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-background/50 border-b border-border">
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Veículo</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Combustível</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Manutenção</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Km Rodados</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Custo/Km</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {vehicleData.map((v, i) => (
                                <tr key={i} className="hover:bg-background/50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="font-medium text-text-primary">{v.vehicle}</div>
                                        <div className="text-xs text-text-secondary">{v.plate}</div>
                                    </td>
                                    <td className="px-5 py-3 text-right font-medium text-text-primary">{v.fuel}</td>
                                    <td className="px-5 py-3 text-right text-text-secondary">{v.maint}</td>
                                    <td className="px-5 py-3 text-right text-text-secondary">{v.km}</td>
                                    <td className="px-5 py-3 text-right font-semibold text-primary">{v.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
