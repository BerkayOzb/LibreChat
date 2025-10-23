# 📊 Veventures Database Seed Data

Bu dizin, Veventures projesinin otomatik kurulum için kullanılan seed data'larını içerir.

## 📁 Dizin Yapısı

```
database/
├── seed/
│   └── LibreChat/           # MongoDB export dosyaları
│       ├── admin_endpoint_settings.bson
│       ├── admin_model_settings.bson
│       ├── users.bson
│       ├── conversations.bson
│       └── ...              # Diğer collection'lar
└── README.md
```

## 🚀 Kullanım

### Otomatik Kurulum
```bash
# Tek komutla kurulum
npm run deploy:fresh

# Sadece database setup
npm run setup:db
```

### Manuel Kurulum
```bash
# Database seed data'sını import et
mongorestore --uri="mongodb://veventures:password@localhost:27017/veventures?authSource=veventures" \
  --drop \
  ./database/seed/LibreChat/
```

## 🔄 Seed Data Güncelleme

Yeni seed data oluşturmak için:

```bash
# Mevcut database'i export et
mongodump --uri="mongodb://localhost:27017/LibreChat" \
  --out=./database/seed

# Ya da production'dan
mongodump --uri="mongodb://veventures:password@localhost:27017/veventures?authSource=veventures" \
  --out=./database/seed
```

## 📋 İçerik

Seed data şunları içerir:

### Admin Collections
- **admin_endpoint_settings**: Endpoint yönetimi (OpenAI, Anthropic, Google, etc.)
- **admin_model_settings**: Model yönetimi (GPT-4, Claude, Gemini, etc.)
- **admin_api_keys**: API key yönetimi

### Core Collections  
- **users**: Kullanıcı hesapları
- **roles**: Roller (USER, ADMIN)
- **accessroles**: Erişim rolleri
- **conversations**: Örnek konuşmalar
- **messages**: Örnek mesajlar

### System Collections
- **sessions**: Oturum yönetimi
- **transactions**: İşlem geçmişi
- **agentcategories**: Agent kategorileri

## ⚠️ Güvenlik Notları

- Seed data'da gerçek API key'ler yoktur
- Şifreler hash'lenmiş şekildedir  
- Production'da yeni şifreler oluşturun
- .env dosyasındaki secret'ları değiştirin

## 🔧 Troubleshooting

### Database Connection Hatası
```bash
# MongoDB'un çalıştığını kontrol edin
sudo systemctl status mongod

# MongoDB'u başlatın
sudo systemctl start mongod
```

### Import Hatası
```bash
# MongoDB user'larını kontrol edin
mongosh --eval "use admin; db.getUsers()"

# User'ları yeniden oluşturun
mongosh scripts/setup-database.sh
```

### Permission Hatası
```bash
# Script'e execute permission verin
chmod +x scripts/setup-database.sh
```