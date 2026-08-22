-- ============================================
-- DDL: Complete Schema for Supabase
-- Generated from Prisma schema
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'DUE_SOON', 'OVERDUE', 'IN_REPAIR', 'WAITING_PARTS', 'OUT_OF_SERVICE', 'RETIRED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReadingType" AS ENUM ('MILEAGE', 'HOURS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InspectionResult" AS ENUM ('PASS', 'MINOR_ISSUES', 'FAIL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PassFail" AS ENUM ('PASS', 'FAIL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'DUE_SOON', 'OVERDUE', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RepairRequestStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'APPROVED', 'WORK_ORDER_CREATED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkOrderStatus" AS ENUM ('OPEN', 'PENDING_APPROVAL', 'ASSIGNED', 'DIAGNOSING', 'WAITING_PARTS', 'IN_PROGRESS', 'READY_FOR_QC', 'COMPLETED', 'CLOSED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLES (in dependency order)
-- ============================================

-- 1. roles
CREATE TABLE IF NOT EXISTS "roles" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 2. permissions
CREATE TABLE IF NOT EXISTS "permissions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "roleId" UUID NOT NULL REFERENCES "roles"(id),
  module TEXT NOT NULL,
  action TEXT NOT NULL
);

-- 3. units
CREATE TABLE IF NOT EXISTS "units" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT
);

-- 4. users
CREATE TABLE IF NOT EXISTS "users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  rank TEXT,
  first_name TEXT,
  last_name TEXT,
  "roleId" UUID NOT NULL REFERENCES "roles"(id),
  "unitId" UUID REFERENCES "units"(id),
  status "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 5. vehicle_types
CREATE TABLE IF NOT EXISTS "vehicle_types" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  fuel_type TEXT,
  weight TEXT,
  seating_capacity INT,
  engine_spec TEXT
);

-- 6. vehicles
CREATE TABLE IF NOT EXISTS "vehicles" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "registrationNumber" TEXT UNIQUE NOT NULL,
  "fleetNumber" TEXT UNIQUE,
  vin TEXT UNIQUE,
  "engineNumber" TEXT UNIQUE,
  "vehicleTypeId" UUID NOT NULL REFERENCES "vehicle_types"(id),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  "unitId" UUID NOT NULL REFERENCES "units"(id),
  "fuelType" TEXT NOT NULL,
  "currentMileage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "engineHours" DOUBLE PRECISION DEFAULT 0,
  status "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE'
);

-- 7. drivers
CREATE TABLE IF NOT EXISTS "drivers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo_url TEXT
);

-- 8. vehicle_drivers
CREATE TABLE IF NOT EXISTS "vehicle_drivers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES "vehicles"(id),
  driver_id UUID NOT NULL REFERENCES "drivers"(id),
  UNIQUE(vehicle_id, driver_id)
);

-- 9. vehicle_documents
CREATE TABLE IF NOT EXISTS "vehicle_documents" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId" UUID NOT NULL REFERENCES "vehicles"(id),
  "documentType" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "expiryDate" TIMESTAMP
);

-- 10. vehicle_photos
CREATE TABLE IF NOT EXISTS "vehicle_photos" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId" UUID NOT NULL REFERENCES "vehicles"(id),
  "photoUrl" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false
);

-- 11. vehicle_readings
CREATE TABLE IF NOT EXISTS "vehicle_readings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId" UUID NOT NULL REFERENCES "vehicles"(id),
  "readingValue" DOUBLE PRECISION NOT NULL,
  "readingType" "ReadingType" NOT NULL,
  "recordedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "recordedById" UUID NOT NULL REFERENCES "users"(id)
);

-- 12. inspection_checklists
CREATE TABLE IF NOT EXISTS "inspection_checklists" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId" UUID NOT NULL REFERENCES "vehicles"(id),
  "inspectorId" UUID NOT NULL REFERENCES "users"(id),
  "inspectionDate" TIMESTAMP NOT NULL DEFAULT now(),
  mileage DOUBLE PRECISION NOT NULL,
  result "InspectionResult" NOT NULL,
  remarks TEXT
);

-- 13. inspection_items
CREATE TABLE IF NOT EXISTS "inspection_items" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "checklistId" UUID NOT NULL REFERENCES "inspection_checklists"(id) ON DELETE CASCADE,
  "itemName" TEXT NOT NULL,
  status "PassFail" NOT NULL,
  remarks TEXT,
  "photoUrl" TEXT
);

