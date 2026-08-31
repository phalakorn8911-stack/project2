-- ============================================================
-- Smart Army Vehicle Maintenance Dashboard — DDL for PostgreSQL
-- column names เป็น camelCase เพื่อให้ตรงกับ Prisma schema
-- รันซ้ำได้ (idempotent)
-- ============================================================

-- ============================================================
-- 1. Extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. Enums
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "VehicleStatus" AS ENUM (
    'AVAILABLE', 'IN_USE', 'DUE_SOON', 'OVERDUE',
    'IN_REPAIR', 'WAITING_PARTS', 'OUT_OF_SERVICE', 'RETIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReadingType" AS ENUM ('MILEAGE', 'HOURS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InspectionResult" AS ENUM ('PASS', 'MINOR_ISSUES', 'FAIL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PassFail" AS ENUM ('PASS', 'FAIL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'DUE_SOON', 'OVERDUE', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RepairRequestStatus" AS ENUM (
    'PENDING', 'ACKNOWLEDGED', 'APPROVED', 'WORK_ORDER_CREATED', 'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkOrderStatus" AS ENUM (
    'OPEN', 'PENDING_APPROVAL', 'ASSIGNED', 'DIAGNOSING',
    'WAITING_PARTS', 'IN_PROGRESS', 'READY_FOR_QC',
    'COMPLETED', 'CLOSED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. Tables
-- ============================================================
CREATE TABLE IF NOT EXISTS "units" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"        TEXT NOT NULL,
  "description" TEXT
);

CREATE TABLE IF NOT EXISTS "roles" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"        TEXT NOT NULL UNIQUE,
  "description" TEXT
);

CREATE TABLE IF NOT EXISTS "users" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"      TEXT        NOT NULL UNIQUE,
  "password"   TEXT        NOT NULL,
  "name"       TEXT        NOT NULL,
  "rank"       TEXT,
  "first_name" TEXT,
  "last_name"  TEXT,
  "roleId"     UUID        NOT NULL REFERENCES "roles"("id"),
  "unitId"     UUID        REFERENCES "units"("id"),
  "status"     "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON "users"("roleId");
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON "users"("unitId");

