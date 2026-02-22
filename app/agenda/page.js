import KPICard from "@/components/KPICard";

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const calendarDays = [
    { day: 28, isCurrentMonth: false },
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true, events: [{ vehicle: "Fiorino 01", driver: "João", color: "bg-primary" }] },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true, events: [{ vehicle: "VW Gol", driver: "Carlos", color: "bg-emerald-500" }] },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true, events: [{ vehicle: "Van Executiva", driver: "Maria", color: "bg-amber-500" }] },
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true, isToday: true, events: [{ vehicle: "Strada 02", driver: "Roberto", color: "bg-primary-light" }] },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true, events: [{ vehicle: "Fiorino 01", driver: "João", color: "bg-primary" }, { vehicle: "Caminhão 03", driver: "Pedro", color: "bg-red-500" }] },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true, events: [{ vehicle: "VW Gol", driver: "Carlos", color: "bg-emerald-500" }] },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 31, isCurrentMonth: true },
    { day: 1, isCurrentMonth: false },
];

export default function AgendaPage() {
    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Agenda de Uso</h1>
                    <p className="text-text-secondary mt-1">Calendário de agendamentos dos veículos da frota.</p>
                </div>
                <div className="flex gap-3 items-center">
                    <button className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span className="text-sm font-bold text-text-primary px-3">Maio 2024</span>
                    <button className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                    <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg shadow-sm text-sm font-bold transition-all active:scale-[0.98]">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Novo Agendamento
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <KPICard icon="local_shipping" iconBg="bg-primary/10 text-primary" label="Frota Total" value="12" />
                <KPICard icon="check_circle" iconBg="bg-emerald-50 text-emerald-600" label="Disponíveis" value="8" />
                <KPICard icon="route" iconBg="bg-amber-50 text-amber-600" label="Em Viagem" value="3" />
                <KPICard icon="build" iconBg="bg-red-50 text-red-600" label="Manutenção" value="1" />
            </div>

            {/* Calendar */}
            <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-border bg-background/50">
                    {daysOfWeek.map((d) => (
                        <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 divide-x divide-y divide-border">
                    {calendarDays.map((cell, i) => (
                        <div
                            key={i}
                            className={`min-h-[100px] p-2 ${cell.isCurrentMonth ? "bg-surface" : "bg-background/30"
                                } ${cell.isToday ? "ring-2 ring-inset ring-primary" : ""} hover:bg-background/50 transition-colors`}
                        >
                            <span
                                className={`text-sm font-medium leading-none ${cell.isToday
                                        ? "bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center"
                                        : cell.isCurrentMonth
                                            ? "text-text-primary"
                                            : "text-text-secondary/40"
                                    }`}
                            >
                                {cell.day}
                            </span>
                            {cell.events && (
                                <div className="mt-1.5 space-y-1">
                                    {cell.events.map((ev, j) => (
                                        <div
                                            key={j}
                                            className={`text-[11px] font-medium text-white px-1.5 py-0.5 rounded truncate ${ev.color}`}
                                        >
                                            {ev.vehicle}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary"></span> Confirmado</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500"></span> Pendente</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500"></span> Disponível</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500"></span> Manutenção</div>
            </div>
        </div>
    );
}
