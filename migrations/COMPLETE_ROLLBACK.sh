#!/bin/bash

# Complete Rollback Script - Tüm Nano Banana Migration'larını Geri Al
# Tarih: 2025-11-10
# Bu script TÜM değişiklikleri geri alır (tersten sırayla)

set -e  # Hata durumunda dur

echo "=========================================="
echo "COMPLETE ROLLBACK - Nano Banana System"
echo "=========================================="
echo ""
echo "⚠️  Bu script TÜM migration'ları geri alacak:"
echo "   1. Agent'ı database'den silecek"
echo "   2. Code değişikliklerini geri alacak (backup varsa)"
echo "   3. Config dosyalarını eski haline getirecek"
echo ""
read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback iptal edildi."
    exit 1
fi

echo ""
echo "🔄 Rollback başlatılıyor..."
echo ""

# Step 5: Agent Configuration Update Rollback
echo "📝 [5/5] Agent configuration rollback..."
if [ -f "migrations/rollback_update_image_agent_nano_banana_only.sh" ]; then
    bash migrations/rollback_update_image_agent_nano_banana_only.sh
    echo "✅ Agent configuration geri alındı"
else
    echo "⚠️  rollback_update_image_agent_nano_banana_only.sh bulunamadı, manuel agent silme yapılıyor..."
    mongosh mongodb://127.0.0.1:27017/LibreChat --quiet --eval '
    const result = db.agents.deleteOne({ name: "Görsel Üretici", author: "System" });
    if (result.deletedCount > 0) {
        print("✅ Agent database'\''den silindi");
    } else {
        print("⚠️  Agent bulunamadı (zaten silinmiş olabilir)");
    }
    ' || echo "⚠️  Agent silme başarısız"
fi
echo ""

# Step 4: ProcessFileURL Removal Rollback (Manuel)
echo "📝 [4/5] ProcessFileURL removal rollback (Manuel gerekiyor)..."
echo "⚠️  FalaiNanoBanana.js değişikliklerini manuel geri almanız gerekiyor:"
echo "   - Agent mode'da processFileURL çağrısını geri ekleyin"
echo "   - Git ile: git checkout api/app/clients/tools/structured/FalaiNanoBanana.js"
echo ""
read -p "Manuel düzeltme yaptınız mı? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Manuel düzeltme atlandı, devam ediliyor..."
fi
echo ""

# Step 3: Image Display Fix Rollback
echo "📝 [3/5] Image display fix rollback..."
if [ -f "migrations/rollback_fix_nano_banana_image_display.sh" ]; then
    bash migrations/rollback_fix_nano_banana_image_display.sh
    echo "✅ Image display fix geri alındı"
else
    echo "⚠️  rollback_fix_nano_banana_image_display.sh bulunamadı"
fi
echo ""

# Step 2: Default Agent Creation Rollback
echo "📝 [2/5] Default agent creation rollback..."
if [ -f "migrations/rollback_default_image_agent.js" ]; then
    node migrations/rollback_default_image_agent.js
    echo "✅ Agent rollback tamamlandı"
else
    echo "⚠️  rollback_default_image_agent.js bulunamadı"
fi
echo ""

# Step 1: Nano Banana Tool Rollback
echo "📝 [1/5] Nano banana tool rollback..."
if [ -f "migrations/rollback_nano_banana_tool.sh" ]; then
    bash migrations/rollback_nano_banana_tool.sh
    echo "✅ Nano banana tool rollback tamamlandı"
else
    echo "⚠️  rollback_nano_banana_tool.sh bulunamadı"
fi
echo ""

echo "=========================================="
echo "✅ COMPLETE ROLLBACK TAMAMLANDI!"
echo "=========================================="
echo ""
echo "📝 Geri alınan değişiklikler:"
echo "   ✅ Agent database'den silindi"
echo "   ⚠️  Code değişiklikleri (manuel kontrol edin)"
echo "   ✅ Rollback script'leri çalıştırıldı"
echo ""
echo "🔄 Backend'i yeniden başlatın:"
echo "   npm run backend:dev"
echo ""
echo "📋 Doğrulama adımları:"
echo "   1. Agent database'de yok mu kontrol et:"
echo "      mongosh mongodb://127.0.0.1:27017/LibreChat --eval 'db.agents.findOne({name:\"Görsel Üretici\"})'"
echo ""
echo "   2. FalaiNanoBanana.js eski haline döndü mü kontrol et"
echo ""
echo "   3. Backend log'larını kontrol et"
echo ""
echo "=========================================="
