# ใช้ Node LTS แบบเบา ๆ
FROM node:20-alpine

# ตั้ง working directory ใน container
WORKDIR /usr/src/app

# ก็อปไฟล์ package ก่อน (เพื่อ cache layer install dependencies)
COPY package*.json ./

# ติดตั้ง dependencies แบบ production (ตัด devDependencies ทิ้ง)
RUN npm ci --omit=dev

# ก็อป source code ทั้งหมดเข้าไป
COPY . .

# ถ้ามี ENV ก็ใส่ไว้ตรงนี้ได้
# ENV NODE_ENV=production

# Port ที่แอปเราฟังอยู่ (เช่น 3000)
EXPOSE 3000

# คำสั่งรันแอป
CMD ["node", "server.js"]
