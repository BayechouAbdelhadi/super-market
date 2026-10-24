-- =========================================================================
-- Arrivages en réservation (lib/arrivals).
-- Un arrivage occasionnel (ex. poulet) ouvre des réservations entre deux dates ;
-- les clients viennent chercher leur commande en magasin le jour de l'arrivage.
--
-- Tables : arrivals, arrival_items, arrival_reservations,
--          arrival_reservation_lines, arrival_reservation_events.
-- Fonctions (service role uniquement) :
--   arrival_reserve                  réservation atomique, sans sur-réservation
--   arrival_reservation_set_status   changement de statut (remet le stock si annulée)
--   arrival_stats                    chiffres d'un arrivage, calculés en SQL
--
-- Apply BEFORE deploying the code that uses it. Safe to run again.
-- Needs tables.sql (profiles, customers).
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.arrivals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
  category TEXT NOT NULL DEFAULT 'CHICKEN' CHECK (category IN ('CHICKEN')),
  reservation_opens_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reservation_closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Jour de retrait en magasin (date locale du magasin, Europe/Paris)
  pickup_date DATE NOT NULL,
  -- Clôture manuelle par un admin avant la date de fin
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT,
  CONSTRAINT arrivals_window_check CHECK (reservation_opens_at < reservation_closes_at),
  CONSTRAINT arrivals_pickup_check CHECK (pickup_date >= (reservation_closes_at AT TIME ZONE 'Europe/Paris')::date)
);

CREATE INDEX IF NOT EXISTS arrivals_created_at_idx ON public.arrivals (created_at DESC);
-- Arrivages visibles sur le site (non clôturés)
CREATE INDEX IF NOT EXISTS arrivals_visible_idx ON public.arrivals (reservation_opens_at) WHERE closed_at IS NULL;

CREATE TABLE IF NOT EXISTS public.arrival_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrival_id UUID NOT NULL REFERENCES public.arrivals(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  -- Unité avec son poids, ex. « barquette de 500 g » (lib/arrivals/domain.ts unitLabelFor)
  unit_label TEXT NOT NULL CHECK (char_length(unit_label) BETWEEN 1 AND 30),
  -- Poids d'une barquette en grammes (NULL pour les articles créés avant)
  weight_grams INTEGER CHECK (weight_grams IS NULL OR weight_grams > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
  stock_total INTEGER NOT NULL CHECK (stock_total >= 0),
  stock_reserved INTEGER NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0),
  max_per_customer INTEGER CHECK (max_per_customer IS NULL OR max_per_customer > 0),
  position INTEGER NOT NULL DEFAULT 0,
  -- Filet de sécurité : jamais plus de réservé que de stock
  CONSTRAINT arrival_items_stock_check CHECK (stock_reserved <= stock_total)
);

-- Bases créées avant la catégorie par défaut et le poids des barquettes
ALTER TABLE public.arrivals ALTER COLUMN category SET DEFAULT 'CHICKEN';
ALTER TABLE public.arrival_items
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER CHECK (weight_grams IS NULL OR weight_grams > 0);

CREATE INDEX IF NOT EXISTS arrival_items_arrival_idx ON public.arrival_items (arrival_id, position);

CREATE TABLE IF NOT EXISTS public.arrival_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrival_id UUID NOT NULL REFERENCES public.arrivals(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'CONFIRMED'
    CHECK (status IN ('CONFIRMED', 'REMINDED', 'COLLECTED', 'CANCELLED', 'NO_SHOW')),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status_changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status_changed_by TEXT
);

-- Une seule réservation en cours par client et par arrivage
CREATE UNIQUE INDEX IF NOT EXISTS arrival_reservations_one_active_idx
  ON public.arrival_reservations (arrival_id, customer_id)
  WHERE status IN ('CONFIRMED', 'REMINDED');
CREATE INDEX IF NOT EXISTS arrival_reservations_arrival_idx
  ON public.arrival_reservations (arrival_id, created_at DESC);
