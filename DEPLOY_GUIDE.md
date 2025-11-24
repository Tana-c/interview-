# 🚀 คู่มือการ Deploy Interviewer System บน Hostinger

## 📋 สิ่งที่ต้องเตรียม

1. **Hostinger Account** พร้อม:

   - **Web Hosting** (สำหรับ Frontend - Static files)
   - **Node.js Hosting** (สำหรับ Backend API)
2. **OpenAI API Key** (สำหรับ AI features)
3. **File Manager หรือ FTP Client** (เช่น FileZilla, WinSCP)

---

## 📁 ขั้นตอนการ Deploy แบ่งเป็น 2 ส่วน

### ส่วนที่ 1: Deploy Backend (Node.js API)

#### ขั้นตอนที่ 1: เตรียมไฟล์ Backend

1. บนเครื่อง local ของคุณ สร้างโฟลเดอร์ `backend-prod`
2. Copy ไฟล์ต่อไปนี้จาก `backend/`:

   ```
   backend-prod/
   ├── src/
   │   └── server.js
   ├── data/
   │   ├── config.json
   │   └── defaultConfig.json
   └── package.json
   ```

#### ขั้นตอนที่ 2: สร้างไฟล์ `.env` สำหรับ Production

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend-prod/`:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=7183
NODE_ENV=production
```

**⚠️ อย่า commit ไฟล์ `.env` เข้า Git!**

#### ขั้นตอนที่ 3: Deploy ไปยัง Hostinger Node.js Hosting

1. **เข้า hPanel ของ Hostinger**
2. **ไปที่ Node.js** (Advanced → Node.js หรือใน Control Panel)
3. **สร้าง Node.js App ใหม่**:

   - **App Name**: `interviewer-backend`
   - **Node.js Version**: เลือก `18.x` หรือ `20.x`
   - **App Root**: `/home/u12345678/interviewer-backend` (ปรับตาม path ของคุณ)
   - **App URL**: `api.yourdomain.com` (หรือ subdomain ที่ต้องการ)
4. **Upload ไฟล์**:

   - ใช้ **File Manager** ใน hPanel หรือ **FTP Client** (FileZilla)
   - Upload ทั้งโฟลเดอร์ `backend-prod/` ไปยัง App Root path
5. **Install Dependencies**:

   - ใน **Terminal** ของ hPanel หรือ SSH:

   ```bash
   cd ~/interviewer-backend
   npm install --production
   ```
6. **ตั้งค่า Environment Variables**:

   - ใน Node.js App Settings → **Environment Variables**:
     - `OPENAI_API_KEY` = your-api-key
     - `PORT` = 7183
     - `NODE_ENV` = production
7. **ตั้งค่า Start Command**:

   - **Start Command**: `npm start` หรือ `node src/server.js`
   - **App Port**: `7183` (ต้องตรงกับ PORT ใน .env)
8. **Start/Restart App**:

   - กดปุ่ม **Start** หรือ **Restart** ใน Node.js App panel

#### ขั้นตอนที่ 4: ตรวจสอบ Backend

เปิด Browser และทดสอบ:

```
https://api.yourdomain.com/health
```

Expected response:

```json
{"status":"ok","timestamp":"2024-..."}
```

✅ **ถ้าได้ response นี้ แสดงว่า Backend พร้อมแล้ว!**

---

### ส่วนที่ 2: Deploy Frontend (React/Vite)

#### ขั้นตอนที่ 1: เตรียม Build Frontend

1. **แก้ไข API URL ใน Frontend** (ถ้ายังไม่ได้แก้):

   ไฟล์ `frontend/src/SimpleInterviewNew.jsx` จะใช้ environment variable อัตโนมัติ:

   ```javascript
   const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7183';
   ```
   
   **หมายเหตุ**: Frontend ใช้ base path `/aiinterview/` ดังนั้น:
   - หน้าแรก: `https://yourdomain.com/aiinterview/`
   - หน้า Config: `https://yourdomain.com/aiinterview/config`
   
