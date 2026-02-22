-- =============================================
-- Maxxi Internet — Gestão de Frota
-- Tabelas Supabase
-- =============================================

-- 1. Perfis de Usuário (estende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'motorista' CHECK (role IN ('admin', 'gestor', 'motorista')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Veículos
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  year INTEGER,
  km INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'manutencao', 'inativo')),
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Registros de Combustível
CREATE TABLE IF NOT EXISTS fuel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  liters NUMERIC(10,2) NOT NULL,
  price_per_liter NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  km INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Manutenções
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'atrasado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Agenda de Uso
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ler e escrever
CREATE POLICY "Authenticated users can read all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can read vehicles" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update vehicles" ON vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete vehicles" ON vehicles FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read fuel" ON fuel_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert fuel" ON fuel_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update fuel" ON fuel_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete fuel" ON fuel_records FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read maintenance" ON maintenance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert maintenance" ON maintenance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update maintenance" ON maintenance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete maintenance" ON maintenance FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read schedule" ON schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert schedule" ON schedule FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update schedule" ON schedule FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete schedule" ON schedule FOR DELETE TO authenticated USING (true);

-- =============================================
-- Trigger: Criar perfil automaticamente ao registrar
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'motorista'),
    'ativo'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
