"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DespesasPage() {
    const [expenses, setExpenses] = useState([]);
    const [expenseTypes, setExpenseTypes] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formError, setFormError] = useState(null);
    const [search, setSearch] = useState("");
    const [showTypeManager, setShowTypeManager] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [editingTypeName, setEditingTypeName] = useState("");
    const [form, setForm] = useState({
        vehicle_id: "",
        expense_type_id: "",
        date: "",
        amount: "",
        description: "",
        status: "pago",
    });

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const [eRes, tRes, vRes] = await Promise.all([
                supabase.from("expenses").select("*, vehicle:vehicles(name, plate), expense_type:expense_types(name)").order("date", { ascending: false }),
                supabase.from("expense_types").select("*").order("name"),
                supabase.from("vehicles").select("id, name, plate").order("name"),
            ]);
            if (eRes.error) throw eRes.error;
            if (tRes.error) throw tRes.error;
            if (vRes.error) throw vRes.error;
            setExpenses(eRes.data || []);
            setExpenseTypes(tRes.data || []);
            setVehicles(vRes.data || []);
        } catch (err) {
            console.error("Erro ao carregar despesas:", err);
            setError("Erro ao carregar dados. Tente recarregar.");
        } finally {
            setLoading(false);
        }
    }

    // ─── Expense CRUD ───
    async function handleSubmit(e) {
        e.preventDefault();
        setFormError(null);
        setSaving(true);
        try {
            const { error: insertErr } = await supabase.from("expenses").insert({
                vehicle_id: form.vehicle_id || null,
                expense_type_id: form.expense_type_id,
                date: form.date,
                amount: parseFloat(form.amount) || 0,
                description: form.description,
                status: form.status,
            });
            if (insertErr) throw insertErr;
            setForm({ vehicle_id: "", expense_type_id: "", date: "", amount: "", description: "", status: "pago" });
            fetchData();
        } catch (err) {
            console.error("Erro ao salvar despesa:", err);
            setFormError(`Erro ao salvar: ${err.message || "Tente novamente."}`);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Excluir esta despesa?")) return;
        try {
            const { error } = await supabase.from("expenses").delete().eq("id", id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error("Erro ao excluir despesa:", err);
            alert(`Erro ao excluir: ${err.message}`);
        }
    }

    async function handleStatusChange(id, newStatus) {
        try {
            const { error } = await supabase.from("expenses").update({ status: newStatus }).eq("id", id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            alert(`Erro ao atualizar status: ${err.message}`);
        }
    }

    // ─── Expense Type CRUD ───
    async function handleAddType(e) {
        e.preventDefault();
        if (!newTypeName.trim()) return;
        try {
            const { error } = await supabase.from("expense_types").insert({ name: newTypeName.trim() });
            if (error) throw error;
            setNewTypeName("");
            fetchData();
        } catch (err) {
            console.error("Erro ao adicionar tipo:", err);
            alert(`Erro: ${err.message?.includes("duplicate") ? "Este tipo já existe." : err.message}`);
        }
    }

    async function handleUpdateType(id) {
        if (!editingTypeName.trim()) return;
        try {
            const { error } = await supabase.from("expense_types").update({ name: editingTypeName.trim() }).eq("id", id);
            if (error) throw error;
            setEditingTypeId(null);
            setEditingTypeName("");
            fetchData();
        } catch (err) {
            console.error("Erro ao atualizar tipo:", err);
            alert(`Erro: ${err.message}`);
        }
    }

    async function handleDeleteType(id) {
        if (!confirm("Excluir este tipo de despesa? As despesas com este tipo ficarão sem categoria.")) return;
        try {
            const { error } = await supabase.from("expense_types").delete().eq("id", id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error("Erro ao excluir tipo:", err);
            alert(`Erro: ${err.message}`);
        }
    }

    // ─── Cálculos ───
    const totalAmount = expenses.reduce((s, r) => s + Number(r.amount), 0);
    const paid = expenses.filter((r) => r.status === "pago").length;
    const pending = expenses.filter((r) => r.status === "pendente").length;
    const overdue = expenses.filter((r) => r.status === "vencido").length;

    const filtered = expenses.filter((r) => {
        const vName = r.vehicle?.name?.toLowerCase() || "";
        const tName = r.expense_type?.name?.toLowerCase() || "";
        const desc = r.description?.toLowerCase() || "";
        const q = search.toLowerCase();
        return vName.includes(q) || tName.includes(q) || desc.includes(q);
    });

    const statusColor = (s) =>
        s === "pago" ? "text-emerald-600 bg-emerald-50" :
            s === "pendente" ? "text-amber-600 bg-amber-50" :
                "text-red-600 bg-red-50";

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Despesas</h1>
                    <p className="text-text-secondary mt-1">Controle financeiro de despesas da frota.</p>
                </div>
                <button
                    onClick={() => setShowTypeManager(!showTypeManager)}
                    className="flex items-center gap-2 bg-surface border border-border hover:bg-background px-4 py-2.5 rounded-lg text-sm font-bold text-text-primary transition-all"
                >
                    <span className="material-symbols-outlined text-[20px]">category</span>
                    Tipos de Despesa
                </button>
            </div>

            {/* Gerenciador de Tipos */}
            {showTypeManager && (
                <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-background/50">
                        <span className="material-symbols-outlined text-primary">category</span>
                        <h2 className="text-lg font-bold text-text-primary">Tipos de Despesa</h2>
                    </div>
                    <div className="p-6">
                        {/* Adicionar novo tipo */}
                        <form onSubmit={handleAddType} className="flex gap-3 mb-5">
                            <input
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                placeholder="Nome do novo tipo..."
                                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            />
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Adicionar
                            </button>
                        </form>

                        {/* Lista de tipos */}
                        <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-background/50 border-b border-border">
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase w-12">#</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Nome</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right w-28">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {expenseTypes.map((t, i) => (
                                        <tr key={t.id} className="hover:bg-background/50 transition-colors group">
                                            <td className="px-5 py-3 text-sm text-text-secondary">{i + 1}</td>
                                            <td className="px-5 py-3">
                                                {editingTypeId === t.id ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={editingTypeName}
                                                            onChange={(e) => setEditingTypeName(e.target.value)}
                                                            onKeyDown={(e) => e.key === "Enter" && handleUpdateType(t.id)}
                                                            autoFocus
                                                            className="flex-1 px-3 py-1.5 border border-primary rounded-md text-sm focus:outline-none bg-background"
                                                        />
                                                        <button onClick={() => handleUpdateType(t.id)} className="p-1.5 text-success hover:bg-emerald-50 rounded-md">
                                                            <span className="material-symbols-outlined text-lg">check</span>
                                                        </button>
                                                        <button onClick={() => { setEditingTypeId(null); setEditingTypeName(""); }} className="p-1.5 text-text-secondary hover:bg-background rounded-md">
                                                            <span className="material-symbols-outlined text-lg">close</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-medium text-text-primary">{t.name}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {editingTypeId !== t.id && (
                                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => { setEditingTypeId(t.id); setEditingTypeName(t.name); }}
                                                            className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteType(t.id)}
                                                            className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {expenseTypes.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-5 py-8 text-center text-text-secondary text-sm">
                                                Nenhum tipo cadastrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-text-secondary">Total</p>
                    <h4 className="text-2xl font-bold text-text-primary mt-1">
                        R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </h4>
                </div>
                <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-text-secondary">Pagas</p>
                    <h4 className="text-2xl font-bold text-emerald-600 mt-1">{paid}</h4>
                </div>
                <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-text-secondary">Pendentes</p>
                    <h4 className="text-2xl font-bold text-amber-600 mt-1">{pending}</h4>
                </div>
                <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-text-secondary">Vencidas</p>
                    <h4 className="text-2xl font-bold text-red-600 mt-1">{overdue}</h4>
                </div>
            </div>

            {/* Formulário Nova Despesa */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-background/50">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    <h2 className="text-lg font-bold text-text-primary">Nova Despesa</h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Tipo de Despesa</label>
                            <select
                                value={form.expense_type_id}
                                onChange={(e) => setForm({ ...form, expense_type_id: e.target.value })}
                                required
                                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            >
                                <option value="">Selecionar tipo</option>
                                {expenseTypes.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Veículo (opcional)</label>
                            <select
                                value={form.vehicle_id}
                                onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            >
                                <option value="">Geral (sem veículo)</option>
                                {vehicles.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name} - {v.plate}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Data</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                required
                                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                required
                                placeholder="0,00"
                                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Status</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            >
                                <option value="pago">Pago</option>
                                <option value="pendente">Pendente</option>
                                <option value="vencido">Vencido</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Descrição</label>
                            <input
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Detalhes da despesa..."
                                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            />
                        </div>
                        <div className="lg:col-span-3 flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60"
                            >
                                <span className="material-symbols-outlined text-[20px]">save</span>
                                {saving ? "Salvando..." : "Registrar Despesa"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tabela de Despesas */}
            <div>
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-text-primary">Histórico de Despesas</h2>
                    <div className="relative w-full sm:max-w-sm">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary material-symbols-outlined">search</span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Buscar..."
                        />
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
                            <span className="material-symbols-outlined text-4xl">receipt_long</span>
                            <p className="mt-2 text-sm">Nenhuma despesa registrada.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-background/50 border-b border-border">
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Data</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Tipo</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Veículo</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Descrição</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Valor</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filtered.map((r) => (
                                        <tr key={r.id} className="hover:bg-background/50 transition-colors group">
                                            <td className="px-5 py-3 text-sm text-text-secondary">
                                                {new Date(r.date).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary">
                                                    <span className="material-symbols-outlined text-[16px] text-primary">receipt</span>
                                                    {r.expense_type?.name || "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {r.vehicle ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-text-primary">{r.vehicle.name}</div>
                                                        <div className="text-xs text-text-secondary">{r.vehicle.plate}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-text-secondary">Geral</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-text-secondary max-w-[200px] truncate">
                                                {r.description || "—"}
                                            </td>
                                            <td className="px-5 py-3 text-sm font-semibold text-text-primary text-right">
                                                R$ {Number(r.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-3">
                                                <select
                                                    value={r.status}
                                                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                                                    className={`text-xs px-2 py-1 border border-border rounded-md focus:outline-none font-semibold ${statusColor(r.status)}`}
                                                >
                                                    <option value="pago">Pago</option>
                                                    <option value="pendente">Pendente</option>
                                                    <option value="vencido">Vencido</option>
                                                </select>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(r.id)}
                                                    className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </td>
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