2. **สร้างไฟล์ `.env.production`** ในโฟลเดอร์ `frontend/`:

   ```env
   VITE_API_BASE=https://api.yourdomain.com
   ```

   ⚠️ แทนที่ `api.yourdomain.com` ด้วย URL จริงของ Backend
3. **Build Frontend** บนเครื่อง local:

   ```bash
   cd frontend
   npm install
   npm run build
   ```

   จะได้ไฟล์ build ในโฟลเดอร์ `frontend/dist/`

#### ขั้นตอนที่ 2: Upload Frontend ไปยัง Web Hosting

1. **เข้า File Manager** ใน hPanel

2. **ไปที่โฟลเดอร์ `public_html`** (หรือ `domains/yourdomain.com/public_html`)

3. **สร้างโฟลเดอร์ `aiinterview`** ใน `public_html/`:
   ```bash
   public_html/aiinterview/
   ```

4. **Upload ไฟล์ทั้งหมดใน `frontend/dist/`** ไปยัง `public_html/aiinterview/`:
   - `index.html`
   - โฟลเดอร์ `assets/`
   - ไฟล์อื่นๆ ที่มีใน dist/

5. **Upload ไฟล์ `.htaccess`**:
   - Copy ไฟล์ `frontend/.htaccess` ไปยัง `public_html/aiinterview/` ด้วย
   - ไฟล์นี้ช่วยให้ React Router ทำงานได้ถูกต้อง

#### ขั้นตอนที่ 3: ตรวจสอบ Frontend

เปิด Browser:

```
https://yourdomain.com/aiinterview/
```

หรือ

```
https://yourdomain.com/aiinterview/config
```

Expected: หน้าเว็บโหลดได้และสามารถใช้งานได้

---

## 🔧 การตั้งค่าเพิ่มเติม

### CORS Configuration (ถ้ามีปัญหา CORS)

แก้ไข `backend/src/server.js`:

```javascript
// แทนที่
app.use(cors());

// ด้วย
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:3000' // สำหรับ development
  ],
  credentials: true
}));
```

### ตั้งค่า Domain และ SSL

1. **เชื่อมต่อ Domain**:

   - ใน hPanel → **Domains** → เพิ่ม domain/subdomain
   - ตั้งค่า DNS records ให้ชี้ไปยัง Hostinger
