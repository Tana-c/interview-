# ⚡ Quick Start: Deploy บน VPS

## 🎯 ขั้นตอนย่อๆ (10 นาที)

### 1. เตรียม VPS (ครั้งเดียว)

```bash
# SSH เข้า VPS
ssh user@your-vps-ip

# ติดตั้ง Node.js, Nginx, PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
pm2 startup systemd

# ตั้งค่า Firewall
sudo ufw allow 22,80,443,7183/tcp
sudo ufw enable
```

### 2. Deploy Backend

```bash
# บน VPS - สร้างโฟลเดอร์
mkdir -p ~/interviewer-backend/backend
cd ~/interviewer-backend/backend

# Upload ไฟล์ backend/ จากเครื่อง local
# (ใช้ scp, rsync, หรือ FileZilla)

# สร้าง .env
nano .env
# ใส่:
# OPENAI_API_KEY=sk-...
# PORT=7183
# NODE_ENV=production
# ALLOWED_ORIGINS=https://yourdomain.com

# ติดตั้งและเริ่ม
npm install --production
pm2 start src/server.js --name interviewer-backend
pm2 save
```

### 3. Deploy Frontend

```bash
# บนเครื่อง local
cd frontend
echo "VITE_API_BASE=https://yourdomain.com" > .env.production
npm run build

# Upload ไปยัง VPS
scp -r dist/* user@vps-ip:/var/www/interviewer/frontend/
scp .htaccess user@vps-ip:/var/www/interviewer/frontend/
```

### 4. ตั้งค่า Nginx

```bash
# บน VPS
sudo nano /etc/nginx/sites-available/interviewer
```

ใส่:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location /aiinterview/ {
        alias /var/www/interviewer/frontend/;
        try_files $uri $uri/ /aiinterview/index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:7183;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/interviewer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## ✅ ตรวจสอบ

- Backend: `curl http://localhost:7183/health`
- Frontend: `https://yourdomain.com/aiinterview/`

---

## 📖 คู่มือเต็ม

ดู `VPS_DEPLOY.md` สำหรับรายละเอียด

