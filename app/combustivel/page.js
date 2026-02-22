import StatusBadge from "@/components/StatusBadge";

const fuelRecords = [
    { date: "12/05/2024", vehicle: "Fiorino 01", plate: "ABC-1234", driver: "João Silva", liters: "45", pricePerLiter: "R$ 5,89", total: "R$ 265,05", km: "56.320 km", status: "Aprovado" },
    { date: "11/05/2024", vehicle: "VW Gol", plate: "DEF-5678", driver: "Carlos Mendes", liters: "35", pricePerLiter: "R$ 5,79", total: "R$ 202,65", km: "15.800 km", status: "Pendente" },
    { date: "10/05/2024", vehicle: "Strada 02", plate: "GHI-9012", driver: "Roberto Dias", liters: "40", pricePerLiter: "R$ 5,89", total: "R$ 235,60", km: "32.150 km", status: "Aprovado" },
    { date: "09/05/2024", vehicle: "Van Executiva", plate: "JKL-3456", driver: "Maria Oliveira", liters: "60", pricePerLiter: "R$ 6,19", total: "R$ 371,40", km: "89.500 km", status: "Aprovado" },
];

export default function CombustivelPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Gestão de Combustível</h1>
                    <p className="text-text-secondary mt-1">Registre e acompanhe abastecimentos da frota.</p>
                </div>
            </div>

            {/* Form */}
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

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary material-symbols-outlined">search</span>
                    <input className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Buscar abastecimentos..." />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <input type="date" className="px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    <select className="px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-primary focus:border-primary">
                        <option>Todos veículos</option>
                    </select>
                </div>
            </div>

            {/* Table */}
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
                                    <td className="px-5 py-3 text-sm text-text-secondary text-right">{r.pricePerLiter}</td>
                                    <td className="px-5 py-3 text-sm text-text-primary font-semibold text-right">{r.total}</td>
                                    <td className="px-5 py-3 text-sm text-text-secondary text-right">{r.km}</td>
                                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
