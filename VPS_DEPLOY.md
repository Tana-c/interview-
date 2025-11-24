# 🚀 คู่มือการ Deploy AI Interviewer บน VPS

## 📋 สิ่งที่ต้องเตรียม

1. **VPS Server** (Ubuntu 20.04+ หรือ Debian 11+)
2. **Domain Name** (ถ้ามี)
3. **OpenAI API Key**
4. **SSH Access** ไปยัง VPS

---

## 🔧 ขั้นตอนที่ 1: เตรียม VPS

### 1.1 เชื่อมต่อ VPS

```bash
ssh root@your-vps-ip
# หรือ
ssh username@your-vps-ip
```

### 1.2 อัปเดตระบบ

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 ติดตั้ง Node.js (v18 หรือ v20)

```bash
# ติดตั้ง Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ตรวจสอบ version
node --version
npm --version
```

### 1.4 ติดตั้ง Nginx

```bash
sudo apt install -y nginx

# เริ่ม Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# ตรวจสอบสถานะ
sudo systemctl status nginx
```

### 1.5 ติดตั้ง PM2 (Process Manager)

```bash
sudo npm install -g pm2

# ตั้งค่า PM2 ให้เริ่มอัตโนมัติเมื่อ reboot
pm2 startup systemd
# ทำตามคำแนะนำที่แสดง
```

### 1.6 ตั้งค่า Firewall

```bash
# เปิด port ที่จำเป็น
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 7183/tcp  # Backend API (ถ้าต้องการเปิดให้เข้าจากภายนอก)

# เปิดใช้งาน firewall
sudo ufw enable

# ตรวจสอบสถานะ
sudo ufw status
```

---

## 📦 ขั้นตอนที่ 2: Deploy Backend

### 2.1 สร้างโฟลเดอร์และ Upload ไฟล์

```bash
# สร้างโฟลเดอร์สำหรับ application
sudo mkdir -p /var/www/interviewer
sudo chown -R $USER:$USER /var/www/interviewer

# หรือใช้ home directory
mkdir -p ~/interviewer-backend
cd ~/interviewer-backend
```

**Upload ไฟล์ Backend:**
- ใช้ `scp` หรือ `rsync` หรือ `FileZilla` (SFTP)
- Upload โฟลเดอร์ `backend/` ทั้งหมด

```bash
# จากเครื่อง local
scp -r backend/ user@your-vps-ip:~/interviewer-backend/
```

### 2.2 ติดตั้ง Dependencies

```bash
cd ~/interviewer-backend/backend
npm install --production
```

### 2.3 สร้างไฟล์ `.env`

```bash
nano .env
```

ใส่เนื้อหาดังนี้:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=7183
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,http://localhost:8054
```

**บันทึก:** กด `Ctrl+X` แล้ว `Y` แล้ว `Enter`

### 2.4 เริ่ม Backend ด้วย PM2

```bash
cd ~/interviewer-backend/backend
pm2 start src/server.js --name interviewer-backend
pm2 save

# ตรวจสอบสถานะ
pm2 status
pm2 logs interviewer-backend
```

### 2.5 ตรวจสอบ Backend

```bash
# ทดสอบ local
curl http://localhost:7183/health

# ควรได้ response: {"status":"ok","timestamp":"..."}
```

---

## 🌐 ขั้นตอนที่ 3: Deploy Frontend

### 3.1 Build Frontend บนเครื่อง Local

```bash
cd frontend

# สร้างไฟล์ .env.production
echo "VITE_API_BASE=https://api.yourdomain.com" > .env.production
# หรือ
echo "VITE_API_BASE=http://your-vps-ip:7183" > .env.production

# Build
npm install
npm run build
```

### 3.2 Upload ไฟล์ Frontend

```bash
# สร้างโฟลเดอร์บน VPS
sudo mkdir -p /var/www/interviewer/frontend
sudo chown -R $USER:$USER /var/www/interviewer