CREATE INDEX IF NOT EXISTS arrival_reservations_customer_idx
  ON public.arrival_reservations (customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.arrival_reservation_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.arrival_reservations(id) ON DELETE CASCADE,
  -- NO ACTION : un article déjà réservé ne peut pas être retiré de l'arrivage.
  -- DEFERRED : vérifié à la validation, après que la cascade depuis
  -- arrival_reservations a supprimé les lignes, donc la suppression de
  -- l'arrivage entier passe (sinon la cascade sur arrival_items échoue avant).
  item_id UUID NOT NULL REFERENCES public.arrival_items(id) DEFERRABLE INITIALLY DEFERRED,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  -- Copiés au moment de la réservation : un changement de prix ne la modifie pas
  item_name TEXT NOT NULL,
  unit_label TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

-- Bases créées avant le passage en DEFERRED
ALTER TABLE public.arrival_reservation_lines
  DROP CONSTRAINT IF EXISTS arrival_reservation_lines_item_id_fkey,
  ADD CONSTRAINT arrival_reservation_lines_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES public.arrival_items(id) DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS arrival_reservation_lines_reservation_idx ON public.arrival_reservation_lines (reservation_id);
CREATE INDEX IF NOT EXISTS arrival_reservation_lines_item_idx ON public.arrival_reservation_lines (item_id);

-- Historique des changements de statut (qui, quand)
CREATE TABLE IF NOT EXISTS public.arrival_reservation_events (
  id BIGSERIAL PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.arrival_reservations(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS arrival_reservation_events_reservation_idx
  ON public.arrival_reservation_events (reservation_id, created_at);

-- RLS : l'application lit et écrit côté serveur (service role). Aucun accès direct.
ALTER TABLE public.arrivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrival_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrival_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrival_reservation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrival_reservation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can manage arrivals" ON public.arrivals;
CREATE POLICY "Only admins can manage arrivals" ON public.arrivals FOR ALL
  USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

DROP POLICY IF EXISTS "Only admins can manage arrival_items" ON public.arrival_items;
CREATE POLICY "Only admins can manage arrival_items" ON public.arrival_items FOR ALL
  USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

DROP POLICY IF EXISTS "Staff can manage arrival_reservations" ON public.arrival_reservations;
CREATE POLICY "Staff can manage arrival_reservations" ON public.arrival_reservations FOR ALL
  USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'CASHIER')));

DROP POLICY IF EXISTS "Staff can manage arrival_reservation_lines" ON public.arrival_reservation_lines;
CREATE POLICY "Staff can manage arrival_reservation_lines" ON public.arrival_reservation_lines FOR ALL
  USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'CASHIER')));

DROP POLICY IF EXISTS "Staff can read arrival_reservation_events" ON public.arrival_reservation_events;
CREATE POLICY "Staff can read arrival_reservation_events" ON public.arrival_reservation_events FOR ALL
  USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'CASHIER')));

