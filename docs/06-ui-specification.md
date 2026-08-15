# 🖥️ UI Specification

## Smart Army Vehicle Maintenance Dashboard

---

## 16.1 Dashboard Page
- **Layout:**
  - Header: ชื่อระบบ, วันที่ปัจจุบัน, ข้อมูลผู้ใช้งาน
  - Summary Cards (10 items): รถทั้งหมด, พร้อมใช้งาน, กำลังซ่อม, รออะไหล่, ใกล้รอบ, เกินรอบ, งานซ่อมรออนุมัติ, งานซ่อมค้าง, ค่าซ่อม, อะไหล่ใกล้หมด
- **Charts:**
  - Vehicle Readiness Chart (Pie/Doughnut)
  - Work Order Status Chart (Bar)
  - Monthly Maintenance Cost Chart (Line)
- **Tables:**
  - Due Maintenance Table
  - Urgent Repair Table
  - Low Stock Parts Table
- **AI Integration:** AI Monthly Summary Card (ปุ่มกดเพื่อให้ AI สรุปภาพรวมเดือนปัจจุบัน)
- **Roles:** Admin, ผู้บังคับบัญชา (เห็นครบ), ตำแหน่งอื่นเห็นจำกัดตามสิทธิ์

## 16.2 Vehicle List Page
- **Components:**
  - Search Bar (ค้นหาทะเบียน, รหัสรถ)
  - Filters: สถานะรถ, ประเภทรถ, หน่วยงาน
  - Table: แสดงรายการรถ พร้อม Badge สีบอกสถานะ
  - Buttons: ดูรายละเอียด, แก้ไข, สร้าง QR Code, เพิ่มรถใหม่

## 16.3 Vehicle Detail Page
- **Components:**
  - ส่วนรูปภาพหลัก (Carousel หรือ Grid ถ้ารถมีหลายรูป)
  - Info Card: รายละเอียดทะเบียน เลขเครื่อง รุ่น ปี
  - Status Badge: สถานะปัจจุบัน สีโดดเด่น
  - Mileage Form: ปุ่มและฟอร์มอัปเดตเลขไมล์อย่างรวดเร็ว
  - Action Buttons: แจ้งซ่อม, ตรวจสภาพ
  - QR Code: แสดงและให้ดาวน์โหลด
  - Tabs:
    - ประวัติซ่อม (Timeline)
    - ประวัติการตรวจสภาพ
    - เอกสารประจำรถ
  - AI Summary Section: กดเพื่อให้ AI วิเคราะห์ประวัติรถ

## 16.4 Work Order Board Page
- **Layout:**
  - Kanban Board (คล้าย Trello) แบ่งคอลัมน์ตามสถานะ (รอรับงาน, กำลังซ่อม, รออะไหล่, ซ่อมเสร็จ)
- **Components:**
  - Card: แสดงเลขที่ใบงาน, ทะเบียนรถ, อาการ, ความเร่งด่วน (แท็กสี), ช่างผู้รับผิดชอบ
  - Filters: กรองตามช่าง, ความเร่งด่วน, สถานะ
  - Interactions: Drag & Drop เปลี่ยนสถานะ (ถ้าทำได้ใน Next.js), หรือคลิกเปลี่ยนสถานะ

## 16.5 Parts Inventory Page
- **Components:**
  - Table: รายการอะไหล่ทั้งหมด
  - Search & Filters (หมวดหมู่)
  - Badge Status: สีเขียว (ปกติ), สีแดง (ต่ำกว่าจุดต่ำสุด - แจ้งเตือน)
  - Action Buttons: รับเข้า, เบิกออก, ดูประวัติ Stock Movement, เพิ่มอะไหล่ใหม่

## 16.6 Report Page
- **Components:**
  - Filters: ช่วงวันที่, หน่วยงาน, ประเภทรถ, สถานะ
  - Summary Cards เฉพาะหมวดหมู่
  - Chart & Table แสดงข้อมูลตาม Report ที่เลือก (มี 12 รายงานตาม PRD)
  - Export Buttons: PDF, Excel, CSV
  - AI Report Summary: ปุ่มกดให้ AI สร้าง Executive Summary จากข้อมูลในตาราง
