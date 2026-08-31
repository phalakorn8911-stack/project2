-- ============================================================
-- รันไฟล์นี้ใน Supabase SQL Editor ก่อน seed.sql
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'vehicles' AND c.conkey IS NOT NULL AND array_length(c.conkey, 1) = 1 AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum = c.conkey[1] AND a.attname = 'registrationNumber' AND c.contype = 'u')) THEN
    ALTER TABLE "vehicles" ADD CONSTRAINT vehicles_registrationNumber_unique UNIQUE ("registrationNumber");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'parts' AND c.conkey IS NOT NULL AND array_length(c.conkey, 1) = 1 AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum = c.conkey[1] AND a.attname = 'partNumber' AND c.contype = 'u')) THEN
    ALTER TABLE "parts" ADD CONSTRAINT parts_partNumber_unique UNIQUE ("partNumber");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'repair_requests' AND c.conkey IS NOT NULL AND array_length(c.conkey, 1) = 1 AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum = c.conkey[1] AND a.attname = 'requestNumber' AND c.contype = 'u')) THEN
    ALTER TABLE "repair_requests" ADD CONSTRAINT repair_requests_requestNumber_unique UNIQUE ("requestNumber");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'work_orders' AND c.conkey IS NOT NULL AND array_length(c.conkey, 1) = 1 AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attnum = c.conkey[1] AND a.attname = 'woNumber' AND c.contype = 'u')) THEN
    ALTER TABLE "work_orders" ADD CONSTRAINT work_orders_woNumber_unique UNIQUE ("woNumber");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'vehicle_drivers' AND c.contype = 'u') THEN
    ALTER TABLE "vehicle_drivers" ADD CONSTRAINT vehicle_drivers_vehicle_id_driver_id_unique UNIQUE ("vehicle_id", "driver_id");
  END IF;
END $$;
