# 📁 Project Structure

## Smart Army Vehicle Maintenance Dashboard

โครงสร้างโปรเจกต์ Next.js (App Router) ที่ออกแบบไว้สำหรับการขยายตัวและง่ายต่อการดูแลรักษา (Scalable & Maintainable)

---

## 1. Directory Tree

```text
smart-vehicle-maintenance/
├── .env.local                  # Environment variables สำหรับ Local
├── .env.example                # ตัวอย่าง Environment variables
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies & Scripts
├── prisma/                     # Database Schema & Migrations
│   ├── schema.prisma           # Prisma Schema
│   ├── seed.ts                 # Script สำหรับสร้างข้อมูลเริ่มต้น (Seed Data)
│   └── migrations/             # ประวัติการแก้ไข Database
├── public/                     # Static files
│   └── images/                 # รูปภาพพื้นฐาน เช่น โลโก้, Placeholder
├── src/                        # Source Code ทั้งหมด
│   ├── app/                    # Next.js App Router (Pages, Layouts, API)
│   │   ├── layout.tsx          # Root Layout (รวม Providers, Fonts)
│   │   ├── page.tsx            # Landing Page หรือ Redirect ไป Login
│   │   ├── (auth)/             # Route Group สำหรับ Authentication
│   │   │   ├── login/          # หน้า Login
│   │   │   └── layout.tsx      # Auth Layout
│   │   ├── (dashboard)/        # Route Group สำหรับระบบหลัก
│   │   │   ├── layout.tsx      # Dashboard Layout (Sidebar, Header)
│   │   │   ├── dashboard/      # หน้า Dashboard สรุปข้อมูล
│   │   │   ├── vehicles/       # หน้าจัดการยานพาหนะ (List)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/        # หน้าเพิ่มรถ
│   │   │   │   ├── [id]/       # หน้า Vehicle Detail
│   │   │   │   └── [id]/edit/  # หน้าแก้ไขรถ
│   │   │   ├── vehicle-types/  # จัดการประเภทรถ
│   │   │   ├── inspections/    # ตรวจสภาพรถ
│   │   │   ├── maintenance-plans/ # แผนซ่อมบำรุง
│   │   │   ├── maintenance-schedules/ # รอบซ่อม
│   │   │   ├── repair-requests/# แจ้งซ่อม
│   │   │   ├── work-orders/    # ใบงานซ่อม (Kanban)
│   │   │   ├── parts/          # คลังอะไหล่
│   │   │   ├── stock-movements/# ประวัติเข้า/ออกสต็อก
│   │   │   ├── reports/        # ระบบรายงาน
│   │   │   ├── ai-assistant/   # หน้าเรียกใช้ AI (Optional)
│   │   │   ├── notifications/  # ศูนย์แจ้งเตือน
│   │   │   ├── users/          # จัดการผู้ใช้งาน (Admin only)
│   │   │   ├── settings/       # ตั้งค่าระบบ
│   │   │   └── audit-logs/     # ประวัติการทำงานในระบบ
│   │   └── api/                # Route Handlers (API Endpoints)
│   │       ├── auth/           # NextAuth endpoints
│   │       ├── ai/             # เชื่อมต่อ Ollama
│   │       └── ...             # APIs อื่นๆ ที่เปิดให้ภายนอกเรียกใช้
│   ├── components/             # React Components (แบ่งย่อยตาม Feature)
│   │   ├── ui/                 # Core Components (shadcn/ui เช่น Button, Input)
│   │   ├── layout/             # Layout Components (Sidebar.tsx, Header.tsx)
│   │   ├── dashboard/          # Components ของหน้า Dashboard
│   │   ├── vehicles/           # Components ของรถ (เช่น VehicleCard)
│   │   ├── shared/             # Components ที่ใช้ซ้ำหลายที่ (เช่น DataTable, Modal)
│   │   └── ...                 
│   ├── lib/                    # Configuration & Utilities
│   │   ├── prisma.ts           # Prisma Client Instance
│   │   ├── auth.ts             # NextAuth.js Configuration
│   │   ├── utils.ts            # Helper functions ทั่วไป (เช่น ฟังก์ชัน `cn` ของ Tailwind)
│   │   └── validations/        # Zod Schemas สำหรับ Validate Form
│   ├── services/               # Business Logic Layer (ไม่ต้องยึดติดกับ HTTP)
│   │   ├── vehicle.service.ts
│   │   ├── repair.service.ts
│   │   ├── ai.service.ts
│   │   └── ...
│   ├── actions/                # Next.js Server Actions (Mutation data)
│   │   ├── auth.actions.ts
│   │   ├── vehicle.actions.ts
│   │   └── ...
│   ├── types/                  # TypeScript Types & Interfaces
│   │   ├── index.ts
│   │   ├── vehicle.types.ts
│   │   └── ...
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useVehicles.ts
│   │   ├── usePermissions.ts
│   │   └── ...
│   └── config/                 # System Configurations
│       ├── menu.ts             # นิยาม Sidebar Menu
│       ├── permissions.ts      # นิยามสิทธิ์ RBAC
│       └── constants.ts        # ตัวแปรคงที่ (เช่น สถานะต่างๆ)
└── docs/                       # เอกสาร Project (PRD, Specs)
```

---

## 2. Directory Guidelines (ข้อกำหนดการเขียนโค้ด)

- `components/ui/`: อนุญาตเฉพาะ Components ที่สร้างจาก `shadcn/ui` หรือเป็น Basic UI 
- `services/`: ให้เขียน Business Logic (การติดต่อ Database, การคำนวณ) ไว้ที่นี่ เพื่อให้ Server Actions หรือ Route Handlers เรียกใช้งานต่อได้ง่าย (Reusability)
- `actions/`: ไฟล์ฟังก์ชัน Server Action ต้องใส่ `'use server'` ไว้ด้านบนสุดของไฟล์เสมอ
- `lib/validations/`: ทุกฟอร์มต้องมี Zod Schema กำหนดไว้ที่นี่ เพื่อ Validate ทั้งฝั่ง Client (React Hook Form) และ Server (Server Action)
