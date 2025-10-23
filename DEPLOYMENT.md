# 🚀 Veventures Production Deployment Guide

## 📋 Ön Gereksinimler

### 1. **Sistem Gereksinimleri**
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **RAM**: Minimum 4GB, Önerilen 8GB+
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores

### 2. **Yazılım Gereksinimleri**
```bash
# Node.js 18+ LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git
sudo apt-get install git

# PM2 (Process Manager)
sudo npm install -g pm2

# MongoDB 6.0+
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# MongoDB Shell (mongosh) - command line client
sudo apt-get install -y mongodb-mongosh

# Redis (opsiyonel - caching için)
sudo apt-get install redis-server
```

## 🔧 Deployment Adımları

### **1. Projeyi Clone Et**
```bash
# Production dizini oluştur
sudo mkdir -p /opt/veventures
sudo chown $USER:$USER /opt/veventures
cd /opt/veventures

# Projeyi clone et
git clone https://github.com/BerkayOzb/LibreChat.git .
```

### **1.1. Package-lock.json Güncelleme (İsteğe Bağlı)**
```bash
# Eğer brand name değişikliği (LibreChat → Veventures) varsa:
# Development ortamında package-lock.json'ı güncelle
rm package-lock.json client/package-lock.json
npm install --omit=dev
cd client && npm install --omit=dev && cd ..

# Güncellenmiş package-lock.json dosyalarını commit et
git add package-lock.json client/package-lock.json
git commit -m "fix: Update package-lock.json for @veventures scope"
git push origin main
```

### **2. Environment Variables Ayarla**
```bash
# Ana .env dosyasını oluştur
cp .env.example .env

# Kritik ayarları yap
nano .env
```

**Gerekli .env ayarları:**
```bash
# === CORE SETTINGS ===
NODE_ENV=production
HOST=0.0.0.0
PORT=3080

# === BRAND SETTINGS ===
APP_TITLE=Veventures
DOMAIN_SERVER=https://yourdomain.com

# === DATABASE ===
MONGO_URI=mongodb://localhost:27017/veventures
DATABASE_URL=mongodb://localhost:27017/veventures

# === SECURITY ===
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
CREDS_KEY=your-32-char-encryption-key
CREDS_IV=your-16-char-iv-here

# === AI PROVIDERS ===
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key

# === EMAIL (SMTP) ===
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# === REGISTRATION ===
ALLOW_REGISTRATION=true
ALLOW_SOCIAL_LOGIN=false
ALLOW_EMAIL_LOGIN=true

# === LOGGING ===
DEBUG_LOGGING=false
DEBUG_CONSOLE=false
```

### **3. MongoDB Kurulum ve Konfigürasyon**
```bash
# MongoDB servisini başlat
sudo systemctl start mongod
sudo systemctl enable mongod

# MongoDB güvenlik ayarları
mongosh
```

**MongoDB'de admin kullanıcı oluştur:**
```javascript
use admin
db.createUser({
  user: "veventuresAdmin",
  pwd: "strongPassword123",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

// Veventures database oluştur
use veventures
db.createUser({
  user: "veventures",
  pwd: "veventuresDbPassword",
  roles: ["readWrite"]
})
```

**.env'yi güncelle:**
```bash
MONGO_URI=mongodb://veventures:veventuresDbPassword@localhost:27017/veventures?authSource=veventures
```

### **4. Dependencies Yükle ve Build**
```bash
# Eğer package-lock.json sync sorunu varsa:
# rm package-lock.json && npm install --omit=dev

# Production dependencies (önerilen)
npm ci --omit=dev

# Data-schemas build
npm run build:data-schemas

# Data-provider build
npm run build:data-provider

# Frontend build
cd client
# Eğer package name değişikliği varsa: rm package-lock.json && npm install --omit=dev
npm ci --omit=dev
npm run build
cd ..
```

### **5. Nginx Reverse Proxy Kurulumu**
```bash
# Nginx yükle
sudo apt-get install nginx

# Nginx config oluştur
sudo nano /etc/nginx/sites-available/veventures
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # HTTP to HTTPS redirect
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Frontend static files
    location / {
        root /opt/veventures/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # OAuth routes
    location /oauth/ {
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Nginx'i aktifleştir:**
```bash
# Site'ı aktifleştir
sudo ln -s /etc/nginx/sites-available/veventures /etc/nginx/sites-enabled/

