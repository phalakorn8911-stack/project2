-- =============================================
-- เปลี่ยน roles จาก 7 เป็น 3 บทบาท
-- 1. admin = ผู้ดูแลระบบ/ผู้บังคับบัญชา (เข้าดู แก้ไข สั่งการได้ทั้งหมด)
-- 2. mechanic = ช่างซ่อม (แก้ไขงานช่าง, admin เข้าแก้ไขข้อมูลได้)
-- 3. driver = พลขับ (เข้าส่วนพลขับ, แจ้งเสีย, admin เข้าแก้ไขข้อมูลได้)
-- =============================================

-- 1) อัพเดท users ที่ commander/vehicle_officer/head_mechanic ให้เป็น admin
UPDATE users SET "roleId" = '20000001-0000-4000-8000-000000000001'
WHERE "roleId" IN (
  '20000001-0000-4000-8000-000000000002',  -- commander
  '20000001-0000-4000-8000-000000000003',  -- vehicle_officer
  '20000001-0000-4000-8000-000000000006'   -- head_mechanic
);

-- 2) อัพเดท users ที่ parts_officer ให้เป็น mechanic
UPDATE users SET "roleId" = '20000001-0000-4000-8000-000000000005'
WHERE "roleId" = '20000001-0000-4000-8000-000000000007';  -- parts_officer

-- 3) ลบ permissions เก่าทิ้ง
DELETE FROM permissions WHERE "roleId" IN (
  '20000001-0000-4000-8000-000000000002',
  '20000001-0000-4000-8000-000000000003',
  '20000001-0000-4000-8000-000000000006',
  '20000001-0000-4000-8000-000000000007'
);

-- 4) ลบ roles เก่าที่ไม่ใช้แล้ว
DELETE FROM roles WHERE name IN ('commander', 'vehicle_officer', 'head_mechanic', 'parts_officer');

-- 5) อัพเดท descriptions ของ roles ที่เหลือ
UPDATE roles SET description = 'ผู้ดูแลระบบ/ผู้บังคับบัญชา - เข้าดู แก้ไข และสั่งการได้ทั้งหมดของระบบ' WHERE name = 'admin';
UPDATE roles SET description = 'ช่างซ่อม - เข้าระบบ แก้ไขงานในส่วนของช่าง' WHERE name = 'mechanic';
UPDATE roles SET description = 'พลขับ - เข้าส่วนพลขับ แจ้งอาการเสียของรถให้ช่างซ่อม' WHERE name = 'driver';

-- 6) เพิ่ม permissions สำหรับ admin (ทุก module + ทุก action)
INSERT INTO permissions ("id", "roleId", "module", "action")
SELECT gen_random_uuid(), r.id, m.module, a.action
FROM roles r
CROSS JOIN (VALUES ('dashboard'),('vehicles'),('vehicle-types'),('units'),('drivers'),('maintenance-plans'),('work-orders'),('parts'),('reports'),('ai-assistant'),('users'),('settings'),('notifications')) AS m(module)
CROSS JOIN (VALUES ('view'),('create'),('edit'),('delete')) AS a(action)
WHERE r.name = 'admin';

-- 7) เพิ่ม permissions สำหรับ mechanic
INSERT INTO permissions ("id", "roleId", "module", "action")
SELECT gen_random_uuid(), r.id, m.module, a.action
FROM roles r
CROSS JOIN (VALUES ('dashboard'),('vehicles'),('work-orders'),('parts'),('maintenance-plans'),('reports'),('ai-assistant'),('notifications')) AS m(module)
CROSS JOIN (VALUES ('view'),('edit')) AS a(action)
WHERE r.name = 'mechanic'
AND NOT EXISTS (SELECT 1 FROM permissions p WHERE p."roleId" = r.id AND p.module = m.module AND p.action = a.action);

-- 8) เพิ่ม permissions สำหรับ driver
INSERT INTO permissions ("id", "roleId", "module", "action")
SELECT gen_random_uuid(), r.id, m.module, a.action
FROM roles r
CROSS JOIN (VALUES ('dashboard'),('vehicles'),('drivers'),('ai-assistant'),('notifications')) AS m(module)
CROSS JOIN (VALUES ('view'),('create'),('edit')) AS a(action)
WHERE r.name = 'driver'
AND NOT EXISTS (SELECT 1 FROM permissions p WHERE p."roleId" = r.id AND p.module = m.module AND p.action = a.action);

-- 9) ตรวจสอบผลลัพธ์
SELECT r.name as role, r.description, COUNT(u.id) as user_count
FROM roles r
LEFT JOIN users u ON u."roleId" = r.id
GROUP BY r.name, r.description
ORDER BY r.name;
