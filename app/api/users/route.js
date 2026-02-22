import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Admin client with service_role key — NEVER expose this to the frontend
function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
        throw new Error("Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.");
    }
    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// Verify the requesting user is an admin
async function verifyAdmin(request) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.replace("Bearer ", "");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const userClient = createClient(url, anonKey);

    const { data: { user }, error } = await userClient.auth.getUser(token);
    if (error || !user) return null;

    // Check role in profiles
    const { data: profile } = await userClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") return null;
    return user;
}

// POST /api/users — Create a new user
export async function POST(request) {
    try {
        // Verify admin
        const admin = await verifyAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: "Acesso negado. Apenas administradores podem criar usuários." }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, name, role } = body;

        // Validate
        if (!email || !password || !name) {
            return NextResponse.json({ error: "Email, senha e nome são obrigatórios." }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
        }
        if (!["admin", "gestor", "motorista"].includes(role)) {
            return NextResponse.json({ error: "Função inválida. Use: admin, gestor ou motorista." }, { status: 400 });
        }

        const supabaseAdmin = getAdminClient();

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm the email
        });

        if (authError) {
            // Handle duplicate email
            if (authError.message?.includes("already been registered") || authError.message?.includes("already exists")) {
                return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
            }
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const userId = authData.user.id;

        // Create profile
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: userId,
                email,
                name,
                role,
                status: "ativo",
            }, { onConflict: "id" });

        if (profileError) {
            // Try to clean up the auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return NextResponse.json({ error: "Erro ao criar perfil: " + profileError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            user: { id: userId, email, name, role },
        });
    } catch (err) {
        console.error("Erro ao criar usuário:", err);
        return NextResponse.json({ error: err.message || "Erro interno do servidor." }, { status: 500 });
    }
}
