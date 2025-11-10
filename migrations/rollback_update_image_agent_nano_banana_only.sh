#!/bin/bash

# Rollback: Remove or reset Görsel Üretici Agent
# Tarih: 2025-11-10

echo "=========================================="
echo "Görsel Üretici Agent - ROLLBACK"
echo "=========================================="
echo ""

echo "⚠️  Bu script 'Görsel Üretici' agent'ını database'den silecek."
echo ""
read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback iptal edildi."
    exit 1
fi

echo ""
echo "📦 Agent siliniyor..."

# MongoDB connection
MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/LibreChat}"

# Use mongosh to delete the agent
mongosh "$MONGO_URI" --quiet --eval '
const result = db.agents.deleteOne({
  name: "Görsel Üretici",
  author: "System"
});

if (result.deletedCount > 0) {
  print("✅ Görsel Üretici agent başarıyla silindi!");
  print("Agent ID: " + result.deletedId);
} else {
  print("⚠️  Görsel Üretici agent bulunamadı (zaten silinmiş olabilir).");
}
'

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Rollback başarıyla tamamlandı!"
    echo ""
    echo "📝 Yapılan işlemler:"
    echo "   - Görsel Üretici agent database'den silindi"
    echo ""
    echo "⚠️  NOT: Yeni agent oluşturmak için migration'ı tekrar çalıştırın:"
    echo "   node migrations/create_default_image_agent.js"
else
    echo ""
    echo "❌ Rollback başarısız oldu!"
    echo "Manuel düzeltme gerekebilir."
    exit 1
fi

echo "=========================================="
