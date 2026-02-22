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
    const [expandedTrip, setExpandedTrip] = useState(null);

    // Form: nova viagem
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        vehicle_id: "",
        km_start: "",
        client_name: "",
        address: "",
        destination: "",
        reason: "",
        notes: "",
    });

    // Form: finalizar viagem
    const [endingTrip, setEndingTrip] = useState(null);
    const [endForm, setEndForm] = useState({ km_end: "", notes: "" });

    const isAdminOrGestor = profile?.role === "admin" || profile?.role === "gestor";

    // Estatísticas do dia
    const stats = useMemo(() => {
        const completed = trips.filter(t => t.status === 'finalizado');
        const activeCount = trips.filter(t => t.status === 'em_andamento').length;
        const totalKm = completed.reduce((acc, t) => acc + (t.km_end - t.km_start || 0), 0);
        return {
            total: trips.length,
            completed: completed.length,
            active: activeCount,
            km: totalKm
        };
    }, [trips]);

    // Relógio em tempo real
    useEffect(() => {
        const timer = setInterval(() => setClockTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => { fetchData(); }, [filterDate]);

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            console.log("Buscando dados do Diário de Bordo...");
            const [vRes, tRes] = await Promise.all([
                supabase.from("vehicles").select("id, name, plate, km, status").order("name"),
                supabase
                    .from("trip_logs")
                    .select("*, vehicle:vehicles(name, plate), driver:profiles(name)")
                    .gte("date", filterDate)
                    .lte("date", filterDate)
                    .order("time_start", { ascending: false }),
            ]);

            if (vRes.error) {
                console.error("Erro veículos:", vRes.error);
                throw new Error("Erro ao carregar veículos: " + vRes.error.message);
            }
            if (tRes.error) {
                console.error("Erro trip_logs:", tRes.error);
                if (tRes.error.code === "PGRST116" || tRes.error.message?.includes("relation \"trip_logs\" does not exist")) {
                    throw new Error("A tabela 'trip_logs' não foi encontrada. Certifique-se de executar o SQL de migração no Supabase.");
                }
                throw new Error("Erro ao carregar viagens: " + tRes.error.message);
            }

            console.log("Veículos carregados:", vRes.data?.length);
            setVehicles(vRes.data || []);
            setTrips(tRes.data || []);
        } catch (err) {
            console.error("Erro Geral:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Viagens ativas (qualquer data)
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

    const myActiveTrip = useMemo(() => activeTrips.find((t) => t.driver_id === user?.id), [activeTrips, user]);
    const vehiclesInUse = useMemo(() => new Set(activeTrips.map((t) => t.vehicle_id)), [activeTrips]);
    const availableVehicles = useMemo(() => vehicles.filter((v) => !vehiclesInUse.has(v.id)), [vehicles, vehiclesInUse]);
    const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === form.vehicle_id), [form.vehicle_id, vehicles]);

    function openNewTrip() {
        if (myActiveTrip) {
            setFormError("Você já tem uma viagem em andamento. Finalize-a antes de iniciar outra.");
            return;
        }
        setForm({ vehicle_id: "", km_start: "", client_name: "", address: "", destination: "", reason: "", notes: "" });
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
        if (!form.reason?.trim()) { setFormError("Informe o motivo da viagem."); return; }

        setSaving(true);
        try {
            const now = new Date();
            const timeStr = now.toTimeString().split(" ")[0];

            const { error: insertErr } = await supabase.from("trip_logs").insert({
                vehicle_id: form.vehicle_id,
                driver_id: user.id,
                date: now.toISOString().split("T")[0],
                km_start: kmStart,
                time_start: timeStr,
                client_name: form.client_name.trim() || null,
                address: form.address.trim() || null,
                destination: form.destination.trim(),
                reason: form.reason.trim(),
                notes: form.notes?.trim() || null,
                status: "em_andamento",
            });

            if (insertErr) throw insertErr;
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
                .update({ km_end: kmEnd, time_end: timeStr, notes: endForm.notes?.trim() || null, status: "finalizado" })
                .eq("id", endingTrip.id);

            if (updateErr) throw updateErr;
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
        return t.slice(0, 5);
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

    function openInMaps(address, destination) {
        const query = address ? `${address}, ${destination}` : destination;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
        window.open(url, '_blank');
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Diário de Bordo</h1>
                    <p className="text-text-secondary mt-1">Controle de saídas, destinos, clientes e quilometragem.</p>
                </div>
                <div className="flex items-center gap-3">
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

            {/* Resumo de Produtividade */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">route</span>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Saídas Hoje</p>
                        <p className="text-xl font-bold text-text-primary">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">speed</span>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">KM Rodados</p>
                        <p className="text-xl font-bold text-text-primary">{stats.km.toLocaleString("pt-BR")} km</p>
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">local_shipping</span>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Em Rota</p>
                        <p className="text-xl font-bold text-text-primary">{stats.active}</p>
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">task_alt</span>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Concluídas</p>
                        <p className="text-xl font-bold text-text-primary">{stats.completed}</p>
                    </div>
                </div>
            </div>

            {/* Alerta de Erro */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    <div>
                        <p className="font-bold text-sm">Ops! Ocorreu um erro ao carregar os dados.</p>
                        <p className="text-xs mt-1">{error}</p>
                        <button onClick={() => fetchData()} className="mt-2 text-xs font-bold underline hover:no-underline">Tentar novamente</button>
                    </div>
                </div>
            )}

            {!loading && vehicles.length === 0 && !error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                    <span className="material-symbols-outlined text-amber-500">warning</span>
                    <div>
                        <p className="font-bold text-sm">Nenhum veículo encontrado.</p>
                        <p className="text-xs mt-1">Certifique-se de cadastrar veículos na página de <a href="/veiculos" className="underline font-bold">Veículos</a>.</p>
                    </div>
                </div>
            )}

            {/* Banner viagem ativa */}
            {myActiveTrip && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl animate-pulse">directions_car</span>
                            </div>
                            <div>
                                <p className="text-sm text-white/80">Sua viagem ativa</p>
                                <p className="text-lg font-bold">{myActiveTrip.vehicle?.name} — {myActiveTrip.vehicle?.plate}</p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-white/90">
                                    {myActiveTrip.client_name && <span>👤 {myActiveTrip.client_name}</span>}
                                    <span>📍 {myActiveTrip.destination}</span>
                                    <span>🕐 {formatTime(myActiveTrip.time_start)}</span>
                                    <span>📏 {myActiveTrip.km_start?.toLocaleString("pt-BR")} km</span>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => openInMaps(myActiveTrip.address, myActiveTrip.destination)}
                                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">directions</span>
                                        Abrir GPS (Maps)
                                    </button>
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

            {/* Viagens ativas da equipe */}
            {isAdminOrGestor && activeTrips.filter((t) => t.driver_id !== user?.id).length > 0 && (
                <div className="bg-surface rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border bg-background/50 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">visibility</span>
                        <h2 className="text-sm font-bold text-text-primary">Viagens Ativas da Equipe</h2>
                    </div>
                    <div className="divide-y divide-border">
                        {activeTrips.filter((t) => t.driver_id !== user?.id).map((t) => (
                            <div key={t.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-2"></div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">
                                            {t.driver?.name || "Motorista"} → {t.destination}
                                            <button
                                                onClick={() => openInMaps(t.address, t.destination)}
                                                className="ml-2 text-primary hover:text-primary-hover inline-flex items-center"
                                                title="Ver no mapa"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                            </button>
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            {t.vehicle?.name} ({t.vehicle?.plate}) • Saída: {formatTime(t.time_start)}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => openEndTrip(t)} className="text-xs px-3 py-1.5 rounded-md text-amber-600 border border-amber-200 hover:bg-amber-50 font-medium">Encerrar</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filtro de data */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-text-secondary text-lg">calendar_today</span>
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-transparent text-sm text-text-primary focus:outline-none" />
                </div>
                <button onClick={() => setFilterDate(new Date().toISOString().split("T")[0])} className="text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20">Hoje</button>
            </div>

            {/* Tabela de Viagens */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-text-secondary"><span className="material-symbols-outlined text-4xl animate-pulse">sync</span></div>
                ) : trips.length === 0 ? (
                    <div className="p-12 text-center text-text-secondary"><p className="text-sm">Nenhum registro encontrado para este dia.</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 border-b border-border">
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Motorista</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Veículo</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Cliente / Destino</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase text-center">Saída</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase text-center">Retorno</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase text-right">KM Rodados</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {trips.map((t) => {
                                    const dist = t.km_end && t.km_start ? t.km_end - t.km_start : null;
                                    const duration = calcDuration(t.time_start, t.time_end);
                                    const canEnd = t.status === "em_andamento" && (t.driver_id === user?.id || isAdminOrGestor);
                                    const isExpanded = expandedTrip === t.id;
                                    return (
                                        <>
                                            <tr key={t.id} className="hover:bg-background/50 transition-colors cursor-pointer" onClick={() => setExpandedTrip(isExpanded ? null : t.id)}>
                                                <td className="px-4 py-3 text-sm font-medium text-text-primary">{t.driver?.name || "—"}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-text-primary">{t.vehicle?.name}</div>
                                                    <div className="text-[10px] text-text-secondary font-mono uppercase">{t.vehicle?.plate}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-text-primary flex items-center gap-1">
                                                        {t.client_name || t.destination}
                                                        <button onClick={(e) => { e.stopPropagation(); openInMaps(t.address, t.destination); }} className="text-primary hover:text-primary-hover">
                                                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-text-secondary truncate max-w-[180px]">{t.reason || t.address}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center font-mono">{formatTime(t.time_start)}</td>
                                                <td className="px-4 py-3 text-sm text-center font-mono">
                                                    {t.time_end ? formatTime(t.time_end) : <span className="text-emerald-600 font-bold animate-pulse text-[10px] uppercase">Em Rota</span>}
                                                    {duration && <div className="text-[10px] text-text-secondary">{duration}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-bold whitespace-nowrap">
                                                    {dist !== null ? <span className="text-primary">{dist} km</span> : <span className="text-text-secondary text-xs">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {canEnd ? (
                                                        <button onClick={(e) => { e.stopPropagation(); openEndTrip(t); }} className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded font-bold uppercase">Finalizar</button>
                                                    ) : (
                                                        <StatusBadge status={t.status === "em_andamento" ? "Em Andamento" : t.status === "finalizado" ? "Concluído" : "Cancelado"} />
                                                    )}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr key={`${t.id}-detail`} className="bg-background/30 text-xs">
                                                    <td colSpan={7} className="px-6 py-4">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div><span className="text-text-secondary block mb-1">Cliente/Motivo</span><p className="font-bold">{t.client_name || "—"} / {t.reason || "—"}</p></div>
                                                            <div>
                                                                <span className="text-text-secondary block mb-1">Endereço Completo</span>
                                                                <p className="font-bold">{t.address || "—"}, {t.destination}</p>
                                                                <button
                                                                    onClick={() => openInMaps(t.address, t.destination)}
                                                                    className="mt-1 flex items-center gap-1 text-primary hover:underline font-bold"
                                                                >
                                                                    <span className="material-symbols-outlined text-[14px]">map</span>
                                                                    Ver no Google Maps
                                                                </button>
                                                            </div>
                                                            <div><span className="text-text-secondary block mb-1">KM Inicial → Final</span><p className="font-bold">{t.km_start?.toLocaleString()} → {t.km_end?.toLocaleString() || "..."}</p></div>
                                                            {t.notes && <div className="col-span-2 md:col-span-4"><span className="text-text-secondary block mb-1">Observações</span><p className="italic">{t.notes}</p></div>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
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
                    <div className="relative bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden z-10 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                            <h2 className="text-lg font-bold">Iniciar Nova Viagem</h2>
                            <span className="text-sm font-mono bg-white/20 px-2 py-0.5 rounded">{clockTime.toLocaleTimeString("pt-BR")}</span>
                        </div>
                        <form onSubmit={handleStartTrip} className="p-6 space-y-4 overflow-y-auto">
                            {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{formError}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1">Veículo *</label>
                                <select value={form.vehicle_id} onChange={(e) => {
                                    const v = vehicles.find(v => v.id === e.target.value);
                                    setForm({ ...form, vehicle_id: e.target.value, km_start: v?.km?.toString() || "" });
                                }} required className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm">
                                    <option value="">Selecione...</option>
                                    {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1">KM Inicial *</label>
                                <input type="number" value={form.km_start} onChange={(e) => setForm({ ...form, km_start: e.target.value })} required className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-1">Cliente</label>
                                    <input type="text" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-1">Motivo *</label>
                                    <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1">Destino (Cidade/Bairro) *</label>
                                <input type="text" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1">Endereço Completo (para GPS)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-sm"
                                        placeholder="Ex: Rua das Flores, 123"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => openInMaps(form.address, form.destination)}
                                        disabled={!form.address && !form.destination}
                                        className="px-3 py-2 bg-background border border-border rounded-lg text-primary hover:bg-surface transition-colors flex items-center justify-center"
                                        title="Conferir no mapa"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">map</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-border rounded-lg text-sm font-bold">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">{saving ? "Registrando..." : "Iniciar"}</button>
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
                        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            <h2 className="text-lg font-bold">Finalizar Viagem</h2>
                        </div>
                        <form onSubmit={handleEndTrip} className="p-6 space-y-4">
                            <div className="text-sm bg-background p-3 rounded-lg flex flex-col gap-1">
                                <p><span className="text-text-secondary">Veículo:</span> <b>{endingTrip.vehicle?.name}</b></p>
                                <p><span className="text-text-secondary">Destino:</span> <b>{endingTrip.destination}</b></p>
                                <p><span className="text-text-secondary">KM Inicial:</span> <b>{endingTrip.km_start}</b></p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-1">KM Final *</label>
                                <input type="number" value={endForm.km_end} onChange={(e) => setEndForm({ ...endForm, km_end: e.target.value })} required min={endingTrip.km_start} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm font-bold" />
                            </div>
                            {endForm.km_end && parseInt(endForm.km_end) > endingTrip.km_start && (
                                <p className="text-xs text-emerald-600 font-bold">Total rodado: {parseInt(endForm.km_end) - endingTrip.km_start} km</p>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setEndingTrip(null)} className="flex-1 py-2 border border-border rounded-lg text-sm font-bold">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">{saving ? "Salvando..." : "Concluir"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
