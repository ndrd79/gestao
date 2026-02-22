-- =============================================
-- Storage: Bucket para logos da empresa
-- Execute no Supabase SQL Editor
-- =============================================

-- Criar bucket público para logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer autenticado pode fazer upload
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Política: qualquer autenticado pode atualizar
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'logos');

-- Política: leitura pública
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'logos');

-- Política: autenticados podem deletar
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logos');

-- Tabela para guardar configurações da empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  company_name TEXT DEFAULT 'Maxxi Internet',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS na tabela
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read settings" ON company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update settings" ON company_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert settings" ON company_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Inserir registro padrão
INSERT INTO company_settings (company_name) VALUES ('Maxxi Internet');
