"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StatusBadge from "@/components/StatusBadge";

const SERVICE_TYPES = [
    "Troca de óleo",
    "Troca de filtro de ar",
    "Troca de filtro de óleo",
    "Troca de filtro de combustível",
    "Troca de pastilhas de freio",
    "Troca de discos de freio",
    "Troca de pneus",
    "Alinhamento e balanceamento",
    "Rodízio de pneus",
    "Troca de bateria",
    "Revisão elétrica",
    "Troca de correia dentada",
    "Troca de correia do alternador",
    "Troca de velas de ignição",
    "Revisão de suspensão",
    "Troca de amortecedores",
    "Troca de fluido de freio",
    "Troca de fluido de arrefecimento",
    "Troca de óleo da transmissão",
    "Revisão de ar-condicionado",
    "Funilaria e pintura",
    "Revisão geral",
    "Outro",
];

export default function ManutencaoPage() {
    const [records, setRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formError, setFormError] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedService, setSelectedService] = useState("");
    const [customService, setCustomService] = useState("");
    const [form, setForm] = useState({
        vehicle_id: "", service_type: "", date: "", cost: "", description: "", status: "pendente",
    });

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const [mRes, vRes] = await Promise.all([
                supabase.from("maintenance").select("*, vehicle:vehicles(name, plate)").order("date", { ascending: false }),
                supabase.from("vehicles").select("id, name, plate").order("name"),
            ]);
            if (mRes.error) throw mRes.error;
            if (vRes.error) throw vRes.error;
            setRecords(mRes.data || []);
            setVehicles(vRes.data || []);
        } catch (err) {
            console.error("Erro ao carregar manutenções:", err);
            setError("Erro ao carregar dados. Tente recarregar.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setFormError(null);
        setSaving(true);
        const serviceType = selectedService === "Outro" ? customService : selectedService;
        try {
            const { error: insertErr } = await supabase.from("maintenance").insert({
                vehicle_id: form.vehicle_id,
                service_type: serviceType,
                date: form.date,
                cost: parseFloat(form.cost) || 0,
                description: form.description,
                status: form.status,
            });
            if (insertErr) throw insertErr;
            setForm({ vehicle_id: "", service_type: "", date: "", cost: "", description: "", status: "pendente" });
            setSelectedService("");
            setCustomService("");
            fetchData();
        } catch (err) {
            console.error("Erro ao salvar manutenção:", err);
            setFormError(`Erro ao salvar: ${err.message || "Tente novamente."}`);
        } finally {
            setSaving(false);
        }
    }

    async function handleStatusChange(id, newStatus) {
        try {
            const { error } = await supabase.from("maintenance").update({ status: newStatus }).eq("id", id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            alert(`Erro ao atualizar status: ${err.message}`);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Excluir esta manutenção?")) return;
        try {
            const { error } = await supabase.from("maintenance").delete().eq("id", id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error("Erro ao excluir manutenção:", err);
            alert(`Erro ao excluir: ${err.message}`);
        }
    }

    const totalCost = records.reduce((s, r) => s + Number(r.cost), 0);
    const pending = records.filter((r) => r.status === "pendente").length;
    const done = records.filter((r) => r.status === "concluido").length;

    const filtered = records.filter((r) => {
        const vName = r.vehicle?.name?.toLowerCase() || "";
        const sType = r.service_type?.toLowerCase() || "";
        return vName.includes(search.toLowerCase()) || sType.includes(search.toLowerCase());
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Manutenção</h1>
                <p className="text-text-secondary mt-1">Controle de serviços e manutenções da frota.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-text-secondary">Total Gasto</p>
                    <h4 className="text-2xl font-bold text-text-primary mt-1">R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h4>
                </div>
                <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-text-secondary">Pendentes</p>
                    <h4 className="text-2xl font-bold text-amber-600 mt-1">{pending}</h4>
                </div>
                <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                    <p className="text-sm text-text-secondary">Concluídas</p>
                    <h4 className="text-2xl font-bold text-emerald-600 mt-1">{done}</h4>
                </div>
            </div>

            {/* Formulário */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-background/50">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    <h2 className="text-lg font-bold text-text-primary">Nova Manutenção</h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Veículo</label>
                            <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="">Selecionar</option>
                                {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.name} - {v.plate}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Tipo de Serviço</label>
                            <select
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            >
                                <option value="">Selecionar serviço</option>
                                {SERVICE_TYPES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        {selectedService === "Outro" && (
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Especificar Serviço</label>
                                <input
                                    value={customService}
                                    onChange={(e) => setCustomService(e.target.value)}
                                    required
                                    placeholder="Descreva o serviço..."
                                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Data</label>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Custo (R$)</label>
                            <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0,00" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Descrição</label>
                            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes do serviço..." className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="lg:col-span-3 flex justify-end pt-2">
                            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60">
                                <span className="material-symbols-outlined text-[20px]">save</span>
                                {saving ? "Salvando..." : "Registrar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tabela */}
            <div>
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-text-primary">Histórico de Manutenções</h2>
                    <div className="relative w-full sm:max-w-sm">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary material-symbols-outlined">search</span>
                        <input value={search} onChange={(e) => setSearch(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Buscar..." />
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
                            <span className="material-symbols-outlined text-4xl">build</span>
                            <p className="mt-2 text-sm">Nenhuma manutenção registrada.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-background/50 border-b border-border">
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Data</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Veículo</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Serviço</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Custo</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filtered.map((r) => (
                                        <tr key={r.id} className="hover:bg-background/50 transition-colors group">
                                            <td className="px-5 py-3 text-sm text-text-secondary">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                                            <td className="px-5 py-3">
                                                <div className="text-sm font-medium text-text-primary">{r.vehicle?.name}</div>
                                                <div className="text-xs text-text-secondary">{r.vehicle?.plate}</div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-sm text-text-primary">{r.service_type}</div>
                                                {r.description && <div className="text-xs text-text-secondary mt-0.5">{r.description}</div>}
                                            </td>
                                            <td className="px-5 py-3 text-sm font-semibold text-right">R$ {Number(r.cost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                            <td className="px-5 py-3">
                                                <select value={r.status} onChange={(e) => handleStatusChange(r.id, e.target.value)} className="text-xs px-2 py-1 border border-border rounded-md bg-surface focus:outline-none">
                                                    <option value="pendente">Pendente</option>
                                                    <option value="concluido">Concluído</option>
                                                    <option value="atrasado">Atrasado</option>
                                                </select>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleDelete(r.id)} className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100">
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
