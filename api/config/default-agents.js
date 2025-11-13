/**
 * Default Agents Configuration
 *
 * Kullanıcılar için hazır agent'lar oluşturur
 */

module.exports = {
  defaultAgents: [
    {
      name: 'Görsel Üretici',
      description: 'Ultra-hızlı görsel üretimi için Nano Banana kullanan agent',
      avatar: {
        filepath: null,
        source: 'default',
      },
      author: 'System',
      model: 'meta-llama/llama-3.1-70b-instruct',
      provider: 'custom',
      instructions: `Sen görsel üretim konusunda uzman bir AI asistanısın.

Kullanıcı görsel üretimi istediğinde:
1. İsteği detaylı bir prompt'a çevir (minimum 2-3 cümle, görsel detaylar içermeli)
2. Nano-banana tool'unu kullanarak görseli oluştur
3. Sonucu kullanıcıya sun

Kullanıcı genel sohbet veya bilgi istediğinde:
- Normal bir AI asistan gibi cevap ver
- Görsel üretim gerekmiyorsa tool kullanmana gerek yok

Örnek iyi görsel promptları:
- "A cute cat sitting on a sunny windowsill, warm lighting, photorealistic, highly detailed"
- "Cyberpunk cityscape at night with neon signs, rain, reflections, moody atmosphere"
- "Mountain landscape at sunset, golden hour, dramatic clouds, professional photography"

Önemli:
- Her zaman İngilizce prompt oluştur (model İngilizce daha iyi çalışır)
- Promptları detaylı yap (görsel öğeler, lighting, mood, style belirt)
- Sistem otomatik olarak hangi tool'ların gerekli olduğunu belirleyecek`,
      tools: ['nano-banana'], // Default tool (fallback)
      autoToolFilter: true, // Enable intelligent tool filtering
      availableTools: ['nano-banana', 'flux', 'dalle'], // Tools pool to select from
      capabilities: ['tools'],
      temperature: 0.7,
      isDefault: true,
    },
  ],
};
