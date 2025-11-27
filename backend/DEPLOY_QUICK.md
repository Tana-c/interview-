# 🚀 Quick Deploy Guide - VPS 72.61.120.205

## คำสั่งรวดเร็วสำหรับ Deploy

### 1. บน VPS - ติดตั้ง PM2

```bash
npm install -g pm2
```

### 2. อัปโหลดไฟล์ (เลือกวิธีใดวิธีหนึ่ง)

**วิธี A: Git**

```bash
cd /var/www
git clone <your-repo> Interviewer
cd Interviewer/backend
```

**วิธี B: SCP จากเครื่อง local**

```bash
# บนเครื่อง local
scp -r backend/ root@72.61.120.205:/var/www/Interviewer/
```

### 3. ติดตั้งและตั้งค่า

```bash
cd /var/www/Interviewer/backend
npm install --production
mkdir -p data/sessions logs
```

### 4. สร้างไฟล์ .env

```bash
nano .env
```

เพิ่ม:

```env
OPENAI_API_KEY=sk-your-key-here
PORT=7183
HOST=0.0.0.0
VPS_IP=72.61.120.205
NODE_ENV=production
```

### 5. เปิด Firewall

```bash
sudo ufw allow 7183/tcp
sudo ufw reload
```

### 6. รันด้วย PM2

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

### 7. ตรวจสอบ

```bash
pm2 status
pm2 logs ai-interviewer
curl http://localhost:7183/health
```

## ✅ เสร็จแล้ว!

เข้าถึงได้ที่:

- **Frontend**: http://72.61.120.205:7183/aiinterview
- **API Health**: http://72.61.120.205:7183/health

---

ดูรายละเอียดเพิ่มเติมที่ `DEPLOYMENT.md`