-- -------------------------------------------------------------------------
-- arrival_reserve : crée une réservation de façon atomique.
-- p_lines : [{ "item_id": uuid, "quantity": int }, ...]
-- Les articles sont verrouillés (FOR UPDATE) dans l'ordre de leur id pour
-- éviter les interblocages ; le stock est vérifié puis décompté dans la même
-- transaction, donc deux clients ne peuvent jamais réserver la même barquette.
-- Erreurs (MESSAGE) : ARRIVAL_NOT_FOUND, RESERVATION_NOT_OPEN, RESERVATION_CLOSED,
-- ALREADY_RESERVED, ITEM_NOT_FOUND, MAX_PER_CUSTOMER, OUT_OF_STOCK (DETAIL = item id).
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arrival_reserve(p_arrival_id UUID, p_customer_id UUID, p_lines JSONB, p_actor TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_arrival public.arrivals;
  v_item public.arrival_items;
  v_line RECORD;
  v_total NUMERIC(10, 2) := 0;
  v_reservation_id UUID;
BEGIN
  -- FOR SHARE : une clôture manuelle attend la fin de cette réservation
  SELECT * INTO v_arrival FROM public.arrivals WHERE id = p_arrival_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ARRIVAL_NOT_FOUND';
  END IF;
  IF v_arrival.closed_at IS NOT NULL OR now() >= v_arrival.reservation_closes_at THEN
    RAISE EXCEPTION 'RESERVATION_CLOSED';
  END IF;
  IF now() < v_arrival.reservation_opens_at THEN
    RAISE EXCEPTION 'RESERVATION_NOT_OPEN';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.arrival_reservations
    WHERE arrival_id = p_arrival_id AND customer_id = p_customer_id AND status IN ('CONFIRMED', 'REMINDED')
  ) THEN
    RAISE EXCEPTION 'ALREADY_RESERVED';
  END IF;

  INSERT INTO public.arrival_reservations (arrival_id, customer_id, total_amount, status_changed_by)
  VALUES (p_arrival_id, p_customer_id, 0, p_actor)
  RETURNING id INTO v_reservation_id;

  FOR v_line IN
    SELECT (l->>'item_id')::UUID AS item_id, SUM((l->>'quantity')::INTEGER)::INTEGER AS quantity
    FROM jsonb_array_elements(p_lines) AS l
    GROUP BY 1
    ORDER BY 1
  LOOP
    SELECT * INTO v_item FROM public.arrival_items
    WHERE id = v_line.item_id AND arrival_id = p_arrival_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ITEM_NOT_FOUND' USING DETAIL = v_line.item_id::TEXT;
    END IF;
    IF v_line.quantity IS NULL OR v_line.quantity <= 0 THEN
      RAISE EXCEPTION 'ITEM_NOT_FOUND' USING DETAIL = v_line.item_id::TEXT;
    END IF;
    IF v_item.max_per_customer IS NOT NULL AND v_line.quantity > v_item.max_per_customer THEN
      RAISE EXCEPTION 'MAX_PER_CUSTOMER' USING DETAIL = v_item.id::TEXT;
    END IF;
    IF v_item.stock_reserved + v_line.quantity > v_item.stock_total THEN
      RAISE EXCEPTION 'OUT_OF_STOCK' USING DETAIL = v_item.id::TEXT;
    END IF;

    UPDATE public.arrival_items SET stock_reserved = stock_reserved + v_line.quantity WHERE id = v_item.id;

    INSERT INTO public.arrival_reservation_lines (reservation_id, item_id, quantity, item_name, unit_label, unit_price)
    VALUES (v_reservation_id, v_item.id, v_line.quantity, v_item.name, v_item.unit_label, v_item.unit_price);

    v_total := v_total + v_item.unit_price * v_line.quantity;
  END LOOP;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'ITEM_NOT_FOUND';
  END IF;

  UPDATE public.arrival_reservations SET total_amount = v_total WHERE id = v_reservation_id;
  INSERT INTO public.arrival_reservation_events (reservation_id, status, changed_by)
  VALUES (v_reservation_id, 'CONFIRMED', p_actor);

  RETURN v_reservation_id;
EXCEPTION
  -- Deux réservations simultanées du même client : l'index unique tranche
  WHEN unique_violation THEN
    RAISE EXCEPTION 'ALREADY_RESERVED';
END;
$$;

