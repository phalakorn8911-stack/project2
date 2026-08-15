# 🌐 API Specification

## Smart Army Vehicle Maintenance Dashboard

เอกสารนี้อธิบายสเปคของ API (อ้างอิงสำหรับ Next.js Server Actions และ Route Handlers)

---

## 1. Auth API
ใช้ NextAuth.js (Auth.js) ในการจัดการ
- `POST /api/auth/callback/credentials` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get current session

---

## 2. Users API (Server Actions & Route Handlers)
| Method | Path / Action Name | Description | Role Required |
|--------|-------------------|-------------|---------------|
| `GET` | `getUsers()` | ดูรายชื่อผู้ใช้ทั้งหมด | Admin |
| `POST` | `createUser(data)` | สร้างผู้ใช้ใหม่ | Admin |
| `GET` | `getUserById(id)` | ดูข้อมูลผู้ใช้ 1 ราย | Admin |
| `PUT` | `updateUser(id, data)`| แก้ไขข้อมูลผู้ใช้ | Admin |
| `PATCH`| `updateUserStatus(id, status)`| เปิด/ปิด การใช้งาน | Admin |

---

## 3. Vehicles API
| Method | Path / Action Name | Description | Role Required |
|--------|-------------------|-------------|---------------|
| `GET` | `getVehicles(filters)`| ดูรายการยานพาหนะ | All |
| `POST` | `createVehicle(data)`| ลงทะเบียนรถใหม่ | Admin, เจ้าหน้าที่ |
| `GET` | `getVehicleById(id)`| ดูรายละเอียดรถ | All |
| `PUT` | `updateVehicle(id, data)`| แก้ไขข้อมูลรถ | Admin, เจ้าหน้าที่ |
| `PATCH`| `updateVehicleStatus(id)`| เปลี่ยนสถานะรถ | Admin, เจ้าหน้าที่, ช่าง |
| `GET` | `getVehicleHistory(id)`| ดูประวัติซ่อม | All |
| `PATCH`| `updateMileage(id, value)`| อัปเดตเลขไมล์ | พลขับ, ช่าง, เจ้าหน้าที่ |

*(สำหรับ API หมวดอื่นๆ เช่น Vehicle Types, Inspections, Maintenance Plans, Repair Requests, Work Orders, Parts จะใช้ Pattern แบบ CRUD เดียวกันตามตารางด้านบน)*

---

## 4. Work Orders API (Special Endpoints)
- `assignMechanic(workOrderId, mechanicId)`: มอบหมายช่าง (หัวหน้าช่าง)
- `updateWorkOrderStatus(workOrderId, status)`: เปลี่ยนสถานะใบงาน (ช่าง, หัวหน้าช่าง)
- `qualityCheck(workOrderId, result)`: ตรวจคุณภาพงานซ่อม (หัวหน้าช่าง)

---

## 5. Stock Movements API
- `stockIn(partId, quantity, details)`: รับอะไหล่เข้าคลัง (เจ้าหน้าที่คลัง)
- `stockOut(partId, quantity, workOrderId)`: เบิกอะไหล่ (เจ้าหน้าที่คลัง, ช่างขอเบิก)

---

## 6. AI API (Route Handlers)
การทำงานกับ AI จะใช้ Route Handlers เพื่อให้รองรับการสตรีม (Streaming) หรือ Background Processing
- `POST /api/ai/vehicle-summary`
  - Body: `{ vehicleId: string }`
  - Response: `{ summary: string }`
- `POST /api/ai/analyze-issue`
  - Body: `{ symptoms: string }`
  - Response: `{ category: string, urgency: string, suggestion: string }`
- `POST /api/ai/monthly-report`
  - Body: `{ month: string, year: string }`
  - Response: `{ report: string }`
