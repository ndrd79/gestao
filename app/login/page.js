"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    const [companyName, setCompanyName] = useState("Maxxi Internet");
    const { signIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        supabase
            .from("company_settings")
            .select("logo_url, company_name")
            .limit(1)
            .single()
            .then(({ data }) => {
                if (data?.logo_url) setLogoUrl(data.logo_url);
                if (data?.company_name) setCompanyName(data.company_name);
            });
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signIn(email, password);
            router.push("/dashboard");
        } catch (err) {
            setError(
                err.message === "Invalid login credentials"
                    ? "Email ou senha incorretos."
                    : "Erro ao fazer login. Tente novamente."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md">
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-hover p-8 text-center">
                    {logoUrl ? (
                        <div className="w-20 h-20 rounded-xl mx-auto mb-4 shadow-lg overflow-hidden bg-white/10 p-1">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="material-symbols-outlined text-primary text-3xl">
                                local_shipping
                            </span>
                        </div>
                    )}
                    <h1 className="text-white text-xl font-bold">{companyName}</h1>
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

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@maxxi.net.br"
                                    required
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#002469] hover:bg-[#001a4f] text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-[#002469]/30 transition-all active:scale-[0.98] text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Entrando...
                                </>
                            ) : (
                                "Entrar no Sistema"
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <p className="text-center text-white/50 text-xs mt-6">
                © 2026 {companyName}. Todos os direitos reservados.
            </p>
        </div>
    );
}
