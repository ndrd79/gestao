import StatusBadge from "@/components/StatusBadge";

const maintenanceRecords = [
    { date: "15/05/2024", vehicle: "Fiorino 01", plate: "ABC-1234", service: "Troca de Óleo", status: "Pendente", value: "R$ 180,00", description: "Lubrificante 5W30" },
    { date: "10/05/2024", vehicle: "VW Gol", plate: "DEF-5678", service: "Revisão Geral", status: "Concluído", value: "R$ 650,00", description: "Revisão 30.000 km" },
    { date: "08/05/2024", vehicle: "Ford Ka", plate: "MNO-3456", service: "Troca de Pneus", status: "Atrasado", value: "R$ 1.200,00", description: "4 pneus 15 polegadas" },
    { date: "05/05/2024", vehicle: "Strada 02", plate: "GHI-9012", service: "Alinhamento", status: "Concluído", value: "R$ 120,00", description: "Alinhamento e balanceamento" },
];

export default function ManutencaoPage() {
    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Manutenção de Veículos</h1>
                    <p className="text-text-secondary mt-1">Registre e acompanhe manutenções da frota.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm font-semibold text-text-primary hover:bg-background transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Exportar Relatório
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Form */}
                <div className="lg:col-span-1">
                    <div className="bg-surface rounded-xl shadow-sm border border-border sticky top-24">
                        <div className="px-6 py-4 border-b border-border flex items-center gap-3 bg-background/50">
                            <span className="material-symbols-outlined text-primary">add_circle</span>
                            <h3 className="font-bold text-lg text-text-primary">Nova Manutenção</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Veículo</label>
                                <select className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option>Selecionar veículo</option>
                                    <option>Fiorino 01 - ABC-1234</option>
                                    <option>VW Gol - DEF-5678</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Tipo de Serviço</label>
                                <select className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option>Selecionar serviço</option>
                                    <option>Troca de Óleo</option>
                                    <option>Revisão Geral</option>
                                    <option>Troca de Pneus</option>
                                    <option>Alinhamento</option>
                                    <option>Freios</option>
                                    <option>Correia</option>
                                    <option>Outro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Data</label>
                                <input type="date" className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Valor (R$)</label>
                                <input type="number" step="0.01" placeholder="0,00" className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Descrição</label>
                                <textarea rows={3} placeholder="Detalhes do serviço..." className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"></textarea>
                            </div>
                            <button type="button" className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-lg shadow-sm text-sm transition-all active:scale-[0.98]">
                                Registrar Manutenção
                            </button>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Filters */}
                    <div className="bg-surface p-4 rounded-xl border border-border flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
                        <div className="relative w-full sm:max-w-sm">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary">search</span>
                            <input className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-background text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Buscar manutenção..." />
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <select className="px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-primary focus:border-primary">
                                <option>Todos veículos</option>
                            </select>
                            <input type="date" className="px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-background/50 border-b border-border">
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Data</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Veículo</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Serviço</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Valor</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {maintenanceRecords.map((r, i) => (
                                        <tr key={i} className="hover:bg-background/50 transition-colors group">
                                            <td className="px-5 py-3 text-sm text-text-secondary">{r.date}</td>
                                            <td className="px-5 py-3">
                                                <div className="text-sm font-medium text-text-primary">{r.vehicle}</div>
                                                <div className="text-xs text-text-secondary">{r.plate}</div>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-text-primary">{r.service}</td>
                                            <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                                            <td className="px-5 py-3 text-sm text-text-primary font-semibold text-right">{r.value}</td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 text-text-secondary hover:text-primary rounded-lg hover:bg-background transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button className="p-1.5 text-text-secondary hover:text-danger rounded-lg hover:bg-red-50 transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
