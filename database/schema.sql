-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE profiles (
  id              UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name       TEXT,
  monthly_income  NUMERIC(10,2) NOT NULL DEFAULT 1200.00,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS: cada usuario solo ve su fila
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario ve su propio perfil"
  ON profiles FOR ALL USING (auth.uid() = id);

-- ============================================================
-- TABLA: categories
-- ============================================================
CREATE TABLE categories (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  icon         TEXT        NOT NULL DEFAULT '💰',
  rule_type    TEXT        NOT NULL CHECK (rule_type IN ('need', 'want', 'saving')),
  budget_limit NUMERIC(10,2),        -- límite mensual opcional por categoría
  is_default   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gestiona sus categorías"
  ON categories FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLA: transactions
-- ============================================================
CREATE TABLE transactions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID        REFERENCES categories(id) ON DELETE SET NULL,
  amount      NUMERIC(10,2) NOT NULL,   -- NEGATIVO = gasto, POSITIVO = ingreso
  description TEXT,
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category  ON transactions(category_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gestiona sus transacciones"
  ON transactions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TABLA: saving_goals
-- ============================================================
CREATE TABLE saving_goals (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                 TEXT        NOT NULL DEFAULT 'Meta S/ 10,000',
  target_amount        NUMERIC(10,2) NOT NULL DEFAULT 10000.00,
  current_amount       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  monthly_contribution NUMERIC(10,2) NOT NULL DEFAULT 240.00,
  months_to_goal       INTEGER,      -- calculado automáticamente por trigger
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER saving_goals_updated_at
  BEFORE UPDATE ON saving_goals
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Función que recalcula months_to_goal automáticamente (RF-S4)
CREATE OR REPLACE FUNCTION recalculate_months_to_goal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.monthly_contribution > 0 AND NEW.target_amount > NEW.current_amount THEN
    NEW.months_to_goal = CEIL(
      (NEW.target_amount - NEW.current_amount)::FLOAT / NEW.monthly_contribution
    )::INTEGER;
  ELSE
    NEW.months_to_goal = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saving_goals_recalculate
  BEFORE INSERT OR UPDATE ON saving_goals
  FOR EACH ROW EXECUTE FUNCTION recalculate_months_to_goal();

ALTER TABLE saving_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gestiona su meta"
  ON saving_goals FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN: sincroniza current_amount al insertar/borrar transacciones
-- (así RF-S4 se activa en cascada desde transactions)
-- ============================================================
CREATE OR REPLACE FUNCTION sync_saving_goal_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID := COALESCE(NEW.user_id, OLD.user_id);
  v_total   NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
    INTO v_total
    FROM transactions
   WHERE user_id = v_user_id
     AND amount > 0;           -- solo ingresos para el total acumulado

  UPDATE saving_goals
     SET current_amount = v_total
   WHERE user_id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER transactions_sync_goal
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION sync_saving_goal_on_transaction();