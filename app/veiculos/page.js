"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StatusBadge from "@/components/StatusBadge";

export default function VeiculosPage() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("todos");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: "", plate: "", model: "", year: "", km: 0, status: "ativo" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        fetchVehicles();
    }, []);

    async function fetchVehicles() {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchErr } = await supabase
                .from("vehicles")
                .select("*, driver:profiles(name)")
                .order("created_at", { ascending: false });
            if (fetchErr) throw fetchErr;
            setVehicles(data || []);
        } catch (err) {
            console.error("Erro ao carregar veículos:", err);
            setError("Erro ao carregar veículos. Tente recarregar.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setFormError(null);
        setSaving(true);
        const payload = {
            name: form.name,
            plate: form.plate.toUpperCase(),
            model: form.model,
            year: parseInt(form.year) || null,
            km: parseInt(form.km) || 0,
            status: form.status,
        };

        try {
            if (editingId) {
                const { error } = await supabase.from("vehicles").update(payload).eq("id", editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("vehicles").insert(payload);
                if (error) throw error;
            }

            setShowForm(false);
            setEditingId(null);
            setForm({ name: "", plate: "", model: "", year: "", km: 0, status: "ativo" });
            fetchVehicles();
        } catch (err) {
            console.error("Erro ao salvar veículo:", err);
            const msg = err.message?.includes("duplicate") ? "Já existe um veículo com essa placa." : `Erro ao salvar: ${err.message || "Tente novamente."}`;
            setFormError(msg);
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(v) {
        setForm({ name: v.name, plate: v.plate, model: v.model, year: v.year || "", km: v.km, status: v.status });
        setEditingId(v.id);
        setShowForm(true);
    }

    async function handleDelete(id) {
        if (!confirm("ATENÇÃO: Excluir este veículo apagará permanentemente todo o histórico de combustível, manutenções, despesas e agendamentos associados.\n\nDeseja continuar?")) return;
        try {
            const { error } = await supabase.from("vehicles").delete().eq("id", id);
            if (error) throw error;
            fetchVehicles();
        } catch (err) {
            console.error("Erro ao excluir veículo:", err);
            alert(`Erro ao excluir: ${err.message}`);
        }
    }

    const filtered = vehicles.filter((v) => {
        const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.plate.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "todos" || v.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Veículos</h1>
                    <p className="text-text-secondary mt-1">Gerencie a frota da Maxxi Internet.</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", plate: "", model: "", year: "", km: 0, status: "ativo" }); }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg shadow-sm text-sm font-bold transition-all active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Novo Veículo
                </button>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setShowForm(false)}></div>
                    <div className="relative bg-surface rounded-xl shadow-2xl border border-border w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                            <h2 className="text-lg font-bold text-text-primary">
                                {editingId ? "Editar Veículo" : "Novo Veículo"}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-1 text-text-secondary hover:text-text-primary rounded">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-text-primary mb-1">Nome</label>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Fiorino 01" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-1">Placa</label>
                                    <input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} required placeholder="ABC-1D23" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-1">Modelo</label>
                                    <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required placeholder="Fiat Fiorino" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-1">Ano</label>
                                    <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2024" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-1">KM Atual</label>
                                    <input type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-1">Status</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                        <option value="ativo">Ativo</option>
                                        <option value="manutencao">Manutenção</option>
                                        <option value="inativo">Inativo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-background transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60">
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                    {saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary material-symbols-outlined">search</span>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Buscar veículos..." />
                </div>
                <div className="flex gap-2">
                    {["todos", "ativo", "manutencao", "inativo"].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? "bg-primary text-white" : "bg-surface border border-border text-text-secondary hover:bg-background"}`}>
                            {s === "todos" ? "Todos" : s === "manutencao" ? "Manutenção" : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-text-secondary">
                        <span className="material-symbols-outlined text-4xl animate-pulse">sync</span>
                        <p className="mt-2 text-sm">Carregando veículos...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-text-secondary">
                        <span className="material-symbols-outlined text-4xl">directions_car</span>
                        <p className="mt-2 text-sm">{vehicles.length === 0 ? "Nenhum veículo cadastrado. Clique em 'Novo Veículo' para começar." : "Nenhum resultado encontrado."}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 border-b border-border">
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Veículo</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Placa</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Modelo</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">KM</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map((v) => (
                                    <tr key={v.id} className="hover:bg-background/50 transition-colors group">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                                    <span className="material-symbols-outlined text-lg">directions_car</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-text-primary">{v.name}</div>
                                                    {v.year && <div className="text-xs text-text-secondary">{v.year}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-sm font-mono text-text-primary">{v.plate}</td>
                                        <td className="px-5 py-3 text-sm text-text-secondary">{v.model}</td>
                                        <td className="px-5 py-3 text-sm text-text-primary font-medium text-right">{v.km?.toLocaleString("pt-BR")} km</td>
                                        <td className="px-5 py-3"><StatusBadge status={v.status === "manutencao" ? "Manutenção" : v.status.charAt(0).toUpperCase() + v.status.slice(1)} /></td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(v)} className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(v.id)} className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors">
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
