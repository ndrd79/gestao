import StatusBadge from "@/components/StatusBadge";

const vehicles = [
    { name: "Fiorino 01", driver: "João Silva", plate: "ABC-1234", model: "Fiat Fiorino", year: "2021", km: "45.200 km", kmNote: "Próxima revisão: 50k", status: "Ativo", icon: "local_shipping", iconBg: "bg-primary/10 text-primary" },
    { name: "Van Executiva", driver: "Maria Oliveira", plate: "JKL-3456", model: "Mercedes Sprinter", year: "2019", km: "89.000 km", kmNote: "Revisão Atrasada", status: "Manutenção", icon: "airport_shuttle", iconBg: "bg-orange-100 text-orange-600" },
    { name: "Gol da Firma", driver: "Sem motorista", plate: "DEF-5678", model: "VW Gol", year: "2022", km: "15.300 km", kmNote: "Uso baixo", status: "Ativo", icon: "directions_car", iconBg: "bg-primary-light/20 text-primary" },
    { name: "Caminhão 03", driver: "Carlos Mendes", plate: "XYZ-9876", model: "VW Delivery", year: "2020", km: "120.500 km", kmNote: "Em rota", status: "Inativo", icon: "local_shipping", iconBg: "bg-indigo-100 text-indigo-600" },
    { name: "Strada 02", driver: "Roberto Dias", plate: "GHI-9012", model: "Fiat Strada", year: "2021", km: "32.000 km", kmNote: "Regular", status: "Ativo", icon: "local_shipping", iconBg: "bg-teal-100 text-teal-600" },
];

export default function VeiculosPage() {
    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Lista de Veículos</h1>
                    <p className="text-text-secondary mt-1">Gerencie a frota da Maxxi Internet.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg shadow-sm text-sm font-bold transition-all active:scale-[0.98]">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Adicionar Veículo
                </button>
            </div>

            {/* Filters */}
            <div className="bg-surface rounded-xl shadow-sm border border-border p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary material-symbols-outlined">search</span>
                        <input
                            className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-background text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                            placeholder="Buscar por placa, modelo ou motorista..."
                            type="text"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select className="block w-full md:w-40 px-3 py-2.5 border border-border rounded-lg bg-surface text-text-primary text-sm focus:outline-none focus:ring-primary focus:border-primary cursor-pointer">
                            <option>Todos Status</option>
                            <option>Ativo</option>
                            <option>Em Manutenção</option>
                            <option>Inativo</option>
                        </select>
                        <button className="p-2.5 border border-border rounded-lg text-text-secondary hover:text-primary hover:bg-background transition-colors" title="Exportar dados">
                            <span className="material-symbols-outlined">download</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-background/50">
                            <tr>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Veículo / Motorista</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Placa</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Modelo</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Ano</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Km Atual</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {vehicles.map((v, i) => (
                                <tr key={i} className="hover:bg-background/50 transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${v.iconBg}`}>
                                                <span className="material-symbols-outlined">{v.icon}</span>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-semibold text-text-primary">{v.name}</div>
                                                <div className="text-xs text-text-secondary">{v.driver}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-background text-text-primary border border-border font-mono">
                                            {v.plate}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-text-secondary">{v.model}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-text-secondary">{v.year}</td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="text-sm text-text-primary font-medium">{v.km}</div>
                                        <div className={`text-xs ${v.kmNote === "Revisão Atrasada" ? "text-orange-500 font-medium" : "text-text-secondary"}`}>{v.kmNote}</div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={v.status} /></td>
                                    <td className="px-5 py-4 whitespace-nowrap text-right">
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
                {/* Pagination */}
                <div className="bg-surface px-5 py-3 flex items-center justify-between border-t border-border">
                    <p className="text-sm text-text-secondary">
                        Mostrando <span className="font-medium text-text-primary">1</span> a <span className="font-medium text-text-primary">5</span> de <span className="font-medium text-text-primary">12</span> resultados
                    </p>
                    <div className="flex gap-1">
                        <button className="px-3 py-1.5 text-sm border border-border rounded-lg bg-primary text-white font-bold">1</button>
                        <button className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-background">2</button>
                        <button className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-background">3</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
