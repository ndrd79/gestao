import StatusBadge from "@/components/StatusBadge";

const users = [
    { name: "Carlos Silva", email: "carlos@maxxi.net.br", role: "Gestor", status: "Ativo", initials: "CS", color: "bg-primary" },
    { name: "Maria Oliveira", email: "maria@maxxi.net.br", role: "Motorista", status: "Ativo", initials: "MO", color: "bg-emerald-500" },
    { name: "João Mendes", email: "joao@maxxi.net.br", role: "Motorista", status: "Ativo", initials: "JM", color: "bg-amber-500" },
    { name: "Ana Costa", email: "ana@maxxi.net.br", role: "Admin", status: "Ativo", initials: "AC", color: "bg-violet-500" },
    { name: "Roberto Dias", email: "roberto@maxxi.net.br", role: "Motorista", status: "Inativo", initials: "RD", color: "bg-slate-400" },
];

export default function UsuariosPage() {
    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Gerenciamento de Usuários</h1>
                    <p className="text-text-secondary mt-1">Gerencie o acesso e permissões da equipe.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg shadow-sm text-sm font-bold transition-all active:scale-[0.98]">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    Novo Usuário
                </button>
            </div>

            {/* Filters */}
            <div className="bg-surface rounded-xl shadow-sm border border-border p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary">search</span>
                        <input
                            className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-background text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Buscar por nome ou email..."
                        />
                    </div>
                    <select className="px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-primary focus:border-primary">
                        <option>Todos os Cargos</option>
                        <option>Admin</option>
                        <option>Gestor</option>
                        <option>Motorista</option>
                    </select>
                    <select className="px-3 py-2.5 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-primary focus:border-primary">
                        <option>Todos Status</option>
                        <option>Ativo</option>
                        <option>Inativo</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 border-b border-border">
                                <th className="px-5 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Usuário</th>
                                <th className="px-5 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</th>
                                <th className="px-5 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Cargo</th>
                                <th className="px-5 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-5 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map((u, i) => (
                                <tr key={i} className="hover:bg-background/50 transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.color}`}>
                                                {u.initials}
                                            </div>
                                            <span className="text-sm font-semibold text-text-primary">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-text-secondary">{u.email}</td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-background text-text-primary border border-border">
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4"><StatusBadge status={u.status} /></td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 text-text-secondary hover:text-primary rounded-lg hover:bg-background transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button className="p-1.5 text-text-secondary hover:text-danger rounded-lg hover:bg-red-50 transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">person_remove</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-surface px-5 py-3 flex items-center justify-between border-t border-border">
                    <p className="text-sm text-text-secondary">
                        Mostrando <span className="font-medium text-text-primary">1</span> a <span className="font-medium text-text-primary">5</span> de <span className="font-medium text-text-primary">5</span> usuários
                    </p>
                </div>
            </div>
        </div>
    );
}
