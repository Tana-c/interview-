# 📚 คู่มือการ Deploy AI Interviewer System

## 🎯 เลือกวิธีการ Deploy

### 1. **VPS (Virtual Private Server)** - แนะนำสำหรับ Production
- ✅ ควบคุมได้เต็มที่
- ✅ ประสิทธิภาพดี
- ✅ ราคาถูก
- 📖 [VPS_DEPLOY.md](./VPS_DEPLOY.md) - คู่มือเต็ม
- ⚡ [VPS_QUICKSTART.md](./VPS_QUICKSTART.md) - Quick Start

### 2. **Shared Hosting (Hostinger, etc.)**
- ✅ ใช้งานง่าย
- ✅ ไม่ต้องจัดการ server
- 📖 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - คู่มือเต็ม
- ⚡ [DEPLOY_QUICKSTART.md](./DEPLOY_QUICKSTART.md) - Quick Start

---

## 🚀 Quick Deploy Scripts

### สำหรับ VPS (Linux/Mac)
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh user@vps-ip
```

### สำหรับ Shared Hosting (Windows)
```bash
deploy.bat
```

### สำหรับ Shared Hosting (Linux/Mac)
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📋 สิ่งที่ต้องเตรียม

### ทุก Platform:
- ✅ OpenAI API Key
- ✅ Domain Name (แนะนำ)
- ✅ SSH/FTP Access

### VPS เพิ่มเติม:
- ✅ VPS Server (Ubuntu/Debian)
- ✅ Root หรือ sudo access

---

## 🔧 Configuration Files

### Backend `.env`
```env
OPENAI_API_KEY=sk-your-key-here
PORT=7183
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

### Frontend `.env.production`
```env
VITE_API_BASE=https://yourdomain.com
```

### Nginx Config
- 📄 [nginx-config.conf](./nginx-config.conf) - Template สำหรับ VPS

---

## ✅ Checklist การ Deploy

### Backend:
- [ ] Node.js ติดตั้งแล้ว
- [ ] `.env` ไฟล์พร้อมใช้งาน
- [ ] Dependencies ติดตั้งแล้ว (`npm install --production`)
- [ ] Backend รันได้ (PM2 หรือ hosting service)
- [ ] Health check ผ่าน: `/health`

### Frontend:
- [ ] `.env.production` ตั้งค่าแล้ว
- [ ] Build สำเร็จ (`npm run build`)
- [ ] ไฟล์ใน `dist/` upload แล้ว
- [ ] `.htaccess` upload แล้ว (สำหรับ shared hosting)
- [ ] Nginx config ตั้งค่าแล้ว (สำหรับ VPS)

### Network:
- [ ] Domain ชี้ไปยัง server แล้ว
- [ ] SSL Certificate ติดตั้งแล้ว (HTTPS)
- [ ] Firewall ตั้งค่าแล้ว
- [ ] CORS ตั้งค่าถูกต้อง

---

## 🐛 Troubleshooting

### Backend ไม่ทำงาน
- ตรวจสอบ logs: `pm2 logs` (VPS) หรือ hosting logs
- ตรวจสอบ `.env` file
- ตรวจสอบ port ไม่ถูกใช้งาน

### Frontend ไม่แสดง
- ตรวจสอบ Browser Console (F12)
- ตรวจสอบ Network tab
- ตรวจสอบ Nginx/Apache config
- ตรวจสอบ base path `/aiinterview/`

### CORS Error
- ตรวจสอบ `ALLOWED_ORIGINS` ใน backend `.env`
- ตรวจสอบว่า origin ตรงกับ domain จริง

### API Connection Failed
- ตรวจสอบ `VITE_API_BASE` ใน frontend
- ตรวจสอบ backend รันอยู่
- ตรวจสอบ proxy config (Nginx)

---

## 📞 รับความช่วยเหลือ

1. ตรวจสอบคู่มือที่เกี่ยวข้อง:
   - VPS: `VPS_DEPLOY.md`
   - Shared Hosting: `DEPLOY_GUIDE.md`

2. ตรวจสอบ Logs:
   - Backend: `pm2 logs` หรือ hosting logs
   - Frontend: Browser Console (F12)
   - Nginx: `/var/log/nginx/error.log`

3. ตรวจสอบ Configuration:
   - Environment Variables
   - Nginx/Apache config
   - Firewall rules

---

## 🎉 เสร็จสิ้น!

หลังจาก deploy สำเร็จ:
- Frontend: `https://yourdomain.com/aiinterview/`
- Config: `https://yourdomain.com/aiinterview/config`
- API: `https://yourdomain.com/api/`
- Health: `https://yourdomain.com/health`

