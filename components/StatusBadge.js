export default function StatusBadge({ status }) {
    const styles = {
        ativo: "bg-emerald-50 text-emerald-700 border-emerald-200",
        concluido: "bg-emerald-50 text-emerald-700 border-emerald-200",
        concluído: "bg-emerald-50 text-emerald-700 border-emerald-200",
        finalizado: "bg-emerald-50 text-emerald-700 border-emerald-200",
        aprovado: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pendente: "bg-amber-50 text-amber-700 border-amber-200",
        agendado: "bg-amber-50 text-amber-700 border-amber-200",
        "em manutenção": "bg-amber-50 text-amber-700 border-amber-200",
        manutenção: "bg-amber-50 text-amber-700 border-amber-200",
        atrasado: "bg-red-50 text-red-700 border-red-200",
        inativo: "bg-slate-100 text-slate-600 border-slate-200",
    };

    const dotColors = {
        ativo: "bg-emerald-500",
        concluido: "bg-emerald-500",
        concluído: "bg-emerald-500",
        finalizado: "bg-emerald-500",
        aprovado: "bg-emerald-500",
        pendente: "bg-amber-500",
        agendado: "bg-amber-500",
        "em manutenção": "bg-amber-500",
        manutenção: "bg-amber-500",
        atrasado: "bg-red-500",
        inativo: "bg-slate-400",
    };

    const key = status?.toLowerCase() || "";
    const style = styles[key] || "bg-slate-100 text-slate-600 border-slate-200";
    const dot = dotColors[key] || "bg-slate-400";

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
            {status}
        </span>
    );
}
