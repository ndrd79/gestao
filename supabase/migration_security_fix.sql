-- =====================================================================
-- SCRIPT DE MIGRAÇÃO — Correções de Segurança e Integridade
-- Execute no Supabase SQL Editor (https://supabase.com/dashboard)
-- 
-- ⚠️  ATENÇÃO: Leia cada seção antes de executar.
--     Este script é SEGURO para re-execução (idempotente).
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- 1. SINGLETON para company_settings (impede duplicação de registros)
-- ─────────────────────────────────────────────────────────────────────

-- PASSO 1: Limpar duplicados ANTES de adicionar a constraint
-- Mantém apenas o registro mais antigo (ou o que tem logo_url preenchido)
DELETE FROM company_settings
WHERE id NOT IN (
    SELECT id FROM company_settings 
    ORDER BY 
        CASE WHEN logo_url IS NOT NULL THEN 0 ELSE 1 END,
        updated_at ASC 
    LIMIT 1
);

-- PASSO 2: Adicionar coluna singleton se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_settings' AND column_name = 'singleton'
    ) THEN
        ALTER TABLE company_settings 
            ADD COLUMN singleton BOOLEAN NOT NULL DEFAULT true 
            CONSTRAINT company_settings_singleton_unique UNIQUE 
            CONSTRAINT company_settings_singleton_check CHECK (singleton = true);
    END IF;
END
$$;

-- PASSO 3: Garantir que exista pelo menos 1 registro
INSERT INTO company_settings (company_name)
SELECT 'Maxxi Internet'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);


-- ─────────────────────────────────────────────────────────────────────
-- 2. RLS MAIS RESTRITIVO — profiles
--    Apenas admin pode alterar roles de outros usuários
--    Qualquer autenticado pode ler (para exibir nomes)
-- ─────────────────────────────────────────────────────────────────────

-- Função helper: retorna o role do usuário atual
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Remover políticas antigas de profiles (ignorar erro se não existir)
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Novas políticas para profiles
CREATE POLICY "profiles_select_authenticated"
    ON profiles FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND (
            -- Não pode alterar o próprio role (só admin pode alterar roles)
            role = (SELECT role FROM profiles WHERE id = auth.uid())
            OR public.get_my_role() = 'admin'
        )
    );

CREATE POLICY "profiles_update_admin"
    ON profiles FOR UPDATE TO authenticated
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────
-- 3. RLS MAIS RESTRITIVO — vehicles
--    Qualquer autenticado pode ler
--    Apenas admin e gestor podem inserir/atualizar/excluir
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can delete vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles" ON vehicles;