-- 14. maintenance_plans
CREATE TABLE IF NOT EXISTS "maintenance_plans" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "vehicleTypeId" UUID NOT NULL REFERENCES "vehicle_types"(id),
  "intervalMonths" INT,
  "intervalMileage" DOUBLE PRECISION,
  "intervalHours" DOUBLE PRECISION
);

-- 15. maintenance_schedules
CREATE TABLE IF NOT EXISTS "maintenance_schedules" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId" UUID NOT NULL REFERENCES "vehicles"(id),
  "planId" UUID NOT NULL REFERENCES "maintenance_plans"(id),
  "lastPerformedDate" TIMESTAMP,
  "lastPerformedMileage" DOUBLE PRECISION,
  "nextDueDate" TIMESTAMP,
  "nextDueMileage" DOUBLE PRECISION,
  status "MaintenanceStatus" NOT NULL DEFAULT 'PENDING'
);

-- 16. repair_requests
CREATE TABLE IF NOT EXISTS "repair_requests" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "requestNumber" TEXT UNIQUE NOT NULL,
  "vehicleId" UUID NOT NULL REFERENCES "vehicles"(id),
  "requesterId" UUID NOT NULL REFERENCES "users"(id),
  symptoms TEXT NOT NULL,
  "systemCategory" TEXT NOT NULL,
  urgency "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
  mileage DOUBLE PRECISION NOT NULL,
  status "RepairRequestStatus" NOT NULL DEFAULT 'PENDING',
  "photoUrl" TEXT
);

-- 17. work_orders
CREATE TABLE IF NOT EXISTS "work_orders" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "woNumber" TEXT UNIQUE NOT NULL,
  "repairRequestId" UUID UNIQUE REFERENCES "repair_requests"(id),
  "vehicleId" UUID NOT NULL REFERENCES "vehicles"(id),
  "mechanicId" UUID REFERENCES "users"(id),
  "supervisorId" UUID NOT NULL REFERENCES "users"(id),
  status "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "totalLaborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalPartsCost" DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- 18. work_order_tasks
CREATE TABLE IF NOT EXISTS "work_order_tasks" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workOrderId" UUID NOT NULL REFERENCES "work_orders"(id) ON DELETE CASCADE,
  "taskDescription" TEXT NOT NULL,
  "laborHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  cost DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- 19. part_categories
CREATE TABLE IF NOT EXISTS "part_categories" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- 20. vendors
CREATE TABLE IF NOT EXISTS "vendors" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "contactInfo" TEXT
);

-- 21. parts
CREATE TABLE IF NOT EXISTS "parts" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "partNumber" TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  "categoryId" UUID NOT NULL REFERENCES "part_categories"(id),
  "stockQuantity" INT NOT NULL DEFAULT 0,
  "minimumQuantity" INT NOT NULL DEFAULT 0,
  "unitMeasure" TEXT NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "vendorId" UUID REFERENCES "vendors"(id)
);

-- 22. stock_movements
CREATE TABLE IF NOT EXISTS "stock_movements" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "partId" UUID NOT NULL REFERENCES "parts"(id),
  "movementType" "MovementType" NOT NULL,
  quantity INT NOT NULL,
  "referenceId" TEXT,
  "performedById" UUID NOT NULL REFERENCES "users"(id),
  date TIMESTAMP NOT NULL DEFAULT now()
);

-- 23. work_order_parts
CREATE TABLE IF NOT EXISTS "work_order_parts" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workOrderId" UUID NOT NULL REFERENCES "work_orders"(id) ON DELETE CASCADE,
  "partId" UUID NOT NULL REFERENCES "parts"(id),
  quantity INT NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL
);

-- 24. notifications
CREATE TABLE IF NOT EXISTS "notifications" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 25. attachments
CREATE TABLE IF NOT EXISTS "attachments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entityType" TEXT NOT NULL,
  "entityId" UUID NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "uploadedById" UUID NOT NULL REFERENCES "users"(id),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 26. ai_logs
CREATE TABLE IF NOT EXISTS "ai_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"(id),
  action TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 27. audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"(id),
  action TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" UUID NOT NULL,
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
