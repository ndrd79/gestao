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

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        role: "motorista",
    });

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

    function openModal() {
        setNewUser({ name: "", email: "", password: "", role: "motorista" });
        setFormError("");
        setFormSuccess("");
        setShowPassword(false);
        setShowModal(true);
    }

    async function handleCreateUser(e) {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");

        // Frontend validations
        if (!newUser.name.trim()) { setFormError("Nome é obrigatório."); return; }
        if (!newUser.email.trim()) { setFormError("Email é obrigatório."); return; }
        if (!newUser.email.includes("@")) { setFormError("Email inválido."); return; }
        if (newUser.password.length < 6) { setFormError("A senha deve ter pelo menos 6 caracteres."); return; }

        setCreating(true);
        try {
            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                setFormError("Sessão expirada. Faça login novamente.");
                return;
            }

            const res = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    name: newUser.name.trim(),
                    email: newUser.email.trim().toLowerCase(),
                    password: newUser.password,
                    role: newUser.role,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setFormError(data.error || "Erro ao criar usuário.");
                return;
            }

            setFormSuccess(`✅ Usuário ${data.user.name} criado com sucesso!`);
            setNewUser({ name: "", email: "", password: "", role: "motorista" });
            fetchUsers();

            // Close modal after 2 seconds
            setTimeout(() => {
                setShowModal(false);
                setFormSuccess("");
            }, 2000);
        } catch (err) {
            console.error("Erro ao criar usuário:", err);
            setFormError("Erro de rede. Verifique sua conexão.");
        } finally {
            setCreating(false);
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
                <div className="flex items-center gap-3">
                    <div className="text-sm text-text-secondary bg-surface px-4 py-2 rounded-lg border border-border">
                        {users.length} usuários cadastrados
                    </div>
                    {isAdmin && (
                        <button
                            onClick={openModal}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            Novo Usuário
                        </button>
                    )}
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

            {/* Error */}
            {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                    <button onClick={fetchUsers} className="ml-auto text-xs font-bold underline">Tentar novamente</button>
                </div>
            )}

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

            {/* Modal: Novo Usuário */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !creating && setShowModal(false)}></div>
                    <div className="relative bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden z-10">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background/50">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person_add</span>
                                <h2 className="text-lg font-bold text-text-primary">Novo Usuário</h2>
                            </div>
                            <button onClick={() => !creating && setShowModal(false)} className="p-1 rounded-lg hover:bg-background text-text-secondary transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                            {formError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">error</span>
                                    {formError}
                                </div>
                            )}
                            {formSuccess && (
                                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                    {formSuccess}
                                </div>
                            )}

                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Nome completo</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary text-[20px]">person</span>
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        placeholder="Ex: João da Silva"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Email</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary text-[20px]">mail</span>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="usuario@maxxi.net.br"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Senha */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Senha</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary text-[20px]">lock</span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-12 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                                <p className="text-xs text-text-secondary mt-1">O usuário poderá alterar a senha depois.</p>
                            </div>

                            {/* Função */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Função</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: "motorista", icon: "directions_car", label: "Motorista" },
                                        { value: "gestor", icon: "manage_accounts", label: "Gestor" },
                                        { value: "admin", icon: "admin_panel_settings", label: "Admin" },
                                    ].map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setNewUser({ ...newUser, role: r.value })}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-medium ${newUser.role === r.value
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-border text-text-secondary hover:border-text-secondary"
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-xl">{r.icon}</span>
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={creating}
                                    className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-background transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60 shadow-sm"
                                >
                                    {creating ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                            Criando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                                            Criar Usuário
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
