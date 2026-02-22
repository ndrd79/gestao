-- =============================================
-- Tabela: Diário de Bordo (trip_logs)
-- Execute no Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS trip_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    km_start INTEGER NOT NULL,
    km_end INTEGER,
    time_start TIME NOT NULL DEFAULT LOCALTIME,
    time_end TIME,
    destination TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizado', 'cancelado')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trip_logs_driver ON trip_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_logs_vehicle ON trip_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trip_logs_date ON trip_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_trip_logs_status ON trip_logs(status);

-- RLS
ALTER TABLE trip_logs ENABLE ROW LEVEL SECURITY;

-- Admin e gestor podem ver tudo
CREATE POLICY "trip_logs_select_admin_gestor"
    ON trip_logs FOR SELECT TO authenticated
    USING (
        public.get_my_role() IN ('admin', 'gestor')
        OR driver_id = auth.uid()
    );

-- Qualquer autenticado pode inserir (como motorista)
CREATE POLICY "trip_logs_insert"
    ON trip_logs FOR INSERT TO authenticated
    WITH CHECK (driver_id = auth.uid());

-- Motorista pode atualizar suas próprias viagens, admin/gestor pode atualizar todas
CREATE POLICY "trip_logs_update"
    ON trip_logs FOR UPDATE TO authenticated
    USING (
        public.get_my_role() IN ('admin', 'gestor')
        OR driver_id = auth.uid()
    );

-- Apenas admin pode deletar
CREATE POLICY "trip_logs_delete"
    ON trip_logs FOR DELETE TO authenticated
    USING (public.get_my_role() = 'admin');
