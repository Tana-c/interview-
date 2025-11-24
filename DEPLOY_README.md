# 🚀 คู่มือการ Deploy AI Interviewer System

## 📋 สิ่งที่ต้องเตรียม

1. **OpenAI API Key** (สำหรับ AI features)
2. **Web Hosting** (สำหรับ Frontend - Static files)
3. **Node.js Hosting** (สำหรับ Backend API)

---

## ⚡ Quick Deploy (ใช้ Script)

### Windows:
```bash
deploy.bat
```

### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

Script จะ:
- ✅ ตรวจสอบไฟล์ .env
- ✅ Build frontend
- ✅ เตรียม backend สำหรับ production
- ✅ สร้างโฟลเดอร์ `backend-prod/` และ `frontend/dist/`

---

## 📝 Manual Deploy

### 1. Backend Setup

#### สร้างไฟล์ `.env` ใน `backend/`:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=7183
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Deploy Backend:
1. Upload โฟลเดอร์ `backend/` ไปยัง Node.js hosting
2. Run: `npm install --production`
3. ตั้งค่า Environment Variables ใน hosting panel
4. Start app: `npm start`

---

### 2. Frontend Setup

#### สร้างไฟล์ `.env.production` ใน `frontend/`:
```env
VITE_API_BASE=https://api.yourdomain.com
```

#### Build และ Deploy:
```bash
cd frontend
npm install
npm run build
```

#### Upload:
- Upload ไฟล์ทั้งหมดใน `frontend/dist/` ไปยัง `public_html/`
- Upload ไฟล์ `.htaccess` ด้วย

---

## ✅ ตรวจสอบหลัง Deploy

1. **Backend**: `https://api.yourdomain.com/health`
   - ต้องได้: `{"status":"ok","timestamp":"..."}`

2. **Frontend**: `https://yourdomain.com`
   - ต้องแสดงหน้าเว็บได้
   - ตรวจสอบ Browser Console (F12) ว่าไม่มี errors

---

## 📖 คู่มือเต็ม

ดูไฟล์ `DEPLOY_GUIDE.md` สำหรับรายละเอียดและ troubleshooting

---

## 🔧 Environment Variables

### Backend (.env):
- `OPENAI_API_KEY` - OpenAI API key (required)
- `PORT` - Server port (default: 7183)
- `NODE_ENV` - Environment (production/development)
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)

### Frontend Routing:
- Base path: `/aiinterview/`
- หน้าแรก: `/aiinterview/`
- หน้า Config: `/aiinterview/config`

### Frontend (.env.production):
- `VITE_API_BASE` - Backend API URL (required)

---

## 🐛 Troubleshooting

### Backend ไม่ทำงาน
- ตรวจสอบ Logs ใน hosting panel
- ตรวจสอบ Environment Variables
- ตรวจสอบ PORT ถูกต้อง

### Frontend ไม่แสดง
- ตรวจสอบว่าไฟล์ทั้งหมดใน `dist/` ถูก upload
- ตรวจสอบ `.htaccess` มีอยู่
- ตรวจสอบ Browser Console

### CORS Error
- ตรวจสอบ `ALLOWED_ORIGINS` ใน backend
- ตรวจสอบว่า URL ตรงกัน (https/http)

---

## 📞 รับความช่วยเหลือ

ดู `DEPLOY_GUIDE.md` สำหรับรายละเอียดเพิ่มเติม

