"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/veiculos", icon: "directions_car", label: "Veículos" },
  { href: "/combustivel", icon: "local_gas_station", label: "Combustível" },
  { href: "/manutencao", icon: "build", label: "Manutenção" },
  { href: "/agenda", icon: "calendar_month", label: "Agenda" },
  { href: "/relatorios", icon: "bar_chart", label: "Relatórios" },
  { href: "/usuarios", icon: "group", label: "Usuários" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex flex-col bg-primary text-white border-r border-primary-hover transition-all duration-300 ease-in-out flex-shrink-0 h-screen sticky top-0 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-xl font-bold">
              local_shipping
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-accent">
                Maxxi Internet
              </span>
              <span className="text-[11px] text-white/60 truncate">
                Gestão de Frota
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 group ${
                isActive
                  ? "bg-white/20 text-accent shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={`material-symbols-outlined text-[22px] flex-shrink-0 ${
                  isActive ? "filled" : ""
                }`}
              >
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors w-full text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[22px]">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