2. **ตั้งค่า SSL Certificate**:

   - ใน hPanel → **SSL** → Enable SSL
   - Hostinger มี SSL ฟรี (Let's Encrypt)

---

## ✅ Checklist การ Deploy

### Backend:

- [ ] สร้างไฟล์ `.env` พร้อม `OPENAI_API_KEY`
- [ ] Upload backend files ไปยัง Node.js hosting
- [ ] Install dependencies (`npm install --production`)
- [ ] ตั้งค่า Environment Variables ใน hPanel
- [ ] ตั้งค่า Start Command และ Port
- [ ] Start/Restart Node.js app
- [ ] ทดสอบ `/health` endpoint ✅

### Frontend:

- [ ] สร้างไฟล์ `.env.production` พร้อม `VITE_API_BASE`
- [ ] Build frontend (`npm run build`)
- [ ] Upload ไฟล์ทั้งหมดใน `dist/` ไปยัง `public_html/`
- [ ] Upload ไฟล์ `.htaccess`
- [ ] ทดสอบหน้าเว็บ ✅

### ตรวจสอบ:

- [ ] Frontend โหลดได้
- [ ] Frontend เชื่อมต่อ Backend API ได้
- [ ] ไม่มี CORS errors
- [ ] เริ่ม Interview ได้
- [ ] AI question generation ทำงานได้ (ถ้ามี API key)

---

## 🐛 Troubleshooting

### ❌ Backend ไม่ทำงาน

**ปัญหา**: Health endpoint ไม่ตอบสนอง

**วิธีแก้**:

1. ตรวจสอบ **Logs** ใน Node.js App panel
2. ตรวจสอบว่า PORT ถูกต้อง (ต้องตรงกับ Environment Variable)
3. ตรวจสอบว่า `.env` file มีอยู่และค่าถูกต้อง
4. ตรวจสอบว่า dependencies install แล้ว (`npm install`)
5. ตรวจสอบว่า Start Command ถูกต้อง

**ดู Logs**:

- ใน Node.js App panel → **Logs** หรือ **Terminal**
- หรือ SSH เข้าไปดู: `pm2 logs` หรือ `node logs`

---

### ❌ Frontend ไม่แสดง

**ปัญหา**: หน้าเว็บเป็น blank หรือ 404

**วิธีแก้**:

1. ตรวจสอบว่าไฟล์ทั้งหมดใน `dist/` ถูก upload แล้ว
2. ตรวจสอบว่า `index.html` อยู่ใน root ของ `public_html/`
3. ตรวจสอบว่าไฟล์ `.htaccess` มีอยู่
4. ตรวจสอบ Browser Console ดู errors
5. ตรวจสอบ Network tab ดูว่ามีไฟล์ไหนโหลดไม่ได้

---

### ❌ CORS Error

**ปัญหา**:

```
Access to fetch at 'https://api.yourdomain.com' from origin 'https://yourdomain.com' has been blocked by CORS policy
```

**วิธีแก้**:

1. แก้ไข CORS config ใน `backend/src/server.js` (ดูด้านบน)
2. Restart backend app
3. ตรวจสอบว่า origin URLs ถูกต้อง (ต้องมี https://)

---

### ❌ API Connection Failed

**ปัญหา**: Frontend ไม่สามารถเชื่อมต่อ Backend ได้

**วิธีแก้**:

1. ตรวจสอบว่า `VITE_API_BASE` ใน `.env.production` ถูกต้อง
2. Build frontend ใหม่หลังแก้ไข `.env.production`
3. ตรวจสอบว่า Backend ทำงานอยู่ (ทดสอบ `/health` endpoint)
4. ตรวจสอบ Browser Console → Network tab ดู request URL
5. ตรวจสอบว่า HTTPS/HTTP ตรงกันทั้ง Frontend และ Backend

---

### ❌ Environment Variables ไม่ทำงาน

**ปัญหา**: `import.meta.env.VITE_API_BASE` เป็น undefined

**วิธีแก้**:

1. ตรวจสอบว่าไฟล์ชื่อ `.env.production` (ไม่ใช่ `.env`)
2. ตรวจสอบว่าตัวแปรขึ้นต้นด้วย `VITE_`
3. ต้อง build ใหม่หลังแก้ไข `.env.production`:
   ```bash
   npm run build
   ```
4. ใน Vite environment variables จะถูก embed ลงใน bundle ตอน build

---

## 📝 คำแนะนำเพิ่มเติม

### Production Best Practices

1. **อย่าใช้ localhost ใน Production**:

   - ใช้ environment variables เสมอ
   - ไม่ hardcode URLs
2. **Security**:

   - อย่า commit `.env` files เข้า Git
   - ใช้ HTTPS เสมอ
   - ตรวจสอบ CORS settings
3. **Performance**:

   - Enable Gzip compression (Hostinger ทำให้อัตโนมัติ)
   - Cache static files (ผ่าน `.htaccess`)
4. **Monitoring**:

   - ตรวจสอบ logs เป็นประจำ
   - ตั้งค่า error tracking (ถ้ามี)

---

## 📞 รับความช่วยเหลือ

หากมีปัญหาการ deploy:

1. **ตรวจสอบ Hostinger Documentation**:

   - [Node.js Hosting Guide](https://support.hostinger.com/en/articles/4886059-node-js-apps)
   - [File Manager Guide](https://support.hostinger.com/en/articles/1585249-file-manager)
2. **ตรวจสอบ Logs**:

   - Node.js App Logs ใน hPanel
   - Browser Console (F12)
   - Network Tab
3. **Contact Support**:

   - Hostinger Support (ถ้ามีปัญหาเกี่ยวกับ hosting)
   - ตรวจสอบ code logs ก่อน

---

## 🎉 เสร็จสิ้น!

หลังจาก deploy เสร็จแล้ว:

- Frontend: `https://yourdomain.com`
- Backend API: `https://api.yourdomain.com`

ระบบพร้อมใช้งานแล้ว! 🚀