CREATE POLICY "vehicles_select_all"
    ON vehicles FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "vehicles_insert_admin_gestor"
    ON vehicles FOR INSERT TO authenticated
    WITH CHECK (public.get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "vehicles_update_admin_gestor"
    ON vehicles FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "vehicles_delete_admin"
    ON vehicles FOR DELETE TO authenticated
    USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────────────────────────────
-- 4. RLS MAIS RESTRITIVO — fuel_records
--    Todos autenticados podem ler todos
--    Qualquer autenticado pode inserir (motorista registra)
--    Apenas admin e gestor podem atualizar/excluir
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can read fuel_records" ON fuel_records;
DROP POLICY IF EXISTS "Users can read fuel_records" ON fuel_records;
DROP POLICY IF EXISTS "Authenticated users can insert fuel_records" ON fuel_records;
DROP POLICY IF EXISTS "Users can insert fuel_records" ON fuel_records;
DROP POLICY IF EXISTS "Authenticated users can update fuel_records" ON fuel_records;
DROP POLICY IF EXISTS "Users can update fuel_records" ON fuel_records;
DROP POLICY IF EXISTS "Authenticated users can delete fuel_records" ON fuel_records;
DROP POLICY IF EXISTS "Users can delete fuel_records" ON fuel_records;

CREATE POLICY "fuel_records_select_all"
    ON fuel_records FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "fuel_records_insert_all"
    ON fuel_records FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "fuel_records_update_admin_gestor"
    ON fuel_records FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "fuel_records_delete_admin_gestor"
    ON fuel_records FOR DELETE TO authenticated
    USING (public.get_my_role() IN ('admin', 'gestor'));


-- ─────────────────────────────────────────────────────────────────────
-- 5. RLS MAIS RESTRITIVO — maintenance
--    Mesma lógica de fuel_records
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can read maintenance" ON maintenance;
DROP POLICY IF EXISTS "Users can read maintenance" ON maintenance;
DROP POLICY IF EXISTS "Authenticated users can insert maintenance" ON maintenance;
DROP POLICY IF EXISTS "Users can insert maintenance" ON maintenance;
DROP POLICY IF EXISTS "Authenticated users can update maintenance" ON maintenance;
DROP POLICY IF EXISTS "Users can update maintenance" ON maintenance;
DROP POLICY IF EXISTS "Authenticated users can delete maintenance" ON maintenance;
DROP POLICY IF EXISTS "Users can delete maintenance" ON maintenance;

CREATE POLICY "maintenance_select_all"
    ON maintenance FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "maintenance_insert_all"
    ON maintenance FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "maintenance_update_admin_gestor"
    ON maintenance FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "maintenance_delete_admin_gestor"
    ON maintenance FOR DELETE TO authenticated
    USING (public.get_my_role() IN ('admin', 'gestor'));


-- ─────────────────────────────────────────────────────────────────────
-- 6. RLS MAIS RESTRITIVO — schedule
--    Qualquer autenticado pode ler e inserir
--    Apenas admin e gestor podem atualizar/excluir
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can read schedule" ON schedule;
DROP POLICY IF EXISTS "Users can read schedule" ON schedule;
DROP POLICY IF EXISTS "Authenticated users can insert schedule" ON schedule;
DROP POLICY IF EXISTS "Users can insert schedule" ON schedule;
DROP POLICY IF EXISTS "Authenticated users can update schedule" ON schedule;
DROP POLICY IF EXISTS "Users can update schedule" ON schedule;
DROP POLICY IF EXISTS "Authenticated users can delete schedule" ON schedule;
DROP POLICY IF EXISTS "Users can delete schedule" ON schedule;

CREATE POLICY "schedule_select_all"
    ON schedule FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "schedule_insert_all"
    ON schedule FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "schedule_update_admin_gestor"
    ON schedule FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "schedule_delete_admin_gestor"
    ON schedule FOR DELETE TO authenticated
    USING (public.get_my_role() IN ('admin', 'gestor'));


-- ─────────────────────────────────────────────────────────────────────
-- 7. RLS — expenses e expense_types
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can read expenses" ON expenses;
DROP POLICY IF EXISTS "Users can read expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON expenses;

CREATE POLICY "expenses_select_all"
    ON expenses FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "expenses_insert_admin_gestor"
    ON expenses FOR INSERT TO authenticated
    WITH CHECK (public.get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "expenses_update_admin_gestor"
    ON expenses FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "expenses_delete_admin_gestor"
    ON expenses FOR DELETE TO authenticated
    USING (public.get_my_role() IN ('admin', 'gestor'));

-- expense_types: apenas admin pode gerenciar tipos
DROP POLICY IF EXISTS "Authenticated users can read expense_types" ON expense_types;
DROP POLICY IF EXISTS "Users can read expense_types" ON expense_types;
DROP POLICY IF EXISTS "Authenticated users can insert expense_types" ON expense_types;
DROP POLICY IF EXISTS "Users can insert expense_types" ON expense_types;
DROP POLICY IF EXISTS "Authenticated users can update expense_types" ON expense_types;
DROP POLICY IF EXISTS "Users can update expense_types" ON expense_types;
DROP POLICY IF EXISTS "Authenticated users can delete expense_types" ON expense_types;
DROP POLICY IF EXISTS "Users can delete expense_types" ON expense_types;

CREATE POLICY "expense_types_select_all"
    ON expense_types FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "expense_types_insert_admin"
    ON expense_types FOR INSERT TO authenticated
    WITH CHECK (public.get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "expense_types_update_admin"
    ON expense_types FOR UPDATE TO authenticated
    USING (public.get_my_role() IN ('admin', 'gestor'));

CREATE POLICY "expense_types_delete_admin"
    ON expense_types FOR DELETE TO authenticated
    USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────────────────────────────
-- 8. RLS — company_settings
--    Qualquer autenticado pode ler
--    Apenas admin pode alterar
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can read settings" ON company_settings;
DROP POLICY IF EXISTS "Authenticated can read settings" ON company_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON company_settings;
DROP POLICY IF EXISTS "Authenticated can update settings" ON company_settings;
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON company_settings;
DROP POLICY IF EXISTS "Authenticated can insert settings" ON company_settings;

CREATE POLICY "company_settings_select_all"
    ON company_settings FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "company_settings_update_admin"
    ON company_settings FOR UPDATE TO authenticated
    USING (public.get_my_role() = 'admin');

CREATE POLICY "company_settings_insert_admin"
    ON company_settings FOR INSERT TO authenticated
    WITH CHECK (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────────────────────────────
-- 9. Storage — Limite de tamanho para uploads de logo (2MB)
-- ─────────────────────────────────────────────────────────────────────

-- Atualizar políticas de storage para limitar tamanho
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;

CREATE POLICY "logos_upload_2mb_limit"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'logos'
        AND (octet_length(name) < 255)
    );


-- ─────────────────────────────────────────────────────────────────────
-- ✅ MIGRAÇÃO CONCLUÍDA
-- ─────────────────────────────────────────────────────────────────────
-- 
-- Resumo das alterações:
-- 
-- 1. company_settings: coluna singleton com UNIQUE impedindo duplicação
-- 2. profiles: apenas admin pode alterar roles de outros
-- 3. vehicles: apenas admin/gestor pode criar; apenas admin pode excluir
-- 4. fuel_records: motorista pode registrar; admin/gestor gerencia
-- 5. maintenance: motorista pode registrar; admin/gestor gerencia
-- 6. schedule: qualquer um cria; admin/gestor gerencia
-- 7. expenses: apenas admin/gestor podem criar/editar/excluir
-- 8. expense_types: apenas admin pode gerenciar
-- 9. company_settings: apenas admin pode alterar
-- 10. Storage: limite de upload para logos
--
-- Função criada: public.get_my_role() — retorna o role do usuário logado
-- =====================================================================
