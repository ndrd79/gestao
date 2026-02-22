"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";

export default function UsuariosPage() {
    const { profile: me } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("todos");
    const [error, setError] = useState(null);

    const isAdmin = me?.role === "admin";

    useEffect(() => { fetchUsers(); }, []);

    async function fetchUsers() {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchErr } = await supabase.from("profiles").select("*").order("name");
            if (fetchErr) throw fetchErr;
            setUsers(data || []);
        } catch (err) {
            console.error("Erro ao carregar usuários:", err);
            setError("Erro ao carregar usuários.");
        } finally {
            setLoading(false);
        }
    }

    async function handleRoleChange(id, newRole) {
        if (!isAdmin) { alert("Apenas administradores podem alterar funções."); return; }
        try {
            const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", id);
            if (error) throw error;
            fetchUsers();
        } catch (err) {
            console.error("Erro ao alterar função:", err);
            alert(`Erro: ${err.message}`);
        }
    }

    async function handleStatusToggle(id, currentStatus) {
        if (!isAdmin) { alert("Apenas administradores podem alterar status."); return; }
        const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
        try {
            const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", id);
            if (error) throw error;
            fetchUsers();
        } catch (err) {
            console.error("Erro ao alterar status:", err);
            alert(`Erro: ${err.message}`);
        }
    }

    const filtered = users.filter((u) => {
        const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "todos" || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Usuários</h1>
                    <p className="text-text-secondary mt-1">Gerencie a equipe do sistema.</p>
                </div>
                <div className="text-sm text-text-secondary bg-surface px-4 py-2 rounded-lg border border-border">
                    {users.length} usuários cadastrados
                </div>
            </div>

            {/* Admin-only notice */}
            {!isAdmin && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">info</span>
                    Apenas administradores podem alterar funções e status de usuários.
                </div>
            )}

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary material-symbols-outlined">search</span>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Buscar usuários..." />
                </div>
                <div className="flex gap-2">
                    {["todos", "admin", "gestor", "motorista"].map((r) => (
                        <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === r ? "bg-primary text-white" : "bg-surface border border-border text-text-secondary hover:bg-background"}`}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-text-secondary">
                        <span className="material-symbols-outlined text-4xl animate-pulse">sync</span>
                        <p className="mt-2 text-sm">Carregando...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-text-secondary">
                        <span className="material-symbols-outlined text-4xl">group</span>
                        <p className="mt-2 text-sm">Nenhum usuário encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 border-b border-border">
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Usuário</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Email</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Função</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map((u) => {
                                    const initials = u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
                                    const isMe = me?.id === u.id;
                                    return (
                                        <tr key={u.id} className="hover:bg-background/50 transition-colors group">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-text-primary">
                                                            {u.name} {isMe && <span className="text-xs text-primary-light">(você)</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-text-secondary">{u.email}</td>
                                            <td className="px-5 py-3">
                                                <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} disabled={isMe || !isAdmin} className="text-xs px-2 py-1 border border-border rounded-md bg-surface focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                                                    <option value="admin">Admin</option>
                                                    <option value="gestor">Gestor</option>
                                                    <option value="motorista">Motorista</option>
                                                </select>
                                            </td>
                                            <td className="px-5 py-3">
                                                <StatusBadge status={u.status === "ativo" ? "Ativo" : "Inativo"} />
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {!isMe && isAdmin && (
                                                    <button
                                                        onClick={() => handleStatusToggle(u.id, u.status)}
                                                        className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${u.status === "ativo" ? "text-red-600 hover:bg-red-50 border border-red-200" : "text-emerald-600 hover:bg-emerald-50 border border-emerald-200"}`}
                                                    >
                                                        {u.status === "ativo" ? "Desativar" : "Ativar"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div >
    );
}
