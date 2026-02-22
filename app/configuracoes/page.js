"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";

export default function ConfiguracoesPage() {
    const { profile, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        name: profile?.name || "",
        email: profile?.email || "",
    });
    const [passwordForm, setPasswordForm] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordMsg, setPasswordMsg] = useState("");

    // Logo state
    const [logoUrl, setLogoUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [logoMsg, setLogoMsg] = useState("");
    const [companyName, setCompanyName] = useState("Maxxi Internet");

    useEffect(() => {
        fetchCompanySettings();
    }, []);

    async function fetchCompanySettings() {
        const { data } = await supabase
            .from("company_settings")
            .select("*")
            .limit(1)
            .single();
        if (data) {
            setLogoUrl(data.logo_url);
            setCompanyName(data.company_name || "Maxxi Internet");
        }
    }

    async function handleLogoUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        if (!file.type.startsWith("image/")) {
            setLogoMsg("Selecione uma imagem (PNG, JPG, SVG).");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setLogoMsg("A imagem deve ter no máximo 2MB.");
            return;
        }

        setUploading(true);
        setLogoMsg("");

        const ext = file.name.split(".").pop();
        const fileName = `logo_${Date.now()}.${ext}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("logos")
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            setLogoMsg("Erro ao enviar: " + uploadError.message);
            setUploading(false);
            return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("logos")
            .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Save to company_settings
        const { data: existing } = await supabase
            .from("company_settings")
            .select("id")
            .limit(1)
            .single();

        if (existing) {
            await supabase
                .from("company_settings")
                .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
                .eq("id", existing.id);
        } else {
            await supabase
                .from("company_settings")
                .insert({ logo_url: publicUrl });
        }

        setLogoUrl(publicUrl);
        setUploading(false);
        setLogoMsg("✅ Logo atualizada com sucesso!");
        setTimeout(() => setLogoMsg(""), 3000);
    }

    async function handleRemoveLogo() {
        if (!confirm("Remover a logo da empresa?")) return;
        const { data: existing } = await supabase
            .from("company_settings")
            .select("id")
            .limit(1)
            .single();

        if (existing) {
            await supabase
                .from("company_settings")
                .update({ logo_url: null, updated_at: new Date().toISOString() })
                .eq("id", existing.id);
        }
        setLogoUrl(null);
        setLogoMsg("Logo removida.");
        setTimeout(() => setLogoMsg(""), 3000);
    }

    async function handleCompanyNameSave() {
        const { data: existing } = await supabase
            .from("company_settings")
            .select("id")
            .limit(1)
            .single();

        if (existing) {
            await supabase
                .from("company_settings")
                .update({ company_name: companyName, updated_at: new Date().toISOString() })
                .eq("id", existing.id);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }

    async function handleProfileSave(e) {
        e.preventDefault();
        setSaving(true);
        await supabase
            .from("profiles")
            .update({ name: form.name })
            .eq("id", user.id);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }

    async function handlePasswordChange(e) {
        e.preventDefault();
        setPasswordMsg("");
        if (passwordForm.newPassword.length < 6) {
            setPasswordMsg("A senha deve ter pelo menos 6 caracteres.");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMsg("As senhas não coincidem.");
            return;
        }
        const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
        if (error) {
            setPasswordMsg("Erro ao alterar senha: " + error.message);
        } else {
            setPasswordMsg("✅ Senha alterada com sucesso!");
            setPasswordForm({ newPassword: "", confirmPassword: "" });
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Configurações</h1>
                <p className="text-text-secondary mt-1">Gerencie seu perfil e preferências do sistema.</p>
            </div>

            {/* Logo da Empresa */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">image</span>
                    <h2 className="text-lg font-bold text-text-primary">Logo da Empresa</h2>
                </div>
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        {/* Preview */}
                        <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt="Logo da empresa"
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-4xl text-text-secondary">add_photo_alternate</span>
                                    <p className="text-[10px] text-text-secondary mt-1">Sem logo</p>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-text-primary">Enviar Logo</p>
                                <p className="text-xs text-text-secondary mt-0.5">
                                    Formatos: PNG, JPG, SVG. Tamanho máximo: 2MB.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <label className={`flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                                    <span className="material-symbols-outlined text-[18px]">upload</span>
                                    {uploading ? "Enviando..." : "Selecionar Arquivo"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>

                                {logoUrl && (
                                    <button
                                        onClick={handleRemoveLogo}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-danger border border-red-200 hover:bg-red-50 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        Remover
                                    </button>
                                )}
                            </div>

                            {logoMsg && (
                                <p className={`text-sm font-medium ${logoMsg.startsWith("✅") ? "text-success" : logoMsg === "Logo removida." ? "text-text-secondary" : "text-danger"}`}>
                                    {logoMsg}
                                </p>
                            )}

                            {/* Nome da empresa */}
                            <div className="pt-2 border-t border-border">
                                <label className="block text-sm font-semibold text-text-primary mb-1.5">Nome da Empresa</label>
                                <div className="flex gap-3">
                                    <input
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                                    />
                                    <button
                                        onClick={handleCompanyNameSave}
                                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Aparência */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">palette</span>
                    <h2 className="text-lg font-bold text-text-primary">Aparência</h2>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-text-primary">Modo Escuro</p>
                            <p className="text-xs text-text-secondary mt-0.5">Alterne entre temas claro e escuro.</p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 ${theme === "dark" ? "bg-primary" : "bg-border"
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${theme === "dark" ? "translate-x-7" : "translate-x-0"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[14px] text-text-secondary">
                                    {theme === "dark" ? "dark_mode" : "light_mode"}
                                </span>
                            </span>
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <button
                            onClick={() => { if (theme === "dark") toggleTheme(); }}
                            className={`p-4 rounded-xl border-2 transition-all ${theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-text-secondary"
                                }`}
                        >
                            <div className="w-full h-16 bg-white rounded-lg border border-gray-200 mb-2 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-700">light_mode</span>
                            </div>
                            <p className="text-sm font-semibold text-text-primary">Claro</p>
                        </button>
                        <button
                            onClick={() => { if (theme === "light") toggleTheme(); }}
                            className={`p-4 rounded-xl border-2 transition-all ${theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-text-secondary"
                                }`}
                        >
                            <div className="w-full h-16 bg-slate-800 rounded-lg border border-slate-600 mb-2 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-300">dark_mode</span>
                            </div>
                            <p className="text-sm font-semibold text-text-primary">Escuro</p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Perfil */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">person</span>
                    <h2 className="text-lg font-bold text-text-primary">Perfil</h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handleProfileSave} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Nome</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Email</label>
                            <input
                                value={form.email}
                                disabled
                                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-background/50 text-text-secondary cursor-not-allowed"
                            />
                            <p className="text-xs text-text-secondary mt-1">O email não pode ser alterado.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60"
                            >
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                {saving ? "Salvando..." : "Salvar Perfil"}
                            </button>
                            {saved && (
                                <span className="text-sm text-success font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    Salvo!
                                </span>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Alterar Senha */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">lock</span>
                    <h2 className="text-lg font-bold text-text-primary">Alterar Senha</h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handlePasswordChange} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Nova Senha</label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">Confirmar Senha</label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                required
                                minLength={6}
                                placeholder="Repita a senha"
                                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                            />
                        </div>
                        {passwordMsg && (
                            <p className={`text-sm font-medium ${passwordMsg.startsWith("✅") ? "text-success" : "text-danger"}`}>
                                {passwordMsg}
                            </p>
                        )}
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                            Alterar Senha
                        </button>
                    </form>
                </div>
            </div>

            {/* Info do Sistema */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">info</span>
                    <h2 className="text-lg font-bold text-text-primary">Sobre o Sistema</h2>
                </div>
                <div className="p-6 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Sistema</span>
                        <span className="font-semibold text-text-primary">{companyName} — Gestão de Frota</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Versão</span>
                        <span className="font-semibold text-text-primary">1.0.0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Tema Atual</span>
                        <span className="font-semibold text-text-primary">{theme === "dark" ? "🌙 Escuro" : "☀️ Claro"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Usuário</span>
                        <span className="font-semibold text-text-primary">{profile?.name || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Função</span>
                        <span className="font-semibold text-text-primary capitalize">{profile?.role || "—"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
