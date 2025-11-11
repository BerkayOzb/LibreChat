#!/bin/bash

# Rollback: Fix Nano Banana Image Display in Chat
# Tarih: 2025-11-10
# Bu script değişiklikleri geri alır

echo "=========================================="
echo "Nano Banana Image Display Fix - ROLLBACK"
echo "=========================================="
echo ""

# Dosya yolu
FILE_PATH="api/app/clients/tools/structured/FalaiNanoBanana.js"

# Yedek kontrolü
if [ ! -f "${FILE_PATH}.backup" ]; then
    echo "⚠️  UYARI: Yedek dosya bulunamadı: ${FILE_PATH}.backup"
    echo "Manuel rollback gerekebilir."
    read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Rollback iptal edildi."
        exit 1
    fi
fi

# Backup oluştur
echo "📦 Mevcut dosyanın yedeği alınıyor..."
cp "$FILE_PATH" "${FILE_PATH}.before_rollback"

# Eski kodu geri yükle
echo "🔄 Eski kod geri yükleniyor..."

# Node.js kullanarak dosyayı düzenle
node <<EOF
const fs = require('fs');
const filePath = '${FILE_PATH}';

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Yeni kodu eski kod ile değiştir
    const newCode = \`        if (this.isAgent) {
          // For agent mode: fetch image and convert to base64
          // This matches DALLE3's implementation for proper image display
          logger.debug('[FalaiNanoBanana] Fetching image for base64 conversion:', imageUrl);

          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            ...this.getAxiosConfig(),
          });

          const base64 = Buffer.from(imageResponse.data).toString('base64');

          // Create content array with base64 image (will be processed by callbacks.js)
          const content = [
            {
              type: ContentTypes.IMAGE_URL,
              image_url: {
                url: \\\`data:image/png;base64,\\\${base64}\\\`,
              },
            },
          ];

          // Return format MUST match DALLE3's format exactly:
          // First element: Array of content objects (TEXT type)
          // Second element: Artifact object with content array
          const response = [
            {
              type: ContentTypes.TEXT,
              text: displayMessage,
            },
          ];

          logger.debug('[FalaiNanoBanana] Returning response in DALLE3-compatible format');
          return [response, { content }];
        }\`;

    const oldCode = \`        if (this.isAgent) {
          // For agent mode: fetch image and convert to base64
          // This matches DALLE3's implementation for proper image display
          logger.debug('[FalaiNanoBanana] Fetching image for base64 conversion:', imageUrl);

          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            ...this.getAxiosConfig(),
          });

          const base64 = Buffer.from(imageResponse.data).toString('base64');

          // Create content array with base64 image (will be processed by callbacks.js)
          const content = [
            {
              type: ContentTypes.IMAGE_URL,
              image_url: {
                url: \\\`data:image/png;base64,\\\${base64}\\\`,
              },
            },
          ];

          // Generate file_id for callbacks.js to properly save the image
          const file_ids = [uuidv4()];

          // Return format: [string_message, artifact_object]
          // First element: STRING that becomes ToolMessage.content
          // Second element: Artifact with content array and file_ids
          const toolMessage = displayMessage + \\\`\\\\n\\\\ngenerated_image_id: "\\\${file_ids[0]}"\\\`;

          logger.debug('[FalaiNanoBanana] Returning response with file_id:', file_ids[0]);
          return [toolMessage, { content, file_ids }];
        }\`;

    content = content.replace(newCode, oldCode);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Dosya başarıyla geri yüklendi.');
    process.exit(0);
} catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
}
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Rollback başarıyla tamamlandı!"
    echo ""
    echo "📝 Yapılan değişiklikler:"
    echo "   - FalaiNanoBanana return formatı eski haline getirildi"
    echo "   - file_ids field geri eklendi"
    echo "   - STRING döndürme mantığı geri yüklendi"
    echo ""
    echo "⚠️  NOT: Backend'i yeniden başlatmanız gerekiyor:"
    echo "   npm run backend"
    echo ""
    echo "📦 Önceki durum yedeklendi: ${FILE_PATH}.before_rollback"
else
    echo ""
    echo "❌ Rollback başarısız oldu!"
    echo "Manuel düzeltme gerekebilir."
    echo ""
    echo "📦 Yedek dosya: ${FILE_PATH}.before_rollback"
    exit 1
fi

echo "=========================================="
