-- =============================================
-- Supabase Storage — Bucket para logos
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Criar bucket público para logos
INSERT INTO storage.buckets (id, name, public)
    VALUES ('logos', 'logos', true)
    ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acesso para o bucket de logos
CREATE POLICY IF NOT EXISTS "Allow uploads" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'logos');

CREATE POLICY IF NOT EXISTS "Allow updates" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'logos');

CREATE POLICY IF NOT EXISTS "Allow public reads" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'logos');

CREATE POLICY IF NOT EXISTS "Allow deletes" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'logos');

-- =============================================
-- Tabela: Configurações da Empresa (singleton)
-- =============================================

CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logo_url TEXT,
    company_name TEXT DEFAULT 'Maxxi Internet',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- singleton: garante que só exista 1 registro
    singleton BOOLEAN NOT NULL DEFAULT true UNIQUE CHECK (singleton = true)
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can read settings"
    ON company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can update settings"
    ON company_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert settings"
    ON company_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Inserir registro padrão (ON CONFLICT para segurança ao re-executar)
INSERT INTO company_settings (company_name, singleton)
    VALUES ('Maxxi Internet', true)
    ON CONFLICT (singleton) DO NOTHING;
