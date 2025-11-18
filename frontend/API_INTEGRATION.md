# 🔌 API Integration Guide

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. **SimpleInterviewNew.jsx** - หน้าสัมภาษณ์
ใช้ API endpoints ตามไฟล์ template:

#### API Endpoints ที่ใช้:
- `POST /api/start` - เริ่มการสัมภาษณ์
  ```json
  Request: { "topic": "น้ำยาล้างจาน", "max_questions": 10 }
  Response: { "session_id": "...", "question": "..." }
  ```

- `POST /api/answer` - ส่งคำตอบและรับคำถามถัดไป
  ```json
  Request: { "session_id": "...", "answer": "...", "turn": 1 }
  Response: { 
    "analysis": { "codes": [...] },
    "next_question": "...",
    "is_complete": false
  }
  ```

- `GET /api/summary/{session_id}` - ดึงสรุปผลการสัมภาษณ์
  ```json
  Response: {
    "total_questions": 10,
    "collected_codes": [...],
    "avg_confidence": 85,
    "codes_by_type": {...}
  }
  ```

- `GET /api/insight/{session_id}` - ดึง Consumer Insight
  ```json
  Response: {
    "people_want": "...",
    "but": "...",
    "so_they": "...",
    "full_insight": "..."
  }
  ```

- `POST /api/save/{session_id}` - บันทึกผลลัพธ์
  ```json
  Response: { "message": "...", "filename": "..." }
  ```

### 2. **ConfigPage.jsx** - หน้าตั้งค่า
ใช้ API endpoints สำหรับจัดการ config:

#### API Endpoints ที่ใช้:
- `GET /api/config` - โหลด config ทั้งหมด
- `POST /api/config` - บันทึก config
  ```json
  Request: {
    "code_types": {...},
    "question_generation_prompt": "...",
    "analysis_prompt": "...",
    "example_questions": {...},
    "model_settings": {...}
  }
  ```

- `POST /api/config/reset` - รีเซ็ตเป็นค่าเริ่มต้น
- `GET /api/config/export` - Export config เป็น JSON
- `POST /api/config/import` - Import config จาก JSON
- `GET /api/config/default/question_prompt` - ดึง default prompt คำถาม
- `GET /api/config/default/analysis_prompt` - ดึง default prompt วิเคราะห์

### 3. **Router.jsx** - Navigation System
จัดการการนำทางระหว่างหน้า:
- หน้า Interview (SimpleInterviewNew.jsx)
- หน้า Config (ConfigPage.jsx)

## 🚀 วิธีใช้งาน

### 1. เริ่ม Backend API Server
```bash
cd c:\work\AIInterviewer\ai_interviewer_system
python -m uvicorn app.main:app --reload --port 8000
```

### 2. เริ่ม React Frontend
```bash
cd c:\work\AIInterviewer\Interviewer
npm run dev
```

### 3. เปิดเบราว์เซอร์
```
http://localhost:5173
```

## 🎯 ฟีเจอร์ที่เพิ่มเข้ามา

### ✅ Navigation
- คลิกปุ่ม **⚙️ Configuration** ในหน้า Interview → ไปหน้า Config
- คลิกปุ่ม **🏠 กลับหน้าหลัก** ในหน้า Config → กลับหน้า Interview

### ✅ Real API Integration
- ทุก function ใช้ `fetch()` เรียก API จริง
- มี error handling และ console.log สำหรับ debug
- แสดง alert เมื่อเกิด error

### ✅ Session Management
- เก็บ `session_id` จาก API
- ใช้ session_id ในการเรียก API ต่างๆ

### ✅ State Synchronization
- อัปเดต state จากข้อมูล API response
- Reload config หลังจากบันทึกสำเร็จ

## 📝 Configuration

### เปลี่ยน API Base URL
แก้ไขใน 2 ไฟล์:

**SimpleInterviewNew.jsx:**
```javascript
const API_BASE = 'http://localhost:8000';
```

**ConfigPage.jsx:**
```javascript
const API_BASE = 'http://localhost:8000';
```

## 🔍 Debugging

### ดู Console Logs
เปิด Browser DevTools (F12) และดู Console:
- `🚀 Starting interview...` - เริ่มสัมภาษณ์
- `✅ Interview started:` - สำเร็จ
- `📊 Analysis result:` - ผลการวิเคราะห์
- `📋 Summary:` - สรุปผล
- `💡 Insight:` - Consumer Insight
- `❌ Error:` - ข้อผิดพลาด

### ตรวจสอบ Network Requests
ใน DevTools > Network tab:
- ดู Request/Response ของแต่ละ API call
- ตรวจสอบ status code (200 = สำเร็จ)
- ดู payload ที่ส่งไป/รับกลับ

## 🎨 UI Features

### Interview Page
- ✅ Setup Form - ตั้งค่าหัวข้อและจำนวนคำถาม
- ✅ Progress Bar - แสดงความคืบหน้า
- ✅ Codes Status - แสดง 5 ประเภทโค้ด (เขียว=collected, แดง=missing)
- ✅ Question Box - แสดงคำถามจาก AI
- ✅ Answer Textarea - กรอกคำตอบ (Enter=submit, Shift+Enter=newline)
- ✅ Loading Spinner - แสดงขณะรอ API
- ✅ Analysis Result - แสดงโค้ดที่พบพร้อม confidence score
- ✅ Summary Section - สรุปผล + Consumer Insight + Export buttons

### Config Page
- ✅ Tab Navigation - 5 tabs (Code Types, Question Prompt, Analysis Prompt, Examples, Model Settings)
- ✅ Code Types - แก้ไขคำอธิบายแต่ละประเภท
- ✅ Prompt Templates - แก้ไข prompt พร้อมแสดงตัวแปรที่ใช้ได้
- ✅ Example Questions - จัดการตัวอย่างคำถาม (เพิ่ม/ลบ)
- ✅ Model Settings - เลือก model และปรับ temperature
- ✅ Config Management - Export/Import/Reset

## 🐛 Known Issues

1. **CORS Error**: ถ้าเจอ CORS error ให้ตรวจสอบว่า backend มี CORS middleware
2. **Connection Refused**: ตรวจสอบว่า backend server รันอยู่ที่ port 8000
3. **404 Not Found**: ตรวจสอบว่า API endpoints ตรงกับที่ backend กำหนด

## 📦 Files Modified

1. ✅ `SimpleInterviewNew.jsx` - เพิ่ม API calls และ navigation
2. ✅ `ConfigPage.jsx` - เพิ่ม API calls และ navigation
3. ✅ `Router.jsx` - สร้างใหม่สำหรับ navigation
4. ✅ `main.jsx` - อัปเดตให้ใช้ Router

## 🎯 Next Steps

1. ทดสอบการทำงานกับ backend จริง
2. ปรับแต่ง error messages ให้เหมาะสม
3. เพิ่ม loading states ที่จำเป็น
4. ทดสอบ edge cases (network error, invalid data, etc.)

---

**สร้างโดย:** AI Assistant  
**วันที่:** 16 พฤศจิกายน 2568  
**เวอร์ชัน:** 1.0
