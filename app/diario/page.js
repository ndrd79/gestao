"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";

export default function DiarioBordoPage() {
    const { user, profile } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
    const [clockTime, setClockTime] = useState(new Date());

    // Form state for new trip
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        vehicle_id: "",
        km_start: "",
        destination: "",
        notes: "",
    });

    // End-trip form
    const [endingTrip, setEndingTrip] = useState(null);
    const [endForm, setEndForm] = useState({ km_end: "", notes: "" });

    const isAdminOrGestor = profile?.role === "admin" || profile?.role === "gestor";

    // Real-time clock
    useEffect(() => {
        const timer = setInterval(() => setClockTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchData();
    }, [filterDate]);

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const [vRes, tRes] = await Promise.all([
                supabase.from("vehicles").select("id, name, plate, km, status").order("name"),
                supabase
                    .from("trip_logs")
                    .select("*, vehicle:vehicles(name, plate), driver:profiles(name)")
                    .gte("date", filterDate)
                    .lte("date", filterDate)
                    .order("time_start", { ascending: false }),
            ]);
            if (vRes.error) throw vRes.error;
            if (tRes.error) throw tRes.error;
            setVehicles(vRes.data || []);
            setTrips(tRes.data || []);
        } catch (err) {
            console.error("Erro:", err);
            setError("Erro ao carregar dados: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    // Active trips (any date)
    const [activeTrips, setActiveTrips] = useState([]);
    useEffect(() => {
        async function fetchActive() {
            const { data } = await supabase
                .from("trip_logs")
                .select("*, vehicle:vehicles(name, plate), driver:profiles(name)")
                .eq("status", "em_andamento")
                .order("date", { ascending: false });
            setActiveTrips(data || []);
        }
        fetchActive();
    }, [trips]);

    // My active trip
    const myActiveTrip = useMemo(() => {
        return activeTrips.find((t) => t.driver_id === user?.id);
    }, [activeTrips, user]);

    // Vehicle currently in use
    const vehiclesInUse = useMemo(() => {
        return new Set(activeTrips.map((t) => t.vehicle_id));
    }, [activeTrips]);

    // Available vehicles for new trip
    const availableVehicles = useMemo(() => {
        return vehicles.filter((v) => !vehiclesInUse.has(v.id));
    }, [vehicles, vehiclesInUse]);

    const selectedVehicle = useMemo(() => {
        return vehicles.find((v) => v.id === form.vehicle_id);
    }, [form.vehicle_id, vehicles]);

    function openNewTrip() {
        if (myActiveTrip) {
            setFormError("Você já tem uma viagem em andamento. Finalize-a antes de iniciar outra.");
            return;
        }
        setForm({ vehicle_id: "", km_start: "", destination: "", notes: "" });
        setFormError("");
        setShowForm(true);
    }

    async function handleStartTrip(e) {
        e.preventDefault();
        setFormError("");

        if (!form.vehicle_id) { setFormError("Selecione um veículo."); return; }

        const kmStart = parseInt(form.km_start);
        if (!kmStart || kmStart <= 0) { setFormError("KM inicial deve ser maior que zero."); return; }

        if (selectedVehicle && kmStart < (selectedVehicle.km || 0)) {
            setFormError(`KM inicial (${kmStart.toLocaleString("pt-BR")}) não pode ser menor que o KM atual do veículo (${(selectedVehicle.km || 0).toLocaleString("pt-BR")}).`);
            return;
        }

        if (!form.destination?.trim()) { setFormError("Informe o destino."); return; }

        setSaving(true);
        try {
            const now = new Date();
            const timeStr = now.toTimeString().split(" ")[0]; // HH:MM:SS

            const { error: insertErr } = await supabase.from("trip_logs").insert({
                vehicle_id: form.vehicle_id,
                driver_id: user.id,
                date: now.toISOString().split("T")[0],
                km_start: kmStart,
                time_start: timeStr,
                destination: form.destination.trim(),
                notes: form.notes?.trim() || null,
                status: "em_andamento",
            });

            if (insertErr) throw insertErr;

            // Update vehicle km
            await supabase.from("vehicles").update({ km: kmStart }).eq("id", form.vehicle_id);

            setShowForm(false);
            fetchData();
        } catch (err) {
            console.error("Erro ao iniciar viagem:", err);
            setFormError("Erro: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    function openEndTrip(trip) {
        setEndingTrip(trip);
        setEndForm({ km_end: "", notes: trip.notes || "" });
        setFormError("");
    }

    async function handleEndTrip(e) {
        e.preventDefault();
        setFormError("");

        const kmEnd = parseInt(endForm.km_end);
        if (!kmEnd || kmEnd <= 0) { setFormError("KM final deve ser maior que zero."); return; }
        if (kmEnd < endingTrip.km_start) {
            setFormError(`KM final (${kmEnd.toLocaleString("pt-BR")}) não pode ser menor que o KM inicial (${endingTrip.km_start.toLocaleString("pt-BR")}).`);
            return;
        }

        setSaving(true);
        try {
            const now = new Date();
            const timeStr = now.toTimeString().split(" ")[0];

            const { error: updateErr } = await supabase
                .from("trip_logs")
                .update({
                    km_end: kmEnd,
                    time_end: timeStr,
                    notes: endForm.notes?.trim() || null,
                    status: "finalizado",
                })
                .eq("id", endingTrip.id);

            if (updateErr) throw updateErr;

            // Update vehicle km
            await supabase.from("vehicles").update({ km: kmEnd }).eq("id", endingTrip.vehicle_id);

            setEndingTrip(null);
            fetchData();
        } catch (err) {
            console.error("Erro ao finalizar viagem:", err);
            setFormError("Erro: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    function formatTime(t) {
        if (!t) return "—";
        return t.slice(0, 5); // HH:MM
    }

    function calcDuration(start, end) {
        if (!start || !end) return null;
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        const diffMin = (eh * 60 + em) - (sh * 60 + sm);
        if (diffMin < 0) return null;
        const h = Math.floor(diffMin / 60);
        const m = diffMin % 60;
        return h > 0 ? `${h}h${m > 0 ? m + "min" : ""}` : `${m}min`;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Diário de Bordo</h1>
                    <p className="text-text-secondary mt-1">Registre saídas e retornos de veículos.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Real-time clock */}
                    <div className="flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-lg">
                        <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                        <span className="text-sm font-mono font-bold text-text-primary">
                            {clockTime.toLocaleTimeString("pt-BR")}
                        </span>
                    </div>
                    <button
                        onClick={openNewTrip}
                        disabled={!!myActiveTrip}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        Iniciar Viagem
                    </button>
                </div>
            </div>

            {/* Active Trip Banner */}
            {myActiveTrip && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl animate-pulse">directions_car</span>
                            </div>
                            <div>
                                <p className="text-sm text-white/80">Viagem em andamento</p>
                                <p className="text-lg font-bold">{myActiveTrip.vehicle?.name} — {myActiveTrip.vehicle?.plate}</p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-white/90">
                                    <span>📍 {myActiveTrip.destination}</span>
                                    <span>🕐 Saída: {formatTime(myActiveTrip.time_start)}</span>
                                    <span>📏 KM Inicial: {myActiveTrip.km_start?.toLocaleString("pt-BR")}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => openEndTrip(myActiveTrip)}
                            className="flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-white/90 transition-all shadow-md"
                        >
                            <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                            Finalizar Viagem
                        </button>
                    </div>
                </div>
            )}

            {/* Other active trips (admin/gestor) */}
            {isAdminOrGestor && activeTrips.filter((t) => t.driver_id !== user?.id).length > 0 && (
                <div className="bg-surface rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border bg-background/50 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">visibility</span>
                        <h2 className="text-sm font-bold text-text-primary">Viagens Ativas da Equipe</h2>
                        <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            {activeTrips.filter((t) => t.driver_id !== user?.id).length} ativas
                        </span>
                    </div>
                    <div className="divide-y divide-border">
                        {activeTrips.filter((t) => t.driver_id !== user?.id).map((t) => (
                            <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">
                                            {t.driver?.name || "Motorista"} → {t.destination}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            {t.vehicle?.name} ({t.vehicle?.plate}) • Saída: {formatTime(t.time_start)} • KM: {t.km_start?.toLocaleString("pt-BR")}
                                        </p>
                                    </div>
                                </div>
                                {isAdminOrGestor && (
                                    <button
                                        onClick={() => openEndTrip(t)}
                                        className="text-xs px-3 py-1.5 rounded-md text-amber-600 border border-amber-200 hover:bg-amber-50 font-medium transition-colors"
                                    >
                                        Encerrar
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-text-secondary text-lg">calendar_today</span>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-transparent text-sm text-text-primary focus:outline-none"
                    />
                </div>
                <button
                    onClick={() => setFilterDate(new Date().toISOString().split("T")[0])}
                    className="text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
                >
                    Hoje
                </button>
                <div className="ml-auto text-sm text-text-secondary">
                    {trips.length} registro{trips.length !== 1 ? "s" : ""}
                </div>
            </div>

            {/* Trips Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-text-secondary">
                        <span className="material-symbols-outlined text-4xl animate-pulse">sync</span>
                        <p className="mt-2 text-sm">Carregando...</p>
                    </div>
                ) : trips.length === 0 ? (
                    <div className="p-12 text-center text-text-secondary">
                        <span className="material-symbols-outlined text-4xl">route</span>
                        <p className="mt-2 text-sm font-medium">Nenhuma viagem registrada neste dia.</p>
                        <p className="text-xs mt-1">Clique em "Iniciar Viagem" para começar.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 border-b border-border">
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Motorista</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Veículo</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase">Destino</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-center">Saída</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-center">Retorno</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">KM Inicial</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">KM Final</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-right">Distância</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {trips.map((t) => {
                                    const dist = t.km_end && t.km_start ? t.km_end - t.km_start : null;
                                    const duration = calcDuration(t.time_start, t.time_end);
                                    const canEnd = t.status === "em_andamento" && (t.driver_id === user?.id || isAdminOrGestor);
                                    return (
                                        <tr key={t.id} className="hover:bg-background/50 transition-colors">
                                            <td className="px-5 py-3 text-sm font-medium text-text-primary">
                                                {t.driver?.name || "—"}
                                                {t.driver_id === user?.id && <span className="text-xs text-primary ml-1">(eu)</span>}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-sm font-medium text-text-primary">{t.vehicle?.name}</div>
                                                <div className="text-xs text-text-secondary font-mono">{t.vehicle?.plate}</div>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-text-secondary max-w-[200px] truncate">{t.destination || "—"}</td>
                                            <td className="px-5 py-3 text-sm text-center font-mono text-text-primary">{formatTime(t.time_start)}</td>
                                            <td className="px-5 py-3 text-sm text-center font-mono text-text-primary">
                                                {t.time_end ? formatTime(t.time_end) : (
                                                    <span className="text-emerald-600 font-bold animate-pulse">em rota</span>
                                                )}
                                                {duration && <div className="text-[10px] text-text-secondary">{duration}</div>}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-right font-mono text-text-primary">{t.km_start?.toLocaleString("pt-BR")}</td>
                                            <td className="px-5 py-3 text-sm text-right font-mono text-text-primary">{t.km_end?.toLocaleString("pt-BR") || "—"}</td>
                                            <td className="px-5 py-3 text-sm text-right font-bold">
                                                {dist !== null ? (
                                                    <span className="text-primary">{dist.toLocaleString("pt-BR")} km</span>
                                                ) : "—"}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {canEnd ? (
                                                    <button
                                                        onClick={() => openEndTrip(t)}
                                                        className="text-xs px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 transition-colors"
                                                    >
                                                        Finalizar
                                                    </button>
                                                ) : (
                                                    <StatusBadge status={t.status === "em_andamento" ? "Em Andamento" : t.status === "finalizado" ? "Concluído" : "Cancelado"} />
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

            {/* MODAL: Iniciar Viagem */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && setShowForm(false)}></div>
                    <div className="relative bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden z-10">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined">play_arrow</span>
                                <h2 className="text-lg font-bold">Iniciar Viagem</h2>
                            </div>
                            <span className="text-sm font-mono bg-white/20 px-2 py-0.5 rounded">
                                {clockTime.toLocaleTimeString("pt-BR")}
                            </span>
                        </div>

                        <form onSubmit={handleStartTrip} className="p-6 space-y-5">
                            {formError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">error</span>
                                    {formError}
                                </div>
                            )}

                            {/* Veículo */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Veículo</label>
                                <select
                                    value={form.vehicle_id}
                                    onChange={(e) => {
                                        const v = vehicles.find((v) => v.id === e.target.value);
                                        setForm({ ...form, vehicle_id: e.target.value, km_start: v?.km?.toString() || "" });
                                    }}
                                    required
                                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="">Selecione...</option>
                                    {availableVehicles.map((v) => (
                                        <option key={v.id} value={v.id}>{v.name} — {v.plate} (KM: {(v.km || 0).toLocaleString("pt-BR")})</option>
                                    ))}
                                </select>
                                {vehiclesInUse.size > 0 && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        {vehiclesInUse.size} veículo{vehiclesInUse.size > 1 ? "s" : ""} em uso no momento.
                                    </p>
                                )}
                            </div>

                            {/* KM Inicial */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">KM Inicial</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary text-[20px]">speed</span>
                                    <input
                                        type="number"
                                        value={form.km_start}
                                        onChange={(e) => setForm({ ...form, km_start: e.target.value })}
                                        required
                                        min={1}
                                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Ex: 45230"
                                    />
                                </div>
                                {selectedVehicle && (
                                    <p className="text-xs text-text-secondary mt-1">
                                        KM atual do veículo: <span className="font-bold">{(selectedVehicle.km || 0).toLocaleString("pt-BR")}</span>
                                    </p>
                                )}
                            </div>

                            {/* Destino */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Destino</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary text-[20px]">location_on</span>
                                    <input
                                        type="text"
                                        value={form.destination}
                                        onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Ex: Cliente João - Centro"
                                    />
                                </div>
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Observações <span className="text-text-secondary font-normal">(opcional)</span></label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                    placeholder="Ex: Entrega de equipamentos"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} disabled={saving} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-background transition-colors disabled:opacity-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60 shadow-sm">
                                    {saving ? (
                                        <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Registrando...</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-[18px]">play_arrow</span> Iniciar Viagem</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Finalizar Viagem */}
            {endingTrip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && setEndingTrip(null)}></div>
                    <div className="relative bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden z-10">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined">stop_circle</span>
                                <h2 className="text-lg font-bold">Finalizar Viagem</h2>
                            </div>
                            <span className="text-sm font-mono bg-white/20 px-2 py-0.5 rounded">
                                {clockTime.toLocaleTimeString("pt-BR")}
                            </span>
                        </div>

                        <form onSubmit={handleEndTrip} className="p-6 space-y-5">
                            {/* Trip info */}
                            <div className="bg-background rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Veículo</span>
                                    <span className="font-bold text-text-primary">{endingTrip.vehicle?.name} ({endingTrip.vehicle?.plate})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Saída</span>
                                    <span className="font-bold text-text-primary">{formatTime(endingTrip.time_start)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">KM Inicial</span>
                                    <span className="font-bold text-text-primary">{endingTrip.km_start?.toLocaleString("pt-BR")}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-secondary">Destino</span>
                                    <span className="font-bold text-text-primary">{endingTrip.destination}</span>
                                </div>
                            </div>

                            {formError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">error</span>
                                    {formError}
                                </div>
                            )}

                            {/* KM Final */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">KM Final</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary text-[20px]">speed</span>
                                    <input
                                        type="number"
                                        value={endForm.km_end}
                                        onChange={(e) => setEndForm({ ...endForm, km_end: e.target.value })}
                                        required
                                        min={endingTrip.km_start}
                                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder={`Maior que ${endingTrip.km_start?.toLocaleString("pt-BR")}`}
                                    />
                                </div>
                                {endForm.km_end && parseInt(endForm.km_end) > endingTrip.km_start && (
                                    <p className="text-xs text-emerald-600 mt-1 font-bold">
                                        Distância percorrida: {(parseInt(endForm.km_end) - endingTrip.km_start).toLocaleString("pt-BR")} km
                                    </p>
                                )}
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Observações <span className="text-text-secondary font-normal">(opcional)</span></label>
                                <textarea
                                    value={endForm.notes}
                                    onChange={(e) => setEndForm({ ...endForm, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                    placeholder="Ex: Entrega realizada com sucesso"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEndingTrip(null)} disabled={saving} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-background transition-colors disabled:opacity-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60 shadow-sm">
                                    {saving ? (
                                        <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Finalizando...</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-[18px]">check_circle</span> Finalizar Viagem</>
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
