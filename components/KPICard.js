export default function KPICard({ icon, iconBg, label, value, subtitle, badge }) {
    return (
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary-light/50 transition-all duration-200 group">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${iconBg || "bg-primary/10 text-primary"}`}>
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                </div>
                {badge && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color || "bg-emerald-100 text-emerald-700"}`}>
                        {badge.text}
                    </span>
                )}
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">{label}</p>
            <h4 className="text-2xl font-bold text-text-primary">{value}</h4>
            {subtitle && (
                <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
            )}
        </div>
    );
}
