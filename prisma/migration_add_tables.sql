-- ============================================================
-- Migration: เพิ่ม tables ที่ขาดหาย (vehicle_histories, drivers, vehicle_drivers)
-- รันใน Supabase SQL Editor หลังจาก DDL หลักแล้ว
-- ============================================================

-- 1. vehicle_histories
CREATE TABLE IF NOT EXISTS "vehicle_histories" (
  "id"                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicle_id"          UUID        NOT NULL REFERENCES "vehicles"("id"),
  "license_plate"       TEXT,
  "engine_number"       TEXT,
  "received_date"       TIMESTAMPTZ,
  "received_from"       TEXT,
  "withdrawer"          TEXT,
  "engine_cc"           TEXT,
  "horsepower"          TEXT,
  "total_quantity"      INTEGER     NOT NULL DEFAULT 0,
  "maintenance_details" TEXT,
  "created_by"          UUID        REFERENCES "users"("id"),
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_histories_vehicle_id ON "vehicle_histories"("vehicle_id");

-- 2. drivers
CREATE TABLE IF NOT EXISTS "drivers" (
  "id"           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "rank"         TEXT        NOT NULL,
  "first_name"   TEXT        NOT NULL,
  "last_name"    TEXT        NOT NULL,
  "phone"        TEXT,
  "license_type" TEXT,
  "photo_url"    TEXT,
  "status"       "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "unit_id"      UUID        REFERENCES "units"("id"),
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. vehicle_drivers
CREATE TABLE IF NOT EXISTS "vehicle_drivers" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicle_id"  UUID        NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "driver_id"   UUID        NOT NULL REFERENCES "drivers"("id") ON DELETE CASCADE,
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("vehicle_id", "driver_id")
);

-- 4. เพิ่ม rank, first_name, last_name columns ใน users (ถ้ายังไม่มี)
DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rank" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- 5. Seed data ตัวอย่าง
-- ============================================================

-- เพิ่มข้อมูล drivers ตัวอย่าง (6 คน)
INSERT INTO "drivers" ("id", "rank", "first_name", "last_name", "phone", "license_type", "status", "unit_id") VALUES
  ('A1000001-0000-4000-8000-000000000001', 'สิบเอก',    'สมศักดิ์', 'รักชาติ',    '081-234-5678', 'ท.3', 'ACTIVE', '10000001-0000-4000-8000-000000000001'),
  ('A1000001-0000-4000-8000-000000000002', 'สิบตรี',     'ณรงค์',   'เข้มแข็ง',    '082-345-6789', 'ท.2', 'ACTIVE', '10000001-0000-4000-8000-000000000002'),
  ('A1000001-0000-4000-8000-000000000003', 'จ่าสิบตรี',   'สมชาย',   'กล้าหาญ',    '083-456-7890', 'ท.3', 'ACTIVE', '10000001-0000-4000-8000-000000000001'),
  ('A1000001-0000-4000-8000-000000000004', 'สิบเอก',    'ประเสริฐ', 'มีสุข',      '084-567-8901', 'ท.2', 'ACTIVE', '10000001-0000-4000-8000-000000000003'),
  ('A1000001-0000-4000-8000-000000000005', 'จ่าสิบโท',    'วิชัย',   'ใจดี',       '085-678-9012', 'ท.3', 'ACTIVE', '10000001-0000-4000-8000-000000000004'),
  ('A1000001-0000-4000-8000-000000000006', 'สิบตรี',     'ธนวัฒน์', 'สว่าง',      '086-789-0123', 'ท.2', 'ACTIVE', '10000001-0000-4000-8000-000000000002')
ON CONFLICT ("id") DO NOTHING;

-- เพิ่ม vehicle_drivers assignments
INSERT INTO "vehicle_drivers" ("vehicle_id", "driver_id") VALUES
  ('50000001-0000-4000-8000-000000000001', 'A1000001-0000-4000-8000-000000000001'),
  ('50000001-0000-4000-8000-000000000002', 'A1000001-0000-4000-8000-000000000003'),
  ('50000001-0000-4000-8000-000000000013', 'A1000001-0000-4000-8000-000000000002'),
  ('50000001-0000-4000-8000-000000000022', 'A1000001-0000-4000-8000-000000000004'),
  ('50000001-0000-4000-8000-000000000042', 'A1000001-0000-4000-8000-000000000005'),
  ('50000001-0000-4000-8000-000000000045', 'A1000001-0000-4000-8000-000000000006')
ON CONFLICT ("vehicle_id", "driver_id") DO NOTHING;

-- เพิ่ม vehicle_histories ตัวอย่าง (5 รายการ)
INSERT INTO "vehicle_histories" ("vehicle_id", "license_plate", "engine_number", "received_date", "received_from", "withdrawer", "engine_cc", "horsepower", "total_quantity", "maintenance_details", "created_by") VALUES
  ('50000001-0000-4000-8000-000000000001', 'พล-0001', 'REO-M35-001', '2015-06-15', 'กองพันทหารราบที่ 1', 'ร้อยเอก วิเชียร เหลืองาม', '7800', '130', 1, 'ตรวจสภาพก่อนรับมอบ เปลี่ยนน้ำมันเครื่อง ไส้กรองอากาศใหม่', '30000001-0000-4000-8000-000000000001'),
  ('50000001-0000-4000-8000-000000000004', 'พล-0004', 'REO-M35-004', '2016-03-20', 'กรมทหารราบที่ 1', 'สิบเอก สมศักดิ์ รักชาติ', '7800', '130', 1, 'เปลี่ยนคลัทช์KIT ผ้าเบรกหน้าหลัง ตรวจระบบไฟฟ้า', '30000001-0000-4000-8000-000000000001'),
  ('50000001-0000-4000-8000-000000000013', 'พล-0013', 'KIA-FTS-001', '2018-09-10', 'กองร้อยซ่อมบำรุง', 'จ่าสิบตรี สมชาย กล้าหาญ', '6900', '160', 1, 'ตรวจเช็คสภาพทั่วไป ทุกระบบปกติ', '30000001-0000-4000-8000-000000000001'),
  ('50000001-0000-4000-8000-000000000022', 'พล-0022', 'KAISER-M50-001', '1968-12-01', 'หน่วยทหารสรรพาวุธ', 'พันตรี สมชาย ใจดี', '5200', '110', 1, 'ต้นแบบ M50 ตรวจเครื่องยนต์ ระบบระบายความร้อน ระบบไฟฟ้า', '30000001-0000-4000-8000-000000000001'),
  ('50000001-0000-4000-8000-000000000042', 'พล-0042', 'CHK-COLORADO-001', '2022-01-15', 'กรมทหารราบที่ 1', 'สิบตรี ณรงค์ เข้มแข็ง', '2500', '163', 1, 'กระบะ Chevrolet Colorado ตรวจสภาพทั่วไปก่อนใช้งาน', '30000001-0000-4000-8000-000000000001')
ON CONFLICT ("vehicle_id", "license_plate") DO NOTHING;

-- อัพเดท users ที่มีอยู่ให้มี rank, first_name, last_name
UPDATE "users" SET "rank" = 'พันตรี',     "first_name" = 'สมชาย',   "last_name" = 'ใจดี'        WHERE "email" = 'admin@army.mail';
UPDATE "users" SET "rank" = 'พันโท',     "first_name" = 'ประยุทธ์', "last_name" = 'ศักดิ์สิทธิ์'  WHERE "email" = 'commander@army.mail';
UPDATE "users" SET "rank" = 'ร้อยเอก',    "first_name" = 'วิเชียร',   "last_name" = 'เหลืองาม'     WHERE "email" = 'officer@army.mail';
UPDATE "users" SET "rank" = 'สิบเอก',     "first_name" = 'สมศักดิ์',  "last_name" = 'รักชาติ'      WHERE "email" = 'driver1@army.mail';
UPDATE "users" SET "rank" = 'จ่าสิบตรี',   "first_name" = 'ประสิทธิ์', "last_name" = 'กล้าหาญ'     WHERE "email" = 'mechanic1@army.mail';
UPDATE "users" SET "rank" = 'จ่าสิบโท',    "first_name" = 'มานพ',    "last_name" = 'ทรงพล'        WHERE "email" = 'headmech@army.mail';
UPDATE "users" SET "rank" = 'สิบโท',      "first_name" = 'ไพศาล',    "last_name" = 'คลังทรัพย์'    WHERE "email" = 'parts@army.mail';
UPDATE "users" SET "rank" = 'สิบตรี',      "first_name" = 'ณรงค์',    "last_name" = 'เข้มแข็ง'      WHERE "email" = 'driver2@army.mail';
UPDATE "users" SET "rank" = 'จ่าสิบเอก',   "first_name" = 'สมบูรณ์',  "last_name" = 'มีฝีมือ'      WHERE "email" = 'mechanic2@army.mail';
