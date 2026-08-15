import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
})

async function main() {
  console.log("Seeding ...")

  // ---- Units ----
  const unit1 = await prisma.unit.upsert({
    where: { id: "10000001-0000-4000-8000-000000000001" },
    update: {},
    create: { id: "10000001-0000-4000-8000-000000000001", name: "กองพันทหารราบที่ 1", description: "ร.1 พัน.1" },
  })
  const unit2 = await prisma.unit.upsert({
    where: { id: "10000001-0000-4000-8000-000000000002" },
    update: {},
    create: { id: "10000001-0000-4000-8000-000000000002", name: "กองพันทหารราบที่ 2", description: "ร.1 พัน.2" },
  })
  const unit3 = await prisma.unit.upsert({
    where: { id: "10000001-0000-4000-8000-000000000003" },
    update: {},
    create: { id: "10000001-0000-4000-8000-000000000003", name: "กองร้อยซ่อมบำรุง", description: "ร้อย.ซบ." },
  })

  // ---- Roles ----
  const roleNames = ["admin", "commander", "vehicle_officer", "driver", "mechanic", "head_mechanic", "parts_officer"]
  const roleData: Record<string, { id: string; name: string }> = {}
  for (const name of roleNames) {
    const existing = await prisma.role.findUnique({ where: { name } })
    if (existing) {
      roleData[name] = existing
    } else {
      roleData[name] = await prisma.role.create({ data: { name } })
    }
  }

  // ---- Users ----
  const hashed = await bcrypt.hash("1234", 10)
  const userSpecs = [
    { tag: "admin", email: "admin@army.mail", name: "สมชาย ใจดี", roleName: "admin", unitId: unit3.id },
    { tag: "commander", email: "commander@army.mail", name: "ประยุทธ์ ศักดิ์สิทธิ์", roleName: "commander", unitId: unit1.id },
    { tag: "officer", email: "officer@army.mail", name: "วิเชียร เหลืองาม", roleName: "vehicle_officer", unitId: unit3.id },
    { tag: "driver1", email: "driver1@army.mail", name: "สมศักดิ์ รักชาติ", roleName: "driver", unitId: unit1.id },
    { tag: "mechanic1", email: "mechanic1@army.mail", name: "ประสิทธิ์ กล้าหาญ", roleName: "mechanic", unitId: unit3.id },
    { tag: "headmech", email: "headmech@army.mail", name: "มานพ ทรงพล", roleName: "head_mechanic", unitId: unit3.id },
    { tag: "parts", email: "parts@army.mail", name: "ไพศาล คลังทรัพย์", roleName: "parts_officer", unitId: unit3.id },
    { tag: "driver2", email: "driver2@army.mail", name: "ณรงค์ เข้มแข็ง", roleName: "driver", unitId: unit2.id },
    { tag: "mechanic2", email: "mechanic2@army.mail", name: "สมบูรณ์ มีฝีมือ", roleName: "mechanic", unitId: unit3.id },
  ]
  const users: Record<string, { id: string }> = {}
  for (const s of userSpecs) {
    const existing = await prisma.user.findUnique({ where: { email: s.email } })
    if (existing) {
      users[s.tag] = existing
    } else {
      users[s.tag] = await prisma.user.create({
        data: {
          email: s.email,
          name: s.name,
          password: hashed,
          role: { connect: { id: roleData[s.roleName].id } },
          unit: { connect: { id: s.unitId } },
        },
      })
    }
  }

  // ---- Vehicle Types ----
  const vt1 = await prisma.vehicleType.upsert({
    where: { id: "20000001-0000-4000-8000-000000000001" },
    update: {},
    create: { id: "20000001-0000-4000-8000-000000000001", name: "HMMWV" },
  })
  const vt2 = await prisma.vehicleType.upsert({
    where: { id: "20000001-0000-4000-8000-000000000002" },
    update: {},
    create: { id: "20000001-0000-4000-8000-000000000002", name: "M35 2½-ton" },
  })
  const vt3 = await prisma.vehicleType.upsert({
    where: { id: "20000001-0000-4000-8000-000000000003" },
    update: {},
    create: { id: "20000001-0000-4000-8000-000000000003", name: "M1083 FMTV" },
  })
  const vt4 = await prisma.vehicleType.upsert({
    where: { id: "20000001-0000-4000-8000-000000000004" },
    update: {},
    create: { id: "20000001-0000-4000-8000-000000000004", name: "รถกระบะบรรทุก" },
  })

  // ---- Vehicles ----
  const vehicleSpecs = [
    { tag: "v1", registrationNumber: "พล-1234", fleetNumber: "H-001", brand: "AM General", model: "HMMWV M998", year: 2018, unitId: unit1.id, vehicleTypeId: vt1.id, fuelType: "Diesel", currentMileage: 45230, status: "AVAILABLE" as const },
    { tag: "v2", registrationNumber: "พล-5678", fleetNumber: "H-002", brand: "AM General", model: "HMMWV M1097", year: 2019, unitId: unit1.id, vehicleTypeId: vt1.id, fuelType: "Diesel", currentMileage: 38200, status: "IN_REPAIR" as const },
    { tag: "v3", registrationNumber: "พล-9012", fleetNumber: "M-001", brand: "REO", model: "M35 2½-ton", year: 2015, unitId: unit2.id, vehicleTypeId: vt2.id, fuelType: "Diesel", currentMileage: 89120, status: "AVAILABLE" as const },
    { tag: "v4", registrationNumber: "พล-3456", fleetNumber: "F-001", brand: "Stewart & Stevenson", model: "M1083 FMTV", year: 2020, unitId: unit1.id, vehicleTypeId: vt3.id, fuelType: "Diesel", currentMileage: 21500, status: "DUE_SOON" as const },
    { tag: "v5", registrationNumber: "พล-7890", fleetNumber: "F-002", brand: "Stewart & Stevenson", model: "M1083 FMTV", year: 2020, unitId: unit2.id, vehicleTypeId: vt3.id, fuelType: "Diesel", currentMileage: 27600, status: "AVAILABLE" as const },
    { tag: "v6", registrationNumber: "พล-2468", fleetNumber: "P-001", brand: "Isuzu", model: "D-Max 4x4", year: 2022, unitId: unit3.id, vehicleTypeId: vt4.id, fuelType: "Diesel", currentMileage: 12300, status: "IN_REPAIR" as const },
    { tag: "v7", registrationNumber: "พล-1357", fleetNumber: "H-003", brand: "AM General", model: "HMMWV M998", year: 2017, unitId: unit1.id, vehicleTypeId: vt1.id, fuelType: "Diesel", currentMileage: 62300, status: "WAITING_PARTS" as const },
    { tag: "v8", registrationNumber: "พล-8642", fleetNumber: "M-002", brand: "REO", model: "M35 2½-ton", year: 2014, unitId: unit2.id, vehicleTypeId: vt2.id, fuelType: "Diesel", currentMileage: 102400, status: "OVERDUE" as const },
    { tag: "v9", registrationNumber: "พล-9135", fleetNumber: "P-002", brand: "Toyota", model: "Hilux Revo", year: 2023, unitId: unit3.id, vehicleTypeId: vt4.id, fuelType: "Diesel", currentMileage: 8500, status: "AVAILABLE" as const },
    { tag: "v10", registrationNumber: "พล-5781", fleetNumber: "H-004", brand: "AM General", model: "HMMWV M1097", year: 2019, unitId: unit2.id, vehicleTypeId: vt1.id, fuelType: "Diesel", currentMileage: 41100, status: "AVAILABLE" as const },
  ]
  const vehicles: Record<string, { id: string }> = {}
  for (const s of vehicleSpecs) {
    const existing = await prisma.vehicle.findUnique({ where: { registrationNumber: s.registrationNumber } })
    if (existing) {
      vehicles[s.tag] = existing
    } else {
      vehicles[s.tag] = await prisma.vehicle.create({ data: s })
    }
  }

  // ---- Maintenance Plans ----
  const mp1 = await prisma.maintenancePlan.create({
    data: { name: "ตรวจตามระยะ 500 ชม.", vehicleTypeId: vt1.id, intervalMonths: 6, intervalHours: 500 },
  })
  const mp2 = await prisma.maintenancePlan.create({
    data: { name: "ตรวจตามระยะ 1,000 ชม.", vehicleTypeId: vt1.id, intervalMonths: 12, intervalHours: 1000 },
  })
  const mp3 = await prisma.maintenancePlan.create({
    data: { name: "เปลี่ยนถ่ายน้ำมันเครื่อง", vehicleTypeId: vt2.id, intervalMonths: 3, intervalMileage: 5000 },
  })

  // ---- Maintenance Schedules ----
  await prisma.maintenanceSchedule.createMany({
    data: [
      { vehicleId: vehicles.v1.id, planId: mp1.id, lastPerformedDate: new Date("2025-12-15"), nextDueDate: new Date("2026-06-15"), status: "DUE_SOON" },
      { vehicleId: vehicles.v1.id, planId: mp2.id, lastPerformedDate: new Date("2025-06-10"), nextDueDate: new Date("2026-06-10"), status: "DUE_SOON" },
      { vehicleId: vehicles.v2.id, planId: mp1.id, lastPerformedDate: new Date("2025-11-20"), nextDueDate: new Date("2026-05-20"), status: "OVERDUE" },
      { vehicleId: vehicles.v4.id, planId: mp2.id, lastPerformedDate: new Date("2025-07-01"), nextDueDate: new Date("2026-07-01"), status: "DUE_SOON" },
      { vehicleId: vehicles.v8.id, planId: mp3.id, lastPerformedDate: new Date("2025-10-05"), nextDueDate: new Date("2026-01-05"), status: "OVERDUE" },
      { vehicleId: vehicles.v3.id, planId: mp3.id, lastPerformedDate: new Date("2026-03-01"), nextDueDate: new Date("2026-06-01"), status: "PENDING" },
    ],
    skipDuplicates: true,
  })

  // ---- Part Categories ----
  const cat1 = await prisma.partCategory.create({ data: { name: "กรอง" } })
  const cat2 = await prisma.partCategory.create({ data: { name: "เบรก" } })
  const cat3 = await prisma.partCategory.create({ data: { name: "ระบบส่งกำลัง" } })
  const cat4 = await prisma.partCategory.create({ data: { name: "น้ำมัน/สารหล่อลื่น" } })
  const cat5 = await prisma.partCategory.create({ data: { name: "ระบบไฟฟ้า" } })

  // ---- Vendors ----
  const vdr1 = await prisma.vendor.create({ data: { name: "บริษัท อะไหล่ทหาร จำกัด", contactInfo: "02-123-4567" } })
  const vdr2 = await prisma.vendor.create({ data: { name: "ศูนย์อะไหล่ยานยนต์", contactInfo: "02-987-6543" } })

  // ---- Parts ----
  await prisma.part.createMany({
    data: [
      { partNumber: "FIL-001", name: "ไส้กรองน้ำมันเครื่อง HMMWV", categoryId: cat1.id, stockQuantity: 3, minimumQuantity: 10, unitMeasure: "ชิ้น", unitPrice: 450, vendorId: vdr1.id },
      { partNumber: "FIL-002", name: "ไส้กรองอากาศ HMMWV", categoryId: cat1.id, stockQuantity: 15, minimumQuantity: 10, unitMeasure: "ชิ้น", unitPrice: 320, vendorId: vdr1.id },
      { partNumber: "BRK-012", name: "ผ้าเบรกหน้า HMMWV", categoryId: cat2.id, stockQuantity: 5, minimumQuantity: 15, unitMeasure: "ชุด", unitPrice: 1200, vendorId: vdr2.id },
      { partNumber: "BRK-013", name: "ผ้าเบรกหลัง M35", categoryId: cat2.id, stockQuantity: 8, minimumQuantity: 10, unitMeasure: "ชุด", unitPrice: 1500, vendorId: vdr2.id },
      { partNumber: "BLT-008", name: "สายพานไทม์มิ่ง HMMWV", categoryId: cat3.id, stockQuantity: 2, minimumQuantity: 8, unitMeasure: "เส้น", unitPrice: 890, vendorId: vdr1.id },
      { partNumber: "OIL-001", name: "น้ำมันเครื่อง 15W-40", categoryId: cat4.id, stockQuantity: 12, minimumQuantity: 20, unitMeasure: "ลิตร", unitPrice: 180, vendorId: vdr2.id },
      { partNumber: "BAT-003", name: "แบตเตอรี่ 12V HMMWV", categoryId: cat5.id, stockQuantity: 4, minimumQuantity: 10, unitMeasure: "ลูก", unitPrice: 3500, vendorId: vdr1.id },
      { partNumber: "OIL-002", name: "น้ำมันเกียร์ ATF", categoryId: cat4.id, stockQuantity: 25, minimumQuantity: 10, unitMeasure: "ลิตร", unitPrice: 250, vendorId: vdr2.id },
      { partNumber: "LGT-001", name: "หลอดไฟหน้า HMMWV", categoryId: cat5.id, stockQuantity: 20, minimumQuantity: 10, unitMeasure: "หลอด", unitPrice: 180, vendorId: vdr1.id },
      { partNumber: "FLT-001", name: "ปั๊มน้ำมันเชื้อเพลิง M35", categoryId: cat3.id, stockQuantity: 6, minimumQuantity: 5, unitMeasure: "ชิ้น", unitPrice: 4200, vendorId: vdr2.id },
    ],
    skipDuplicates: true,
  })

  // ---- Repair Requests ----
  const rr1 = await prisma.repairRequest.create({
    data: {
      requestNumber: "RR-2026-001",
      vehicleId: vehicles.v2.id,
      requesterId: users.driver1.id,
      symptoms: "เครื่องยนต์มีเสียงดังผิดปกติ ขณะเร่งเครื่อง",
      systemCategory: "เครื่องยนต์",
      urgency: "HIGH",
      mileage: 38200,
      status: "APPROVED",
    },
  })
  const rr2 = await prisma.repairRequest.create({
    data: {
      requestNumber: "RR-2026-002",
      vehicleId: vehicles.v6.id,
      requesterId: users.driver2.id,
      symptoms: "ระบบเบรกขัดข้อง เหยียบเบรกแล้วรถไม่หยุด",
      systemCategory: "เบรก",
      urgency: "EMERGENCY",
      mileage: 12300,
      status: "APPROVED",
    },
  })
  const rr3 = await prisma.repairRequest.create({
    data: {
      requestNumber: "RR-2026-003",
      vehicleId: vehicles.v7.id,
      requesterId: users.driver1.id,
      symptoms: "เกียร์กระตุกเวลาเปลี่ยนเกียร์จาก 2→3",
      systemCategory: "เกียร์",
      urgency: "HIGH",
      mileage: 62300,
      status: "WORK_ORDER_CREATED",
    },
  })
  await prisma.repairRequest.create({
    data: {
      requestNumber: "RR-2026-004",
      vehicleId: vehicles.v5.id,
      requesterId: users.driver1.id,
      symptoms: "ระบบไฟฟ้าลัดวงจร ไฟหน้ากระพริบ",
      systemCategory: "ไฟฟ้า",
      urgency: "MEDIUM",
      mileage: 27600,
      status: "PENDING",
    },
  })
  const rr5 = await prisma.repairRequest.create({
    data: {
      requestNumber: "RR-2026-005",
      vehicleId: vehicles.v8.id,
      requesterId: users.driver2.id,
      symptoms: "ยางระเบิดขณะกำลังขับ",
      systemCategory: "ช่วงล่าง",
      urgency: "HIGH",
      mileage: 102400,
      status: "APPROVED",
    },
  })

  // ---- Work Orders ----
  await prisma.workOrder.create({
    data: {
      woNumber: "WO-2026-001",
      repairRequestId: rr1.id,
      vehicleId: vehicles.v2.id,
      mechanicId: users.mechanic1.id,
      supervisorId: users.headmech.id,
      status: "IN_PROGRESS",
      startDate: new Date("2026-06-10"),
    },
  })
  await prisma.workOrder.create({
    data: {
      woNumber: "WO-2026-002",
      repairRequestId: rr2.id,
      vehicleId: vehicles.v6.id,
      mechanicId: users.mechanic1.id,
      supervisorId: users.headmech.id,
      status: "IN_PROGRESS",
      startDate: new Date("2026-06-12"),
    },
  })
  await prisma.workOrder.create({
    data: {
      woNumber: "WO-2026-003",
      repairRequestId: rr3.id,
      vehicleId: vehicles.v7.id,
      mechanicId: users.mechanic2.id,
      supervisorId: users.headmech.id,
      status: "WAITING_PARTS",
      startDate: new Date("2026-06-08"),
      totalLaborCost: 1500,
    },
  })
  await prisma.workOrder.create({
    data: {
      woNumber: "WO-2026-004",
      repairRequestId: rr5.id,
      vehicleId: vehicles.v8.id,
      mechanicId: users.mechanic1.id,
      supervisorId: users.headmech.id,
      status: "COMPLETED",
      startDate: new Date("2026-06-05"),
      endDate: new Date("2026-06-06"),
      totalLaborCost: 800,
      totalPartsCost: 4500,
    },
  })
  await prisma.workOrder.create({
    data: {
      woNumber: "WO-2026-005",
      vehicleId: vehicles.v1.id,
      mechanicId: users.mechanic2.id,
      supervisorId: users.headmech.id,
      status: "OPEN",
      startDate: new Date("2026-06-14"),
    },
  })

  // ---- Notifications ----
  await prisma.notification.create({
    data: { userId: users.headmech.id, title: "งานซ่อมใหม่", message: "WO-2026-005 ถูกสร้างใหม่ สำหรับรถ พล-1234", type: "info" },
  })
  await prisma.notification.create({
    data: { userId: users.admin.id, title: "อะไหล่ใกล้หมด", message: "ไส้กรองน้ำมันเครื่อง HMMWV คงเหลือ 3 ชิ้น (ขั้นต่ำ 10)", type: "warning" },
  })

  console.log("Seed complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
