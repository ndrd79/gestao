"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function AgendaPage() {
    const [events, setEvents] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [form, setForm] = useState({ vehicle_id: "", driver_id: "", start_date: "", end_date: "", purpose: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        const [eRes, vRes, pRes] = await Promise.all([
            supabase.from("schedule").select("*, vehicle:vehicles(name, plate), driver:profiles(name)").order("start_date"),
            supabase.from("vehicles").select("id, name, plate").order("name"),
            supabase.from("profiles").select("id, name").order("name"),
        ]);
        setEvents(eRes.data || []);
        setVehicles(vRes.data || []);
        setProfiles(pRes.data || []);
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        await supabase.from("schedule").insert({
            vehicle_id: form.vehicle_id,
            driver_id: form.driver_id || null,
            start_date: form.start_date,
            end_date: form.end_date,
            purpose: form.purpose,
            status: "pendente",
        });
        setForm({ vehicle_id: "", driver_id: "", start_date: "", end_date: "", purpose: "" });
        setSaving(false);
        setShowForm(false);
        fetchData();
    }

    async function handleStatusChange(id, newStatus) {
        await supabase.from("schedule").update({ status: newStatus }).eq("id", id);
        fetchData();
    }

    async function handleDelete(id) {
        if (!confirm("Excluir este agendamento?")) return;
        await supabase.from("schedule").delete().eq("id", id);
        fetchData();
    }

    // Calendar helpers
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    function getEventsForDay(day) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return events.filter((e) => {
            const start = e.start_date?.slice(0, 10);
            const end = e.end_date?.slice(0, 10);
            return start <= dateStr && dateStr <= end;
        });
    }

    const statusColor = { pendente: "bg-amber-400", confirmado: "bg-emerald-400", cancelado: "bg-red-400" };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Agenda</h1>
                    <p className="text-text-secondary mt-1">Agende o uso dos veículos da frota.</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg shadow-sm text-sm font-bold transition-all active:scale-[0.98]">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Novo Agendamento
                </button>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setShowForm(false)}></div>
                    <div className="relative bg-surface rounded-xl shadow-2xl border border-border w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                            <h2 className="text-lg font-bold text-text-primary">Novo Agendamento</h2>
                            <button onClick={() => setShowForm(false)} className="p-1 text-text-secondary hover:text-text-primary"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1">Veículo</label>
                                <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option value="">Selecionar</option>
                                    {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.name} - {v.plate}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1">Motorista</label>
                                <select value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option value="">Selecionar (opcional)</option>
                                    {profiles.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-1">Início</label>
                                    <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-1">Fim</label>
                                    <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1">Finalidade</label>
                                <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Ex: Visita técnica ao cliente" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-background">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60">
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                    {saving ? "Salvando..." : "Agendar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Calendar */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-background rounded-lg"><span className="material-symbols-outlined">chevron_left</span></button>
                    <h2 className="text-lg font-bold text-text-primary">{MONTHS[month]} {year}</h2>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-background rounded-lg"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
                <div className="grid grid-cols-7">
                    {DAYS.map((d) => (<div key={d} className="px-2 py-3 text-center text-xs font-bold text-text-secondary bg-background/50 border-b border-border">{d}</div>))}
                    {Array.from({ length: firstDay }).map((_, i) => (<div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border bg-background/30"></div>))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayEvents = getEventsForDay(day);
                        const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                        return (
                            <div key={day} className={`min-h-[80px] border-b border-r border-border p-1 ${isToday ? "bg-primary/5" : "hover:bg-background/50"} transition-colors`}>
                                <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${isToday ? "bg-primary text-white" : "text-text-secondary"}`}>
                                    {day}
                                </span>
                                <div className="mt-1 space-y-0.5">
                                    {dayEvents.slice(0, 2).map((e) => (
                                        <div key={e.id} className={`text-[10px] px-1 py-0.5 rounded ${statusColor[e.status] || "bg-slate-300"} text-white truncate`}>
                                            {e.vehicle?.name}
                                        </div>
                                    ))}
                                    {dayEvents.length > 2 && <div className="text-[10px] text-text-secondary text-center">+{dayEvents.length - 2}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event List */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">event_note</span>
                    <h2 className="text-lg font-bold text-text-primary">Agendamentos</h2>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-text-secondary"><span className="material-symbols-outlined text-4xl animate-pulse">sync</span></div>
                ) : events.length === 0 ? (
                    <div className="p-12 text-center text-text-secondary"><span className="material-symbols-outlined text-4xl">calendar_month</span><p className="mt-2 text-sm">Nenhum agendamento.</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead><tr className="bg-background/50 border-b border-border">
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Veículo</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Motorista</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Período</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Finalidade</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                                <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Ações</th>
                            </tr></thead>
                            <tbody className="divide-y divide-border">
                                {events.map((e) => (
                                    <tr key={e.id} className="hover:bg-background/50 transition-colors group">
                                        <td className="px-5 py-3">
                                            <div className="text-sm font-medium text-text-primary">{e.vehicle?.name}</div>
                                            <div className="text-xs text-text-secondary">{e.vehicle?.plate}</div>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-text-secondary">{e.driver?.name || "—"}</td>
                                        <td className="px-5 py-3 text-sm text-text-secondary">
                                            {new Date(e.start_date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                            {" → "}
                                            {new Date(e.end_date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-text-secondary">{e.purpose || "—"}</td>
                                        <td className="px-5 py-3">
                                            <select value={e.status} onChange={(ev) => handleStatusChange(e.id, ev.target.value)} className="text-xs px-2 py-1 border border-border rounded-md bg-surface focus:outline-none">
                                                <option value="pendente">Pendente</option>
                                                <option value="confirmado">Confirmado</option>
                                                <option value="cancelado">Cancelado</option>
                                            </select>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button onClick={() => handleDelete(e.id)} className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100">
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

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400"></span> Pendente</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400"></span> Confirmado</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400"></span> Cancelado</span>
            </div>
        </div>
    );
}
