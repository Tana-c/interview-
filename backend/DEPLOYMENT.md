# 🚀 คู่มือการ Deploy บน VPS

คู่มือนี้จะช่วยคุณ deploy AI Interviewer Backend บน VPS IP: **72.61.120.205**

## 📋 สิ่งที่ต้องเตรียม

1. VPS ที่มี Node.js ติดตั้งแล้ว (แนะนำ Node.js 18+)
2. SSH access ไปยัง VPS
3. OpenAI API Key (ถ้าต้องการใช้ AI)

---

## 🔧 ขั้นตอนการ Deploy

### 1. เชื่อมต่อ VPS ผ่าน SSH

```bash
ssh root@72.61.120.205
# หรือ
ssh your-username@72.61.120.205
```

### 2. ติดตั้ง Node.js (ถ้ายังไม่มี)

```bash
# สำหรับ Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# ตรวจสอบเวอร์ชัน
node --version
npm --version
```

### 3. ติดตั้ง PM2 (Process Manager)

```bash
npm install -g pm2
```

### 4. อัปโหลดไฟล์โปรเจค

**วิธีที่ 1: ใช้ Git (แนะนำ)**
```bash
# บน VPS
cd /var/www  # หรือ directory ที่ต้องการ
git clone <your-repo-url> Interviewer
cd Interviewer/backend
```

**วิธีที่ 2: ใช้ SCP จากเครื่อง local**
```bash
# บนเครื่อง local
scp -r backend/ root@72.61.120.205:/var/www/Interviewer/
```

**วิธีที่ 3: ใช้ rsync**
```bash
rsync -avz --exclude 'node_modules' backend/ root@72.61.120.205:/var/www/Interviewer/backend/
```

### 5. ติดตั้ง Dependencies

```bash
cd /var/www/Interviewer/backend
npm install --production
```

### 6. สร้างไฟล์ .env สำหรับ Production

```bash
nano .env
```

เพิ่มเนื้อหาดังนี้:

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-api-key-here

# Server Configuration
PORT=7183
HOST=0.0.0.0
VPS_IP=72.61.120.205

# Node Environment
NODE_ENV=production

# CORS - อนุญาต origin ที่ต้องการ (ถ้ามี frontend แยก)
ALLOWED_ORIGINS=http://72.61.120.205,http://72.61.120.205:7183,http://localhost:3000
```

บันทึกไฟล์: `Ctrl+O`, `Enter`, `Ctrl+X`

### 7. สร้างโฟลเดอร์ที่จำเป็น

```bash
mkdir -p data/sessions
```

### 8. ตั้งค่า Firewall (UFW)

```bash
# เปิด port 7183
sudo ufw allow 7183/tcp
sudo ufw reload

# ตรวจสอบสถานะ
sudo ufw status
```

### 9. รันด้วย PM2

```bash
# รันแอปพลิเคชัน
pm2 start src/server.js --name "ai-interviewer"

# หรือใช้ npm script
pm2 start npm --name "ai-interviewer" -- start

# ดูสถานะ
pm2 status

# ดู logs
pm2 logs ai-interviewer

# บันทึก PM2 config เพื่อ auto-start เมื่อ reboot
pm2 save
pm2 startup
```

### 10. ตรวจสอบว่า Server ทำงาน

```bash
# ตรวจสอบบน VPS
curl http://localhost:7183/health

# หรือจากเครื่อง local
curl http://72.61.120.205:7183/health
```

---

## 🔄 การจัดการ PM2

```bash
# ดูสถานะ
pm2 status

# ดู logs
pm2 logs ai-interviewer

# Restart
pm2 restart ai-interviewer

# Stop
pm2 stop ai-interviewer

# Delete
pm2 delete ai-interviewer

# Monitor
pm2 monit
```

---

## 🌐 ตั้งค่า Nginx Reverse Proxy (แนะนำ)

### 1. ติดตั้ง Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 2. สร้าง Nginx Config

```bash
sudo nano /etc/nginx/sites-available/ai-interviewer
```

เพิ่มเนื้อหาดังนี้:

```nginx
server {
    listen 80;
    server_name 72.61.120.205;

    # สำหรับ frontend
    location /aiinterview {
        proxy_pass http://localhost:7183;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # สำหรับ API
    location /api {
        proxy_pass http://localhost:7183;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:7183;
    }
}
```

### 3. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/ai-interviewer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. เปิด Firewall สำหรับ HTTP/HTTPS

```bash
sudo ufw allow 'Nginx Full'
```

---

## 🔒 ตั้งค่า SSL/HTTPS (แนะนำ)

### ใช้ Let's Encrypt (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📝 การอัปเดตแอปพลิเคชัน

```bash
# 1. Pull code ใหม่
cd /var/www/Interviewer/backend
git pull

# 2. ติดตั้ง dependencies ใหม่ (ถ้ามี)
npm install --production

# 3. Restart PM2
pm2 restart ai-interviewer

# 4. ตรวจสอบ logs
pm2 logs ai-interviewer
```

---

## 🐛 Troubleshooting

### Server ไม่ทำงาน

```bash
# ตรวจสอบ PM2 status
pm2 status

# ดู logs
pm2 logs ai-interviewer --lines 50

# ตรวจสอบ port
sudo netstat -tulpn | grep 7183
```

### Port ถูกใช้งานแล้ว

```bash
# หา process ที่ใช้ port
sudo lsof -i :7183

# Kill process
sudo kill -9 <PID>
```

### Firewall Block

```bash
# ตรวจสอบ firewall
sudo ufw status

# เปิด port
sudo ufw allow 7183/tcp
```

### ตรวจสอบ Environment Variables

```bash
# ตรวจสอบว่า .env ถูกโหลด
pm2 logs ai-interviewer | grep "OpenAI API Key"
```

---

## 📊 Monitoring

### ดู Resource Usage

```bash
pm2 monit
```

### ดู Logs แบบ Real-time

```bash
pm2 logs ai-interviewer --lines 100
```

---

## ✅ Checklist

- [ ] Node.js ติดตั้งแล้ว
- [ ] PM2 ติดตั้งแล้ว
- [ ] ไฟล์โปรเจคอัปโหลดแล้ว
- [ ] Dependencies ติดตั้งแล้ว
- [ ] ไฟล์ .env สร้างแล้ว
- [ ] Firewall เปิด port 7183 แล้ว
- [ ] PM2 รันแอปพลิเคชันแล้ว
- [ ] Health check ผ่าน
- [ ] สามารถเข้าถึงจากภายนอกได้

---

## 🔗 URLs

หลังจาก deploy สำเร็จ:

- **API Health Check**: `http://72.61.120.205:7183/health`
- **Frontend**: `http://72.61.120.205:7183/aiinterview`
- **API Base**: `http://72.61.120.205:7183/api`

---

## 📞 Support

ถ้ามีปัญหาหรือคำถาม สามารถตรวจสอบ logs ได้ที่:
```bash
pm2 logs ai-interviewer
```

