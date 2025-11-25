// server.js

import path from "path";
import express from "express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();



// ============ CONFIG ============

const PORT = process.env.PORT || 3000;      // เปลี่ยน port ได้ตามต้องการ

const PUBLIC_DIR = path.join(__dirname, "../public"); // โฟลเดอร์เก็บไฟล์ static

// ================================

// เสิร์ฟไฟล์ static ทั้งหมดใน public/
// เช่น /index.html, /css/style.css, /js/app.js, /images/...
app.use(express.static(PUBLIC_DIR));

// ถ้าเป็น SPA (เช่น React/Vue) ให้ redirect ทุก path -> index.html
// ถ้าไม่ใช้ SPA จะตัด block นี้ออกก็ได้
app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Static web server running on http://localhost:${PORT}`);
});
