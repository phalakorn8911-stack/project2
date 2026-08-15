# 💻 Environment Setup Guide

## Smart Army Vehicle Maintenance Dashboard

คู่มือการติดตั้งสภาพแวดล้อมเพื่อพัฒนาโปรเจกต์ (Local Development)

---

## 1. Prerequisites (สิ่งที่ต้องติดตั้ง)

ก่อนเริ่มต้น ให้ตรวจสอบว่าในเครื่องมีซอฟต์แวร์เหล่านี้:
- **Node.js**: เวอร์ชัน 18.x ขึ้นไป
- **Package Manager**: npm, pnpm, หรือ yarn
- **Database**: PostgreSQL (ติดตั้งในเครื่อง หรือใช้ Cloud เช่น Supabase/Neon)
- **Git**: สำหรับ Version Control
- **Ollama**: (ตัวเลือกเสริม) สำหรับรัน AI Model ภายในเครื่อง

---

## 2. ขั้นตอนการติดตั้ง

### Step 1: Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/your-org/smart-vehicle-maintenance.git
cd smart-vehicle-maintenance

# Install dependencies (แนะนำให้ใช้ npm)
npm install
```

### Step 2: Environment Variables

ทำการคัดลอกไฟล์ `.env.example` ไปเป็น `.env.local`

```bash
cp .env.example .env.local
```

ตั้งค่าตัวแปรใน `.env.local` ให้ถูกต้อง:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vehicle_db"

# NextAuth (สำหรับ Login)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-replace-me" # รัน 'openssl rand -base64 32' เพื่อสร้าง

# Cloud Storage (Optional)
CLOUDINARY_URL="cloudinary://..."

# AI Configuration (Optional)
OLLAMA_API_URL="http://localhost:11434"
```

### Step 3: Database Setup

ใช้ Prisma สร้าง Schema และ Database

```bash
# อัปเดต/สร้างตารางใน Database ตาม schema.prisma
npx prisma db push

# (ทางเลือก) สร้าง Prisma Client
npx prisma generate

# ใส่ข้อมูลจำลองเริ่มต้น (Seed data: Admin user, roles)
npx prisma db seed
```

### Step 4: AI Model Setup (Ollama)

หากต้องการทดสอบฟีเจอร์ AI ให้ดำเนินการติดตั้งโมเดล:

```bash
# ดาวน์โหลดและรัน model Gemma 2B
ollama pull gemma:2b
ollama serve
```

### Step 5: Run Development Server

```bash
npm run dev
```

ระบบจะเปิดที่ [http://localhost:3000](http://localhost:3000)

---

## 3. Production Deployment Guide

เมื่อต้องการนำขึ้น Server จริง (Production):

### Deployment บน Vercel (แนะนำสำหรับ Frontend)
1. Push code ขึ้น GitHub
2. สมัคร Vercel และเลือก "Import Project" จาก GitHub
3. ระบุ Environment Variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, ฯลฯ) ใน Vercel Settings
4. Vercel จะจัดการ `npm run build` และ Deploy ให้โดยอัตโนมัติ

### Database (PostgreSQL)
- แนะนำให้ใช้ **Supabase** หรือ **Neon Tech** ซึ่งเป็น Serverless Postgres (เหมาะกับ Vercel)
- นำ Connection String ที่ได้มาใส่ใน `DATABASE_URL`

### ข้อควรระวังในการ Deploy AI
- Ollama เป็น Local LLM การ Deploy ขึ้น Server จริงต้องมี Server/VM แยกต่างหากที่มีทรัพยากร (GPU/CPU) เพียงพอ
- หรือสามารถเปลี่ยน Provider จาก `Ollama` ไปใช้ `OpenAI` หรือ `Google Gemini API` ได้ในอนาคตเพื่อความสะดวก

---

## 4. Troubleshooting (การแก้ปัญหาเบื้องต้น)

- **`PrismaClientInitializationError`**: ตรวจสอบว่า Database Server ทำงานอยู่ และ `DATABASE_URL` ถูกต้องหรือไม่
- **`NextAuth Sign-in Error`**: ตรวจสอบว่า `NEXTAUTH_SECRET` ได้กำหนดไว้แล้ว
- **`AI Fetch Failed`**: ตรวจสอบว่า Ollama รันอยู่หรือไม่ (`ollama serve`) และ `OLLAMA_API_URL` ถูกต้อง
