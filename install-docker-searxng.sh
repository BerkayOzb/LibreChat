#!/bin/bash
# SearXNG Docker Kurulum Script'i
# LibreChat için standalone SearXNG container kurulumu

echo "============================================"
echo "SearXNG Docker Kurulum Script'i"
echo "============================================"
echo ""

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Adım 1: Docker kurulu mu kontrol et
echo -e "${YELLOW}[1/6] Docker kontrolü...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker zaten kurulu!${NC}"
    docker --version
else
    echo -e "${YELLOW}→ Docker kurulumu başlatılıyor...${NC}"

    # Docker GPG key ekle
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    # Docker repository ekle
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Docker kur
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    echo -e "${GREEN}✓ Docker kuruldu!${NC}"
fi

echo ""

# Adım 2: Kullanıcıyı docker grubuna ekle
echo -e "${YELLOW}[2/6] Docker grup izinleri...${NC}"
if groups $USER | grep -q '\bdocker\b'; then
    echo -e "${GREEN}✓ Kullanıcı zaten docker grubunda!${NC}"
else
    echo -e "${YELLOW}→ Kullanıcı docker grubuna ekleniyor...${NC}"
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Kullanıcı docker grubuna eklendi!${NC}"
    echo -e "${RED}⚠ NOT: Değişikliklerin aktif olması için logout/login yapın veya 'newgrp docker' çalıştırın${NC}"
fi

echo ""

# Adım 3: Docker servisini başlat
echo -e "${YELLOW}[3/6] Docker servisi kontrolü...${NC}"
if sudo service docker status | grep -q "running"; then
    echo -e "${GREEN}✓ Docker servisi çalışıyor!${NC}"
else
    echo -e "${YELLOW}→ Docker servisi başlatılıyor...${NC}"
    sudo service docker start
    echo -e "${GREEN}✓ Docker servisi başlatıldı!${NC}"
fi

# Otomatik başlatma
sudo systemctl enable docker 2>/dev/null || echo "systemctl bulunamadı (WSL kullanıyorsunuz)"

echo ""

# Adım 4: Mevcut SearXNG container'ını kaldır (varsa)
echo -e "${YELLOW}[4/6] Mevcut SearXNG container kontrolü...${NC}"
if docker ps -a | grep -q searxng; then
    echo -e "${YELLOW}→ Mevcut SearXNG container kaldırılıyor...${NC}"
    docker stop searxng 2>/dev/null
    docker rm searxng 2>/dev/null
    echo -e "${GREEN}✓ Eski container kaldırıldı!${NC}"
else
    echo -e "${GREEN}✓ Mevcut container yok, devam ediliyor...${NC}"
fi

echo ""

# Adım 5: SearXNG container'ını çalıştır
echo -e "${YELLOW}[5/6] SearXNG container başlatılıyor...${NC}"
docker run -d \
  --name searxng \
  --restart always \
  -p 8080:8080 \
  -v /home/berkay/libreChat/LibreChat/searxng:/etc/searxng:rw \
  -e INSTANCE_NAME="Veventures Search" \
  -e SEARXNG_BASE_URL=http://localhost:8080/ \
  searxng/searxng:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SearXNG container başarıyla çalıştırıldı!${NC}"
else
    echo -e "${RED}✗ SearXNG container başlatılamadı!${NC}"
    exit 1
fi

echo ""

# Adım 6: Health check
echo -e "${YELLOW}[6/6] SearXNG health check...${NC}"
echo "Container'ın başlaması bekleniyor (5 saniye)..."
sleep 5

if docker ps | grep -q searxng; then
    echo -e "${GREEN}✓ SearXNG container çalışıyor!${NC}"
    echo ""
    echo "Container bilgileri:"
    docker ps | grep searxng
    echo ""
    echo "Test URL: http://localhost:8080"
    echo ""
    echo -e "${YELLOW}Test komutu:${NC}"
    echo "curl http://localhost:8080"
else
    echo -e "${RED}✗ SearXNG container çalışmıyor!${NC}"
    echo "Logları kontrol edin: docker logs searxng"
    exit 1
fi

echo ""
echo "============================================"
echo -e "${GREEN}✓ Kurulum tamamlandı!${NC}"
echo "============================================"
echo ""
echo "Sonraki adımlar:"
echo "1. .env dosyasını güncelleyin:"
echo "   SEARXNG_INSTANCE_URL=http://localhost:8080"
echo ""
echo "2. LibreChat backend'i restart edin"
echo ""
echo "3. Web search'ü test edin:"
echo "   curl 'http://localhost:8080/search?q=test&format=json'"
echo ""
echo "Container yönetimi:"
echo "  - Başlat:  docker start searxng"
echo "  - Durdur:  docker stop searxng"
echo "  - Loglar:  docker logs -f searxng"
echo "  - Sil:     docker stop searxng && docker rm searxng"
echo ""
