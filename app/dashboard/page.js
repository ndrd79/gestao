import KPICard from "@/components/KPICard";
import StatusBadge from "@/components/StatusBadge";

export default function DashboardPage() {
    return (
        <div className="max-w-7xl mx-auto">
            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        Bom dia! 👋
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Aqui está o resumo da frota da Maxxi Internet.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-background transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Nova Despesa
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">directions_car</span>
                        Novo Veículo
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <KPICard
                    icon="local_shipping"
                    iconBg="bg-primary/10 text-primary"
                    label="Total de Veículos"
                    value="12"
                    badge={{ text: "Ativos", color: "bg-emerald-100 text-emerald-700" }}
                    subtitle="2 em manutenção"
                />
                <KPICard
                    icon="payments"
                    iconBg="bg-accent/20 text-amber-700"
                    label="Gastos do Mês"
                    value="R$ 4.250"
                    badge={{ text: "+5%", color: "bg-emerald-100 text-emerald-700" }}
                    subtitle="vs. R$ 4.050 mês anterior"
                />
                <KPICard
                    icon="local_gas_station"
                    iconBg="bg-orange-100 text-orange-600"
                    label="Média por Veículo"
                    value="R$ 354"
                    subtitle="Custo operacional médio"
                />
                <KPICard
                    icon="warning"
                    iconBg="bg-red-100 text-red-600"
                    label="Alertas Pendentes"
                    value="3"
                    subtitle="Revisões ou documentos"
                />
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Recent Fueling */}
                <div className="bg-surface rounded-xl border border-border shadow-sm">
                    <div className="p-5 border-b border-border flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-primary">
                            Abastecimentos Recentes
                        </h3>
                        <a
                            href="/combustivel"
                            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                            Ver todos
                        </a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-background/50 border-b border-border">
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Data</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Veículo</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Motorista</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {[
                                    { date: "12/05/2024", vehicle: "Ford Ka", plate: "ABC-1234", driver: "Carlos Silva", value: "R$ 150,00" },
                                    { date: "11/05/2024", vehicle: "Fiat Fiorino", plate: "XYZ-9876", driver: "Ana Souza", value: "R$ 280,00" },
                                    { date: "10/05/2024", vehicle: "VW Gol", plate: "DEF-5678", driver: "Roberto Dias", value: "R$ 145,00" },
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-background/50 transition-colors">
                                        <td className="px-5 py-3 text-sm text-text-secondary whitespace-nowrap">{row.date}</td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded bg-background flex items-center justify-center text-text-secondary">
                                                    <span className="material-symbols-outlined text-lg">directions_car</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-text-primary">{row.vehicle}</div>
                                                    <div className="text-xs text-text-secondary">{row.plate}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-text-secondary whitespace-nowrap">{row.driver}</td>
                                        <td className="px-5 py-3 text-sm font-semibold text-text-primary whitespace-nowrap text-right">{row.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Maintenance */}
                <div className="bg-surface rounded-xl border border-border shadow-sm">
                    <div className="p-5 border-b border-border flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-primary">
                            Manutenções Recentes
                        </h3>
                        <a
                            href="/manutencao"
                            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                            Ver agenda
                        </a>
                    </div>
                    <div className="p-5 space-y-3">
                        {[
                            { icon: "build", iconBg: "bg-primary/10 text-primary", title: "Troca de Óleo - Fiat Fiorino", subtitle: "Agendado para 15/05/2024", status: "Pendente" },
                            { icon: "check_circle", iconBg: "bg-emerald-50 text-emerald-600", title: "Revisão Geral - VW Gol", subtitle: "Concluído em 10/05/2024", status: "Finalizado" },
                            { icon: "priority_high", iconBg: "bg-red-50 text-red-600", title: "Troca de Pneus - Ford Ka", subtitle: "Vencido desde 08/05/2024", status: "Atrasado" },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-background/50 transition-colors group"
                            >
                                <div className={`h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-text-primary truncate">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-text-secondary mt-0.5">
                                        {item.subtitle}
                                    </p>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