CREATE TABLE IF NOT EXISTS "permissions" (
  "id"     UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  "roleId" UUID   NOT NULL REFERENCES "roles"("id"),
  "module" TEXT   NOT NULL,
  "action" TEXT   NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON "permissions"("roleId");

CREATE TABLE IF NOT EXISTS "vehicle_types" (
  "id"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "vehicles" (
  "id"                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  "registrationNumber"  TEXT            NOT NULL UNIQUE,
  "fleetNumber"         TEXT            UNIQUE,
  "vin"                 TEXT            UNIQUE,
  "engineNumber"        TEXT            UNIQUE,
  "vehicleTypeId"       UUID            NOT NULL REFERENCES "vehicle_types"("id"),
  "brand"               TEXT            NOT NULL,
  "model"               TEXT            NOT NULL,
  "year"                INTEGER         NOT NULL,
  "unitId"              UUID            NOT NULL REFERENCES "units"("id"),
  "fuelType"            TEXT            NOT NULL,
  "currentMileage"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "engineHours"         DOUBLE PRECISION DEFAULT 0,
  "status"              "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE'
);

CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type_id ON "vehicles"("vehicleTypeId");
CREATE INDEX IF NOT EXISTS idx_vehicles_unit_id ON "vehicles"("unitId");
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON "vehicles"("status");

CREATE TABLE IF NOT EXISTS "vehicle_documents" (
  "id"           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId"    UUID        NOT NULL REFERENCES "vehicles"("id"),
  "documentType" TEXT        NOT NULL,
  "fileUrl"      TEXT        NOT NULL,
  "expiryDate"   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON "vehicle_documents"("vehicleId");

CREATE TABLE IF NOT EXISTS "vehicle_photos" (
  "id"        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId" UUID    NOT NULL REFERENCES "vehicles"("id"),
  "photoUrl"  TEXT    NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vehicle_id ON "vehicle_photos"("vehicleId");

CREATE TABLE IF NOT EXISTS "vehicle_readings" (
  "id"           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId"    UUID            NOT NULL REFERENCES "vehicles"("id"),
  "readingValue" DOUBLE PRECISION NOT NULL,
  "readingType"  "ReadingType"   NOT NULL,
  "recordedAt"   TIMESTAMPTZ     NOT NULL DEFAULT now(),
  "recordedById" UUID            NOT NULL REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS idx_vehicle_readings_vehicle_id ON "vehicle_readings"("vehicleId");
CREATE INDEX IF NOT EXISTS idx_vehicle_readings_recorded_by_id ON "vehicle_readings"("recordedById");

CREATE TABLE IF NOT EXISTS "maintenance_plans" (
  "id"              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"            TEXT            NOT NULL,
  "vehicleTypeId"   UUID            NOT NULL REFERENCES "vehicle_types"("id"),
  "intervalMonths"  INTEGER,
  "intervalMileage" DOUBLE PRECISION,
  "intervalHours"   DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS idx_maintenance_plans_vehicle_type_id ON "maintenance_plans"("vehicleTypeId");

CREATE TABLE IF NOT EXISTS "maintenance_schedules" (
  "id"                   UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId"            UUID               NOT NULL REFERENCES "vehicles"("id"),
  "planId"               UUID               NOT NULL REFERENCES "maintenance_plans"("id"),
  "lastPerformedDate"    TIMESTAMPTZ,
  "lastPerformedMileage" DOUBLE PRECISION,
  "nextDueDate"          TIMESTAMPTZ,
  "nextDueMileage"       DOUBLE PRECISION,
  "status"               "MaintenanceStatus" NOT NULL DEFAULT 'PENDING'
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_vehicle_id ON "maintenance_schedules"("vehicleId");
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_plan_id ON "maintenance_schedules"("planId");
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_status ON "maintenance_schedules"("status");

CREATE TABLE IF NOT EXISTS "repair_requests" (
  "id"             UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  "requestNumber"  TEXT                 NOT NULL UNIQUE,
  "vehicleId"      UUID                 NOT NULL REFERENCES "vehicles"("id"),
  "requesterId"    UUID                 NOT NULL REFERENCES "users"("id"),
  "symptoms"       TEXT                 NOT NULL,
  "systemCategory" TEXT                 NOT NULL,
  "urgency"        "UrgencyLevel"       NOT NULL DEFAULT 'MEDIUM',
  "mileage"        DOUBLE PRECISION     NOT NULL,
  "status"         "RepairRequestStatus" NOT NULL DEFAULT 'PENDING',
  "photoUrl"       TEXT
);

CREATE INDEX IF NOT EXISTS idx_repair_requests_vehicle_id ON "repair_requests"("vehicleId");
CREATE INDEX IF NOT EXISTS idx_repair_requests_requester_id ON "repair_requests"("requesterId");
CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON "repair_requests"("status");

CREATE TABLE IF NOT EXISTS "work_orders" (
  "id"              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  "woNumber"        TEXT              NOT NULL UNIQUE,
  "repairRequestId" UUID              UNIQUE REFERENCES "repair_requests"("id"),
  "vehicleId"       UUID              NOT NULL REFERENCES "vehicles"("id"),
  "mechanicId"      UUID              REFERENCES "users"("id"),
  "supervisorId"    UUID              NOT NULL REFERENCES "users"("id"),
  "status"          "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
  "startDate"       TIMESTAMPTZ,
  "endDate"         TIMESTAMPTZ,
  "totalLaborCost"  DOUBLE PRECISION  NOT NULL DEFAULT 0,
  "totalPartsCost"  DOUBLE PRECISION  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle_id ON "work_orders"("vehicleId");
CREATE INDEX IF NOT EXISTS idx_work_orders_mechanic_id ON "work_orders"("mechanicId");
CREATE INDEX IF NOT EXISTS idx_work_orders_supervisor_id ON "work_orders"("supervisorId");
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON "work_orders"("status");

CREATE TABLE IF NOT EXISTS "work_order_tasks" (
  "id"              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  "workOrderId"     UUID            NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
  "taskDescription" TEXT            NOT NULL,
  "laborHours"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cost"            DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_work_order_tasks_work_order_id ON "work_order_tasks"("workOrderId");

CREATE TABLE IF NOT EXISTS "part_categories" (
  "id"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "vendors" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"        TEXT NOT NULL,
  "contactInfo" TEXT
);

CREATE TABLE IF NOT EXISTS "parts" (
  "id"              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  "partNumber"      TEXT            NOT NULL UNIQUE,
  "name"            TEXT            NOT NULL,
  "categoryId"      UUID            NOT NULL REFERENCES "part_categories"("id"),
  "stockQuantity"   INTEGER         NOT NULL DEFAULT 0,
  "minimumQuantity" INTEGER         NOT NULL DEFAULT 0,
  "unitMeasure"     TEXT            NOT NULL,
  "unitPrice"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "vendorId"        UUID            REFERENCES "vendors"("id")
);

CREATE INDEX IF NOT EXISTS idx_parts_category_id ON "parts"("categoryId");
CREATE INDEX IF NOT EXISTS idx_parts_vendor_id ON "parts"("vendorId");

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id"             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  "partId"         UUID           NOT NULL REFERENCES "parts"("id"),
  "movementType"   "MovementType" NOT NULL,
  "quantity"       INTEGER        NOT NULL,
  "referenceId"    TEXT,
  "performedById"  UUID           NOT NULL REFERENCES "users"("id"),
  "date"           TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_part_id ON "stock_movements"("partId");
CREATE INDEX IF NOT EXISTS idx_stock_movements_performed_by_id ON "stock_movements"("performedById");

CREATE TABLE IF NOT EXISTS "work_order_parts" (
  "id"          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  "workOrderId" UUID            NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
  "partId"      UUID            NOT NULL REFERENCES "parts"("id"),
  "quantity"    INTEGER         NOT NULL,
  "unitPrice"   DOUBLE PRECISION NOT NULL,
  "totalPrice"  DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_work_order_parts_work_order_id ON "work_order_parts"("workOrderId");
CREATE INDEX IF NOT EXISTS idx_work_order_parts_part_id ON "work_order_parts"("partId");

CREATE TABLE IF NOT EXISTS "inspection_checklists" (
  "id"             UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId"      UUID               NOT NULL REFERENCES "vehicles"("id"),
  "inspectorId"    UUID               NOT NULL REFERENCES "users"("id"),
  "inspectionDate" TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "mileage"        DOUBLE PRECISION   NOT NULL,
  "result"         "InspectionResult" NOT NULL,
  "remarks"        TEXT
);

CREATE INDEX IF NOT EXISTS idx_inspection_checklists_vehicle_id ON "inspection_checklists"("vehicleId");
CREATE INDEX IF NOT EXISTS idx_inspection_checklists_inspector_id ON "inspection_checklists"("inspectorId");

CREATE TABLE IF NOT EXISTS "inspection_items" (
  "id"           UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  "checklistId"  UUID       NOT NULL REFERENCES "inspection_checklists"("id") ON DELETE CASCADE,
  "itemName"     TEXT       NOT NULL,
  "status"       "PassFail" NOT NULL,
  "remarks"      TEXT,
  "photoUrl"     TEXT
);

CREATE INDEX IF NOT EXISTS idx_inspection_items_checklist_id ON "inspection_items"("checklistId");

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID        NOT NULL,
  "title"     TEXT        NOT NULL,
  "message"   TEXT        NOT NULL,
  "type"      TEXT        NOT NULL,
  "isRead"    BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "notifications"("userId");

CREATE TABLE IF NOT EXISTS "attachments" (
  "id"           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "entityType"   TEXT        NOT NULL,
  "entityId"     UUID        NOT NULL,
  "fileUrl"      TEXT        NOT NULL,
  "fileName"     TEXT        NOT NULL,
  "uploadedById" UUID        NOT NULL REFERENCES "users"("id"),
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON "attachments"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by_id ON "attachments"("uploadedById");

CREATE TABLE IF NOT EXISTS "ai_logs" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID        NOT NULL REFERENCES "users"("id"),
  "action"    TEXT        NOT NULL,
  "prompt"    TEXT        NOT NULL,
  "response"  TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON "ai_logs"("userId");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"     UUID        NOT NULL REFERENCES "users"("id"),
  "action"     TEXT        NOT NULL,
  "entityType" TEXT        NOT NULL,
  "entityId"   UUID        NOT NULL,
  "oldValues"  JSONB,
  "newValues"  JSONB,
  "ipAddress"  TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON "audit_logs"("entityType", "entityId");

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

CREATE TABLE IF NOT EXISTS "drivers" (
  "id"          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  "rank"        TEXT    NOT NULL,
  "first_name"  TEXT    NOT NULL,
  "last_name"   TEXT    NOT NULL,
  "phone"       TEXT,
  "license_type" TEXT,
  "photo_url"   TEXT,
  "status"      "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "unit_id"     UUID    REFERENCES "units"("id"),
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "vehicle_drivers" (
  "id"          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicle_id"  UUID        NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "driver_id"   UUID        NOT NULL REFERENCES "drivers"("id") ON DELETE CASCADE,
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("vehicle_id", "driver_id")
);

-- ============================================================
-- 4. Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at') THEN
    CREATE TRIGGER set_users_updated_at
      BEFORE UPDATE ON "users"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- 5. Seed Data
-- ============================================================
INSERT INTO "roles" ("id", "name", "description") VALUES
  (gen_random_uuid(), 'admin',             'ผู้ดูแลระบบ - สิทธิ์สูงสุด'),
  (gen_random_uuid(), 'commander',         'ผู้บังคับบัญชา - ดูรายงานและอนุมัติ'),
  (gen_random_uuid(), 'vehicle_officer',   'เจ้าหน้าที่ยานยนต์ - จัดการทะเบียนรถ'),
  (gen_random_uuid(), 'driver',            'พลขับ - แจ้งซ่อมและบันทึกข้อมูล'),
  (gen_random_uuid(), 'mechanic',          'ช่างซ่อม - รับงานซ่อม'),
  (gen_random_uuid(), 'head_mechanic',     'หัวหน้าช่าง - ดูแลงานซ่อม'),
  (gen_random_uuid(), 'parts_officer',     'เจ้าหน้าที่คลังอะไหล่ - จัดการอะไหล่')
ON CONFLICT ("name") DO NOTHING;
