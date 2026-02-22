-- =============================================
-- Tabelas: Tipos de Despesa + Despesas
-- Execute no Supabase SQL Editor
-- =============================================

-- Tabela de tipos de despesa
CREATE TABLE IF NOT EXISTS expense_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expense_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read expense_types" ON expense_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert expense_types" ON expense_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update expense_types" ON expense_types FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete expense_types" ON expense_types FOR DELETE TO authenticated USING (true);

-- Tipos padrão
INSERT INTO expense_types (name) VALUES
  ('Estacionamento'),
  ('Financiamento'),
  ('Impostos (IPVA/DPVAT)'),
  ('Licenciamento'),
  ('Multa'),
  ('Pedágio'),
  ('Reembolso'),
  ('Seguro');

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  expense_type_id UUID REFERENCES expense_types(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  status TEXT DEFAULT 'pago' CHECK (status IN ('pago','pendente','vencido')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update expenses" ON expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete expenses" ON expenses FOR DELETE TO authenticated USING (true);
