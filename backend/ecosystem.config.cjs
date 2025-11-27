// PM2 Ecosystem Configuration
// ใช้คำสั่ง: pm2 start ecosystem.config.cjs --env production
// Note: PM2 config ต้องใช้ CommonJS format (.cjs extension)

const path = require('path');

module.exports = {
  apps: [{
    name: 'ai-interviewer',
    // ใช้ node โดยตรง - Node.js จะอ่าน package.json และรู้ว่าเป็น ES module
    script: path.join(__dirname, 'src/server.js'),
    interpreter: 'node',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 7183,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 7183,
      HOST: '0.0.0.0',
      VPS_IP: '72.61.120.205'
    },
    // Auto restart on crash
    autorestart: true,
    // Watch for file changes (development only)
    watch: false,
    // Max memory usage (restart if exceeded)
    max_memory_restart: '500M',
    // Log files
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    // Merge logs from all instances
    merge_logs: true,
    // Restart delay
    restart_delay: 4000,
    // Max restarts
    max_restarts: 10,
    // Min uptime to consider stable
    min_uptime: '10s'
  }]
};