# Upload ไฟล์จากเครื่อง local
scp -r frontend/dist/* user@your-vps-ip:/var/www/interviewer/frontend/
scp frontend/.htaccess user@your-vps-ip:/var/www/interviewer/frontend/
```

### 3.3 ตั้งค่า Nginx สำหรับ Frontend

```bash
sudo nano /etc/nginx/sites-available/interviewer
```

ใส่เนื้อหาดังนี้:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend - AI Interview
    location /aiinterview/ {
        alias /var/www/interviewer/frontend/;
        try_files $uri $uri/ /aiinterview/index.html;
        index index.html;
    }
    
    # Backend API Proxy
    location /api/ {
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
    
    # Health check
    location /health {
        proxy_pass http://localhost:7183;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

**บันทึก:** `Ctrl+X` → `Y` → `Enter`

### 3.4 Enable Site และ Restart Nginx

```bash
# สร้าง symbolic link
sudo ln -s /etc/nginx/sites-available/interviewer /etc/nginx/sites-enabled/

# ตรวจสอบ configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 ขั้นตอนที่ 4: ตั้งค่า SSL (HTTPS)

### 4.1 ติดตั้ง Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 4.2 ขอ SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

ทำตามคำแนะนำ:
- ใส่อีเมล
- ยอมรับ terms of service
- เลือก redirect HTTP to HTTPS

### 4.3 Auto-renewal

```bash
# ตรวจสอบ auto-renewal
sudo certbot renew --dry-run
```

---

## 🔧 ขั้นตอนที่ 5: ตั้งค่าเพิ่มเติม

### 5.1 อัปเดต Nginx Config สำหรับ HTTPS

```bash
sudo nano /etc/nginx/sites-available/interviewer
```

แก้ไขเป็น:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend
    location /aiinterview/ {
        alias /var/www/interviewer/frontend/;
        try_files $uri $uri/ /aiinterview/index.html;
        index index.html;
    }
    
    # Backend API
    location /api/ {
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
    
    location /health {
        proxy_pass http://localhost:7183;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5.2 อัปเดต Frontend .env.production

```bash
# บนเครื่อง local
cd frontend
echo "VITE_API_BASE=https://yourdomain.com" > .env.production
npm run build

# Upload ใหม่
scp -r dist/* user@your-vps-ip:/var/www/interviewer/frontend/
```

---

## ✅ ตรวจสอบการ Deploy

### ตรวจสอบ Backend

```bash
# บน VPS
curl http://localhost:7183/health

# จากเครื่อง local
curl https://yourdomain.com/health
```

### ตรวจสอบ Frontend

เปิด Browser:
- `https://yourdomain.com/aiinterview/`
- `https://yourdomain.com/aiinterview/config`

---

## 🔄 การอัปเดต

### อัปเดต Backend

```bash
# บน VPS
cd ~/interviewer-backend/backend
git pull  # ถ้าใช้ git
# หรือ upload ไฟล์ใหม่

# Restart
pm2 restart interviewer-backend
pm2 logs interviewer-backend
```

### อัปเดต Frontend

```bash
# บนเครื่อง local
cd frontend
npm run build

# Upload
scp -r dist/* user@your-vps-ip:/var/www/interviewer/frontend/
```

---

## 🐛 Troubleshooting

### Backend ไม่ทำงาน

```bash
# ตรวจสอบ logs
pm2 logs interviewer-backend

# ตรวจสอบสถานะ
pm2 status

# Restart
pm2 restart interviewer-backend
```

### Nginx Error

```bash
# ตรวจสอบ configuration
sudo nginx -t

# ดู error logs
sudo tail -f /var/log/nginx/error.log
```

### Permission Issues

```bash
# แก้ไข permissions
sudo chown -R www-data:www-data /var/www/interviewer
sudo chmod -R 755 /var/www/interviewer
```

### CORS Error

ตรวจสอบ `ALLOWED_ORIGINS` ใน `.env`:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 📝 Checklist

- [ ] VPS พร้อมใช้งาน
- [ ] Node.js ติดตั้งแล้ว
- [ ] Nginx ติดตั้งและตั้งค่าแล้ว
- [ ] PM2 ติดตั้งแล้ว
- [ ] Backend deploy และรันด้วย PM2
- [ ] Frontend build และ upload แล้ว
- [ ] Nginx config ถูกต้อง
- [ ] SSL Certificate ติดตั้งแล้ว
- [ ] Firewall ตั้งค่าแล้ว
- [ ] ทดสอบ Frontend และ Backend ทำงานได้

---

## 🎉 เสร็จสิ้น!

ระบบพร้อมใช้งานแล้ว:
- Frontend: `https://yourdomain.com/aiinterview/`
- Backend API: `https://yourdomain.com/api/`
- Health Check: `https://yourdomain.com/health`

