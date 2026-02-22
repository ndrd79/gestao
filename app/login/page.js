"use client";
import { useState } from "react";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="w-full max-w-md">
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-hover p-8 text-center">
                    <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            local_shipping
                        </span>
                    </div>
                    <h1 className="text-white text-xl font-bold">Maxxi Internet</h1>
                    <p className="text-white/70 text-sm mt-1">Sistema de Gestão de Frota</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Bem-vindo de volta!</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Faça login para acessar o sistema.
                        </p>
                    </div>

                    <form className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                                    mail
                                </span>
                                <input
                                    type="email"
                                    placeholder="seu@maxxi.net.br"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002469]/20 focus:border-[#002469] transition-shadow placeholder-slate-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Senha
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                                    lock
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002469]/20 focus:border-[#002469] transition-shadow placeholder-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-[#002469] focus:ring-[#002469]"
                                />
                                <span className="text-sm text-slate-600">Lembrar-me</span>
                            </label>
                            <a
                                href="#"
                                className="text-sm font-medium text-[#002469] hover:text-[#001a4f] transition-colors"
                            >
                                Esqueceu a senha?
                            </a>
                        </div>

                        <button
                            type="button"
                            className="w-full bg-[#002469] hover:bg-[#001a4f] text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-[#002469]/30 transition-all active:scale-[0.98] text-sm"
                        >
                            Entrar no Sistema
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <p className="text-center text-white/50 text-xs mt-6">
                © 2024 Maxxi Internet. Todos os direitos reservados.
            </p>
        </div>
    );
}