-- -------------------------------------------------------------------------
-- arrival_reservation_set_status : change le statut d'une réservation.
-- p_customer_id : renseigné quand c'est le client qui annule (vérifie qu'elle
-- est à lui et que l'arrivage est encore ouvert). Une annulation remet les
-- quantités en stock. Les transitions reprennent lib/arrivals/domain.ts.
-- Erreurs : RESERVATION_NOT_FOUND, INVALID_TRANSITION, RESERVATION_CLOSED.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arrival_reservation_set_status(
  p_reservation_id UUID, p_status TEXT, p_actor TEXT, p_customer_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation public.arrival_reservations;
  v_arrival public.arrivals;
  v_line RECORD;
BEGIN
  SELECT * INTO v_reservation FROM public.arrival_reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND OR (p_customer_id IS NOT NULL AND v_reservation.customer_id <> p_customer_id) THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND';
  END IF;

  IF NOT (
    (v_reservation.status = 'CONFIRMED' AND p_status IN ('REMINDED', 'COLLECTED', 'CANCELLED', 'NO_SHOW')) OR
    (v_reservation.status = 'REMINDED' AND p_status IN ('COLLECTED', 'CANCELLED', 'NO_SHOW'))
  ) THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  END IF;

  IF p_customer_id IS NOT NULL THEN
    SELECT * INTO v_arrival FROM public.arrivals WHERE id = v_reservation.arrival_id;
    IF p_status <> 'CANCELLED' OR v_arrival.closed_at IS NOT NULL OR now() >= v_arrival.reservation_closes_at THEN
      RAISE EXCEPTION 'RESERVATION_CLOSED';
    END IF;
  END IF;

  IF p_status = 'CANCELLED' THEN
    FOR v_line IN
      SELECT item_id, SUM(quantity)::INTEGER AS quantity FROM public.arrival_reservation_lines
      WHERE reservation_id = p_reservation_id GROUP BY item_id ORDER BY item_id
    LOOP
      UPDATE public.arrival_items
      SET stock_reserved = GREATEST(0, stock_reserved - v_line.quantity)
      WHERE id = v_line.item_id;
    END LOOP;
  END IF;

  UPDATE public.arrival_reservations
  SET status = p_status, status_changed_at = now(), status_changed_by = p_actor
  WHERE id = p_reservation_id;
  INSERT INTO public.arrival_reservation_events (reservation_id, status, changed_by)
  VALUES (p_reservation_id, p_status, p_actor);

  RETURN p_status;
END;
$$;

-- -------------------------------------------------------------------------
-- arrival_stats : chiffres d'un arrivage (tableau de bord admin).
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arrival_stats(p_arrival_id UUID, p_tz TEXT DEFAULT 'Europe/Paris')
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'by_status', COALESCE((
      SELECT jsonb_object_agg(status, n) FROM (
        SELECT status, COUNT(*) AS n FROM arrival_reservations WHERE arrival_id = p_arrival_id GROUP BY status
      ) s
    ), '{}'::jsonb),
    'customers', (
      SELECT COUNT(DISTINCT customer_id) FROM arrival_reservations
      WHERE arrival_id = p_arrival_id AND status <> 'CANCELLED'
    ),
    'expected_revenue', (
      SELECT COALESCE(SUM(total_amount), 0) FROM arrival_reservations
      WHERE arrival_id = p_arrival_id AND status IN ('CONFIRMED', 'REMINDED', 'COLLECTED')
    ),
    'collected_revenue', (
      SELECT COALESCE(SUM(total_amount), 0) FROM arrival_reservations
      WHERE arrival_id = p_arrival_id AND status = 'COLLECTED'
    ),
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'item_id', i.id,
        'name', i.name,
        'unit_label', i.unit_label,
        'stock_total', i.stock_total,
        'stock_reserved', i.stock_reserved,
        'collected_quantity', COALESCE((
          SELECT SUM(l.quantity) FROM arrival_reservation_lines l
          JOIN arrival_reservations r ON r.id = l.reservation_id
          WHERE l.item_id = i.id AND r.status = 'COLLECTED'
        ), 0)
      ) ORDER BY i.position, i.name)
      FROM arrival_items i WHERE i.arrival_id = p_arrival_id
    ), '[]'::jsonb),
    'daily', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('day', day, 'count', n) ORDER BY day) FROM (
        SELECT (created_at AT TIME ZONE p_tz)::date AS day, COUNT(*) AS n
        FROM arrival_reservations WHERE arrival_id = p_arrival_id GROUP BY 1
      ) d
    ), '[]'::jsonb)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.arrival_reserve(UUID, UUID, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arrival_reserve(UUID, UUID, JSONB, TEXT) TO service_role;
REVOKE EXECUTE ON FUNCTION public.arrival_reservation_set_status(UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arrival_reservation_set_status(UUID, TEXT, TEXT, UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.arrival_stats(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arrival_stats(UUID, TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