# Test ve restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### **6. SSL Certificate (Let's Encrypt)**
```bash
# Certbot yükle
sudo apt-get install certbot python3-certbot-nginx

# SSL certificate al
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### **7. PM2 ile Production Deployment**
```bash
# PM2 ecosystem dosyası oluştur
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'veventures-api',
    script: 'api/server/index.js',
    cwd: '/opt/veventures',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3080
    },
    error_file: '/var/log/veventures/api-error.log',
    out_file: '/var/log/veventures/api-out.log',
    log_file: '/var/log/veventures/api-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096'
  }]
};
```

**Log dizini oluştur ve PM2'yi başlat:**
```bash
# Log dizini
sudo mkdir -p /var/log/veventures
sudo chown $USER:$USER /var/log/veventures

# PM2 başlat
pm2 start ecosystem.config.js

# PM2'yi sistem başlangıcına ekle
pm2 startup
pm2 save
```

### **8. Firewall Ayarları**
```bash
# UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 27017  # MongoDB (sadece local)
```

### **9. Monitoring ve Logging**
```bash
# PM2 monitoring
pm2 monit

# Real-time logs
pm2 logs veventures-api

# System status
pm2 status

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Güncelleme İşlemleri

### **Yeni Version Deployment:**
```bash
#!/bin/bash
# deploy.sh script
cd /opt/veventures

# Backup
cp .env .env.backup
pm2 stop veventures-api

# Update code
git pull origin main

# Install dependencies
npm ci --omit=dev

# Build packages
npm run build:data-schemas
npm run build:data-provider

# Build frontend
cd client
npm ci --omit=dev
npm run build
cd ..

# Restart
pm2 restart veventures-api
pm2 save

echo "✅ Deployment completed!"
```

**Deploy script'ini çalıştırılabilir yap:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔐 Güvenlik Checklist

- [ ] **MongoDB authentication** aktif
- [ ] **JWT secrets** güçlü ve unique
- [ ] **HTTPS** zorunlu (HTTP redirect)
- [ ] **Firewall** sadece gerekli portları açık
- [ ] **Environment variables** güvenli
- [ ] **File permissions** doğru ayarlanmış
- [ ] **Backup stratejisi** mevcut
- [ ] **Rate limiting** aktif
- [ ] **Security headers** eklenmiş

## 📊 Performance Optimization

### **1. Database Indexes:**
```javascript
// MongoDB'de performans için index'ler
use veventures
db.conversations.createIndex({ "user": 1, "createdAt": -1 })
db.messages.createIndex({ "conversationId": 1, "createdAt": 1 })
db.admin_model_settings.createIndex({ "endpoint": 1, "isEnabled": 1 })
```

### **2. PM2 Cluster Mode:**
```javascript
// ecosystem.config.js'de
instances: 'max',  // CPU core sayısı kadar instance
exec_mode: 'cluster'
```

### **3. Nginx Caching:**
```nginx
# Nginx'de static asset caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔧 Troubleshooting

### **Yaygın Sorunlar ve Çözümleri:**

#### **1. MongoDB Connection Issues**
```bash
# MongoDB servis durumunu kontrol et
sudo systemctl status mongod

# MongoDB loglarını kontrol et
sudo tail -f /var/log/mongodb/mongod.log

# MongoDB restart
sudo systemctl restart mongod
```

#### **2. PM2 Process Issues**
```bash
# PM2 status kontrol
pm2 status

# Process restart
pm2 restart veventures-api

# PM2 logs
pm2 logs veventures-api --lines 100
```

#### **3. Nginx Issues**
```bash
# Nginx configuration test
sudo nginx -t

# Nginx reload
sudo systemctl reload nginx

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### **4. SSL Certificate Issues**
```bash
# Certificate durumunu kontrol et
sudo certbot certificates

# Certificate yenile
sudo certbot renew --force-renewal
```

## 📱 Health Check Endpoints

Sistem sağlığını kontrol etmek için:

```bash
# API health check
curl https://yourdomain.com/api/health

# MongoDB connection check
curl https://yourdomain.com/api/config
```

## 💾 Backup Strategy

### **1. MongoDB Backup:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/mongodb"
mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://veventures:password@localhost:27017/veventures" --out=$BACKUP_DIR/veventures_$DATE

# 7 günden eski backup'ları sil
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

### **2. Application Backup:**
```bash
#!/bin/bash
# app-backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/app"
mkdir -p $BACKUP_DIR

# .env ve config dosyalarını backup'la
tar -czf $BACKUP_DIR/veventures_config_$DATE.tar.gz \
  /opt/veventures/.env \
  /opt/veventures/ecosystem.config.js \
  /etc/nginx/sites-available/veventures
```

### **3. Crontab ile Otomatik Backup:**
```bash
# Crontab edit
crontab -e

# Her gün 02:00'da backup al
0 2 * * * /opt/veventures/scripts/backup.sh
0 2 * * * /opt/veventures/scripts/app-backup.sh
```

Bu deployment guide ile Veventures projenizi production ortamında güvenli, performanslı ve yönetilebilir şekilde çalıştırabilirsiniz! 🚀