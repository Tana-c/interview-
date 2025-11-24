# ⚡ Quick Start: Deploy Interviewer บน Hostinger

## 🎯 ขั้นตอนย่อๆ (5 นาที)

### 1. Backend (Node.js) - 3 ขั้นตอน

```bash
# 1. สร้าง .env file
cd backend
cp .env.example .env
# แก้ไข OPENAI_API_KEY และ ALLOWED_ORIGINS ใน .env

# 2. Upload ไปยัง Hostinger Node.js hosting
# - ใช้ File Manager หรือ FTP
# - Upload โฟลเดอร์ backend/ ทั้งหมด

# 3. ใน Hostinger Node.js App:
# - Install: npm install --production
# - Start Command: npm start
# - Port: 8000
# - Environment Variables: ใส่จาก .env
```

### 2. Frontend (Static) - 3 ขั้นตอน

```bash
# 1. สร้าง .env.production
cd frontend
cp .env.production.example .env.production
# แก้ไข VITE_API_BASE=https://api.yourdomain.com

# 2. Build
npm install
npm run build

# 3. Upload ไฟล์ทั้งหมดใน dist/ ไปยัง public_html/
# - รวม .htaccess ด้วย
```

---

## ✅ ตรวจสอบ

- Backend: `https://api.yourdomain.com/health` → ต้องได้ `{"status":"ok"}`
- Frontend: `https://yourdomain.com` → ต้องแสดงหน้าเว็บได้

---

## 📖 คู่มือเต็มๆ

ดู `DEPLOY_GUIDE.md` สำหรับรายละเอียดและ troubleshooting

