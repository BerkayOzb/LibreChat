# Organizasyon Yönetimi ve Rol Sistemi

Bu dokümantasyon, LayeredMindAI platformunun çok kiracılı (multi-tenant) organizasyon yapısını ve rol tabanlı erişim kontrol sistemini açıklamaktadır.

---

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Rol Sistemi](#rol-sistemi)
3. [Organizasyon Yapısı](#organizasyon-yapısı)
4. [Üyelik Süresi Yönetimi](#üyelik-süresi-yönetimi)
5. [API Endpoints](#api-endpoints)
6. [Frontend Bileşenleri](#frontend-bileşenleri)
7. [Middleware ve Güvenlik](#middleware-ve-güvenlik)
8. [Kullanım Senaryoları](#kullanım-senaryoları)

---

## Genel Bakış

Platform, üç seviyeli bir rol sistemi kullanır:

| Rol | Kapsam | Açıklama |
|-----|--------|----------|
| **ADMIN** | Global | Tüm sistemi yönetir |
| **ORG_ADMIN** | Organizasyon | Kendi organizasyonunu yönetir |
| **USER** | Kişisel | Uygulamayı kullanır |

---

## Rol Sistemi

### ADMIN (Global Sistem Yöneticisi)

Global ADMIN, sistemin tamamı üzerinde yetkiye sahiptir.

**Yetkileri:**
- Organizasyon oluşturma, düzenleme ve silme
- ORG_ADMIN atama ve kaldırma
- Tüm kullanıcıları görüntüleme ve yönetme
- Kullanıcı rollerini değiştirme
- Kullanıcıları yasaklama (ban)
- Global prompt ve agent paylaşımı
- Marketplace erişimi
- Sistem genelinde istatistik görüntüleme

**Erişim:**
- `/api/admin/*` - Tüm admin endpoint'leri
- `/api/admin/organizations/*` - Organizasyon yönetimi

---

### ORG_ADMIN (Organizasyon Yöneticisi)

ORG_ADMIN, yalnızca kendi organizasyonu kapsamında yetkilere sahiptir.

**Yetkileri:**
- Kendi organizasyonundaki kullanıcıları görüntüleme
- Organizasyona yeni kullanıcı ekleme
- Kullanıcı bilgilerini güncelleme (isim)
- Kullanıcı üyelik süresini belirleme (`membershipExpiresAt`)
- Kullanıcı şifrelerini sıfırlama (diğer ORG_ADMIN'ler hariç)
- Kullanıcı silme (diğer ORG_ADMIN'ler hariç)
- Organizasyon istatistiklerini görüntüleme

**Kısıtlamaları:**
- Diğer organizasyonları göremez
- Kullanıcı rollerini değiştiremez
- Kullanıcıları yasaklayamaz (ban)
- Marketplace erişimi yok
- Global paylaşım yapamaz
- Diğer ORG_ADMIN'lerin şifrelerini sıfırlayamaz veya silemez

**Erişim:**
- `/api/organization/*` - Organizasyon endpoint'leri
- `/api/admin/users/*` - Kullanıcı yönetimi (kendi org kapsamında)

---

### USER (Standart Kullanıcı)

Standart kullanıcılar uygulamayı kullanabilir ancak yönetim paneline erişemez.

**Durumları:**
- **Aktif**: `membershipExpiresAt` gelecekte veya tanımsız
- **Süresi Dolmuş**: `membershipExpiresAt` geçmişte

---

## Organizasyon Yapısı

### Veritabanı Şeması

**Organization Collection:**
```javascript
{
  _id: ObjectId,
  name: String,        // Organizasyon adı
  code: String,        // Benzersiz kod (örn: "ACME")
  createdAt: Date,
  updatedAt: Date
}
```

**User Collection (Organizasyon ile ilgili alanlar):**
```javascript
{
  _id: ObjectId,
  email: String,
  role: String,                    // "ADMIN", "ORG_ADMIN", "USER"
  organization: ObjectId,          // Organization referansı
  membershipExpiresAt: Date,       // Üyelik bitiş tarihi (null = sınırsız)
  membershipVisible: Boolean,      // Üyelik bilgisinin kullanıcıya gösterilip gösterilmeyeceği
  // ... diğer alanlar
}
```

### Organizasyon - Kullanıcı İlişkisi

```
Organization (1) ←──── (N) User
     │
     └── code: "ACME"
           │
           ├── User (role: ORG_ADMIN, organization: ObjectId)
           ├── User (role: USER, organization: ObjectId)
           └── User (role: USER, organization: ObjectId)
```

---

## Üyelik Süresi Yönetimi

### Kullanıcı Durumları

| Durum | `membershipExpiresAt` | Açıklama |
|-------|----------------------|----------|
| Sınırsız | `null` veya `undefined` | Süre kısıtlaması yok |
| Aktif | Gelecek tarih | Üyelik aktif |
| Yakında Dolacak | 7 gün içinde | Uyarı gösterilir |
| Süresi Dolmuş | Geçmiş tarih | Erişim engellenir |

### Kontrol Noktaları

1. **Giriş Anında (Login)**
   - `LoginController` üyelik süresini kontrol eder
   - Süresi dolmuşsa 403 hatası döner
   - Frontend `ExpiredAccountModal` gösterir

2. **Oturum Açıkken (Session)**
   - `AuthContext` her 60 saniyede kontrol eder
   - Süre dolarsa modal gösterilir ve kullanıcı çıkış yapmak zorunda kalır

3. **API İsteklerinde**
   - `checkExpired` middleware tüm korumalı endpoint'lerde çalışır
   - Süresi dolmuş kullanıcılara 403 döner

### Hata Yanıtı

```json
{
  "message": "Your membership has expired",
  "expired": true,
  "expiredAt": "2025-12-09T00:00:00.000Z",
  "code": "MEMBERSHIP_EXPIRED"
}
```

---

## API Endpoints

### Organizasyon Yönetimi (Sadece ADMIN)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/organizations` | Tüm organizasyonları listele |
| POST | `/api/admin/organizations` | Yeni organizasyon oluştur |
| GET | `/api/admin/organizations/:id` | Organizasyon detayı |
| PUT | `/api/admin/organizations/:id` | Organizasyon güncelle |
| DELETE | `/api/admin/organizations/:id` | Organizasyon sil |
| GET | `/api/admin/organizations/:id/users` | Organizasyon kullanıcıları |
| POST | `/api/admin/organizations/:id/assign-admin` | ORG_ADMIN ata |
| DELETE | `/api/admin/organizations/:id/admins/:userId` | ORG_ADMIN kaldır |

### Organizasyon İşlemleri (ORG_ADMIN)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/organization/stats` | Organizasyon istatistikleri |
| GET | `/api/organization/users` | Kullanıcı listesi |
| PUT | `/api/organization/users/:userId` | Kullanıcı güncelle |

### Kullanıcı Yönetimi (ADMIN ve ORG_ADMIN)

| Method | Endpoint | ADMIN | ORG_ADMIN |
|--------|----------|-------|-----------|
| GET | `/api/admin/users` | Tüm kullanıcılar | Kendi org kullanıcıları |
| GET | `/api/admin/users/:id` | Herhangi bir kullanıcı | Kendi org kullanıcısı |
| POST | `/api/admin/users` | Herhangi bir kullanıcı oluştur | Kendi org'a kullanıcı ekle |
| PUT | `/api/admin/users/:id` | Herhangi bir kullanıcıyı güncelle | Kendi org kullanıcısını güncelle |
| PUT | `/api/admin/users/:id/password` | Şifre sıfırla | Şifre sıfırla (ORG_ADMIN hariç) |
| PUT | `/api/admin/users/:id/role` | Rol değiştir | Yasak (403) |
| PUT | `/api/admin/users/:id/status` | Durum değiştir | Yasak (403) |
| PUT | `/api/admin/users/:id/ban` | Yasakla | Yasak (403) |
| DELETE | `/api/admin/users/:id` | Sil | Sil (ORG_ADMIN hariç) |

---

## Frontend Bileşenleri

### Admin Panel

| Bileşen | Dosya | Rol | Açıklama |
|---------|-------|-----|----------|
| AdminDashboard | `AdminDashboard.tsx` | ADMIN | Sistem geneli dashboard |
| OrganizationList | `OrganizationManagement/OrganizationList.tsx` | ADMIN | Organizasyon listesi |
| OrganizationDetail | `OrganizationManagement/OrganizationDetail.tsx` | ADMIN | Organizasyon detayı |
| CreateOrganizationModal | `OrganizationManagement/CreateOrganizationModal.tsx` | ADMIN | Organizasyon oluşturma |

### ORG_ADMIN Panel

| Bileşen | Dosya | Açıklama |
|---------|-------|----------|
| OrgDashboard | `OrgDashboard.tsx` | ORG_ADMIN ana sayfası |
| OrgAdminStats | `OrgAdminStats.tsx` | Organizasyon istatistikleri |
| UserManagement | `UserManagement/*` | Kullanıcı yönetimi |

### Auth Bileşenleri

| Bileşen | Dosya | Açıklama |
|---------|-------|----------|
| AuthContext | `hooks/AuthContext.tsx` | Oturum ve rol yönetimi |
| ExpiredAccountModal | `Auth/ExpiredAccountModal.tsx` | Süresi dolmuş hesap modalı |
| ApiErrorWatcher | `Auth/ApiErrorWatcher.tsx` | 403 hatalarını yakalar |

---

## Middleware ve Güvenlik

### Middleware Zinciri

```
Request → requireJwtAuth → checkBan → checkExpired → [Role Check] → Controller
```

### Middleware Açıklamaları

| Middleware | Dosya | Açıklama |
|------------|-------|----------|
| `requireJwtAuth` | `middleware/requireJwtAuth.js` | JWT token doğrulama |
| `checkBan` | `middleware/checkBan.js` | Yasaklı kullanıcı kontrolü |
| `checkExpired` | `middleware/checkExpired.js` | Üyelik süresi kontrolü |
| `checkAdmin` | `middleware/roles/admin.js` | ADMIN rolü kontrolü |
| `requireSystemRole` | `middleware/requireSystemRole.js` | Belirli rol kontrolü |

---

## Kullanım Senaryoları

### Senaryo 1: Yeni Organizasyon Oluşturma

1. **ADMIN** `/api/admin/organizations` endpoint'ine POST isteği gönderir
2. Organizasyon oluşturulur (name, code)
3. **ADMIN** mevcut bir kullanıcıyı ORG_ADMIN olarak atar
4. Kullanıcının `role` alanı `ORG_ADMIN` olarak güncellenir
5. Kullanıcının `organization` alanı organizasyon ID'si ile güncellenir

### Senaryo 2: ORG_ADMIN Kullanıcı Ekleme

1. **ORG_ADMIN** admin paneline giriş yapar
2. "Kullanıcı Ekle" butonuna tıklar
3. Kullanıcı bilgilerini girer (email, isim, şifre)
4. Opsiyonel olarak üyelik süresi belirler
5. Kullanıcı otomatik olarak aynı organizasyona eklenir
6. Kullanıcının `role` alanı `USER` olarak atanır

### Senaryo 3: Üyelik Süresi Ayarlama

1. **ORG_ADMIN** kullanıcı listesinden bir kullanıcı seçer
2. "Üyelik Süresi Belirle" seçeneğini kullanır
3. Bitiş tarihi seçer
4. `membershipExpiresAt` alanı güncellenir
5. Tarih geçtiğinde kullanıcı otomatik olarak erişimini kaybeder

### Senaryo 4: Süresi Dolmuş Kullanıcı

1. Kullanıcı giriş yapmaya çalışır
2. `LoginController` üyelik süresini kontrol eder
3. Süre dolmuşsa 403 hatası döner
4. Frontend `ExpiredAccountModal` gösterir
5. Kullanıcı sadece "Çıkış Yap" butonuna tıklayabilir
6. Modal, organizasyon yöneticisiyle iletişime geçmesini önerir

### Senaryo 5: Oturum Açıkken Süre Dolması

1. Kullanıcı aktif oturumdayken süre dolar
2. `AuthContext` her 60 saniyede kontrol yapar
3. Süre dolduğunda `ExpiredAccountModal` gösterilir
4. API istekleri `checkExpired` middleware tarafından engellenir
5. Kullanıcı çıkış yapmak zorunda kalır

---

## Dosya Yapısı

```
api/server/
├── controllers/
│   ├── AdminController.js              # ADMIN kullanıcı işlemleri
│   ├── AdminOrganizationController.js  # ADMIN organizasyon işlemleri
│   └── OrganizationController.js       # ORG_ADMIN işlemleri
├── middleware/
│   ├── checkBan.js                     # Ban kontrolü
│   ├── checkExpired.js                 # Üyelik süresi kontrolü
│   ├── requireSystemRole.js            # Rol kontrolü
│   └── roles/
│       └── admin.js                    # ADMIN kontrolü
└── routes/
    ├── admin/
    │   ├── organizations.js            # Organizasyon route'ları
    │   └── users.js                    # Kullanıcı route'ları
    └── organization.js                 # ORG_ADMIN route'ları

client/src/
├── components/
│   ├── Admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── OrgDashboard.tsx
│   │   ├── OrgAdminStats.tsx
│   │   └── OrganizationManagement/
│   │       ├── OrganizationList.tsx
│   │       ├── OrganizationDetail.tsx
│   │       └── CreateOrganizationModal.tsx
│   └── Auth/
│       ├── ExpiredAccountModal.tsx
│       └── ApiErrorWatcher.tsx
├── data-provider/
│   └── Admin/
│       ├── organizations.ts            # Organizasyon API hooks
│       └── organization-management.ts  # ORG_ADMIN API hooks
└── hooks/
    └── AuthContext.tsx                 # Oturum yönetimi

packages/data-schemas/src/schema/
├── organization.ts                     # Organization şeması
└── user.ts                             # User şeması (org alanları)

packages/data-provider/src/
└── roles.ts                            # Rol tanımları ve izinler
```

---

## Notlar

- ORG_ADMIN'ler kendi hesaplarını silemez
- ORG_ADMIN'ler diğer ORG_ADMIN'lerin şifrelerini sıfırlayamaz veya silemez
- Organizasyon silinmeden önce tüm kullanıcıların kaldırılması gerekir
- `membershipExpiresAt` null ise kullanıcının sınırsız erişimi vardır
- Üyelik süresi dolduğunda kullanıcı hem giriş yapamaz hem de mevcut oturumu sonlandırılır
