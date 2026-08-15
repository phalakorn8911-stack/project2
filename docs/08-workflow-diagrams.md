# 🔄 Workflow Diagrams

## Smart Army Vehicle Maintenance Dashboard

---

## Workflow 1: การแจ้งซ่อมและการจัดการใบงาน (Repair Request to Work Order)

```mermaid
stateDiagram-v2
    [*] --> PENDING : พลขับแจ้งซ่อม
    PENDING --> ACKNOWLEDGED : จนท.ยานยนต์รับเรื่อง
    PENDING --> REJECTED : จนท.ปฏิเสธ (ปิดงาน)
    ACKNOWLEDGED --> APPROVED : อนุมัติการซ่อม
    
    APPROVED --> WO_CREATED : สร้างใบงานซ่อม
    
    state "Work Order Process" as WO {
        WO_CREATED --> ASSIGNED : หัวหน้าช่างมอบหมายงาน
        ASSIGNED --> DIAGNOSING : ช่างตรวจสอบอาการ
        DIAGNOSING --> WAITING_PARTS : ต้องการอะไหล่
        WAITING_PARTS --> IN_PROGRESS : อะไหล่พร้อม / ซ่อมแซม
        DIAGNOSING --> IN_PROGRESS : ซ่อมแซม (ไม่ใช้อะไหล่)
        IN_PROGRESS --> READY_FOR_QC : ช่างซ่อมเสร็จ
        READY_FOR_QC --> COMPLETED : หัวหน้าช่างตรวจผ่าน (QC)
        READY_FOR_QC --> IN_PROGRESS : หัวหน้าช่างตีกลับซ่อมใหม่
    }
    
    WO --> CLOSED : ปิดงานซ่อม (อัปเดตสถานะรถเป็นพร้อมใช้)
    CLOSED --> [*]
```

---

## Workflow 2: รอบการซ่อมบำรุง (Maintenance Schedule Flow)

```mermaid
flowchart TD
    A[Admin/จนท. สร้าง Maintenance Plan] --> B[กำหนดรอบตามเวลา/ไมล์/ชั่วโมง]
    B --> C[ผูก Plan เข้ากับยานพาหนะ]
    C --> D[ระบบคำนวณรอบถัดไป]
    
    D --> E{ใกล้ถึงรอบ?}
    E -->|ใช่| F[แจ้งเตือน Notification]
    E -->|ยังไม่ถึง| D
    
    F --> G{เกินกำหนด?}
    G -->|ใช่| H[แจ้งเตือน OVERDUE & เปลี่ยนสถานะรถ]
    G -->|ยังไม่เกิน| I[จนท. สร้างใบงานซ่อม PM]
    H --> I
    
    I --> J[ช่างดำเนินการซ่อมบำรุง]
    J --> K[ปิดใบงานซ่อม]
    K --> L[ระบบรีเซ็ตไมล์/วันที่ และคำนวณรอบถัดไป]
    L --> D
```

---

## Workflow 3: การเบิกอะไหล่ (Parts Requisition Flow)

```mermaid
flowchart TD
    A[ช่างเลือก Work Order] --> B[ช่างเลือกอะไหล่และระบุจำนวนที่ต้องการเบิก]
    B --> C{ตรวจสอบสต็อกคงเหลือ}
    C -->|ไม่พอ| D[แจ้งเตือนช่าง: สต็อกไม่พอ]
    C -->|พอเพียง| E[ส่งคำขอเบิกไปยังคลัง]
    
    E --> F[หัวหน้าช่าง/จนท.คลัง อนุมัติการเบิก]
    F --> G[ระบบตัดสต็อกในฐานข้อมูล]
    G --> H[บันทึกต้นทุนเข้าสู่ Work Order]
    
    H --> I{สต็อก < จำนวนขั้นต่ำ?}
    I -->|ใช่| J[แจ้งเตือน Low Stock Alert ไปยังจนท.คลัง]
    I -->|ไม่ใช่| K[สิ้นสุดกระบวนการ]
    J --> K
```

---

## Workflow 4: ระบบวิเคราะห์อาการเสียด้วย AI (AI Analysis Flow)

```mermaid
flowchart TD
    A[ผู้ใช้พิมพ์อาการเสีย] --> B[กดปุ่ม 'วิเคราะห์ด้วย AI']
    B --> C{AI Server (Ollama) พร้อมใช้งาน?}
    
    C -->|Yes| D[ส่ง Prompt + อาการเสียไปให้ Gemma]
    D --> E[Gemma ประมวลผล]
    E --> F[ระบบดึงหมวดหมู่และความเร่งด่วนออกมา]
    F --> G[แสดงผลให้ผู้ใช้ทราบ]
    
    C -->|No| H[Fallback: จับ Keyword ด้วย Rule-based]
    H --> I[ถ้าเจอคำว่า 'เบรก' ให้ตั้งเป็น 'ระบบเบรก, เร่งด่วน']
    I --> G
    
    G --> J[ผู้ใช้สามารถแก้ไขค่าที่ระบบแนะนำได้ก่อนบันทึก]
```
