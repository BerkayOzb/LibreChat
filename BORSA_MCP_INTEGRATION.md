# 📊 Borsa-MCP Integration Guide

Complete integration of [Borsa-MCP](https://github.com/saidsurucu/borsa-mcp) (Turkish Financial Markets MCP Server) into LibreChat.

## 🎯 Overview

This integration enables LibreChat agents to access real-time Turkish financial market data including:

- **750+ BIST Stocks** - Detailed profiles, financial statements, technical analysis
- **800+ Investment Funds** - Performance metrics, portfolio allocation
- **Cryptocurrency Data** - BtcTurk and Coinbase market data
- **Forex Rates** - 28+ currency pairs with TCMB official rates
- **Commodities** - Gold, silver, oil, and other commodity prices
- **Economic Calendar** - 30+ countries' macroeconomic indicators
- **Technical Analysis** - RSI, MACD, Bollinger Bands, Pivot Points

---

## 🚀 Quick Start

### Installation Steps

1. **Apply Configuration**

The integration has already been applied! Check [librechat.yaml](./librechat.yaml):

\`\`\`yaml
mcpServers:
  borsa-mcp:
    url: "https://borsamcp.fastmcp.app/mcp"
    transport: "sse"
    description: "Turkish Financial Markets - 750+ BIST stocks, 800+ funds, crypto, forex & commodities"
    enabled: true
    timeout: 30000
\`\`\`

2. **Restart LibreChat**

\`\`\`bash
npm run backend
\`\`\`

3. **Verify Connection**

\`\`\`bash
curl http://localhost:3080/api/mcp/connection/status/borsa
\`\`\`

Expected response:
\`\`\`json
{
  "connected": true,
  "serverName": "borsa",
  "toolCount": 50+
}
\`\`\`

4. **Test in UI**

- Open LibreChat at `http://localhost:3080`
- Create a new Agent or edit existing one
- Open MCP panel (sidebar)
- Verify "borsa" server appears with green status indicator
- Try a query: *"THYAO hissesinin güncel fiyatı nedir?"*

---

## 📁 File Structure

### New Files Created

\`\`\`
LibreChat/
├── librechat.yaml                                           # ✅ Updated with Borsa-MCP config
├── BORSA_MCP_INTEGRATION.md                                 # 📄 This documentation
│
├── migrations/
│   ├── 20251119_add_borsa_mcp.js                           # 🔧 Migration script
│   └── 20251119_add_borsa_mcp_rollback.js                  # ⏮️  Rollback script
│
├── api/server/
│   ├── services/Config/
│   │   └── borsaMcp.js                                      # 🔧 Caching & tool fetching
│   └── middleware/
│       └── borsaMcpLimiter.js                              # 🛡️  Rate limiting & validation
│
└── client/src/
    ├── components/Chat/Messages/Content/
    │   ├── FinancialDataDisplay.tsx                         # 💹 Financial data UI component
    │   └── ToolCallInfo.tsx                                 # ✅ Updated to use FinancialDataDisplay
    └── locales/tr/
        └── translation.json                                 # 🇹🇷 Turkish translations added
\`\`\`

---

## 🔧 Configuration

### Environment Variables

Add to your `.env` file (optional - defaults provided):

\`\`\`bash
# Borsa-MCP Rate Limiting
BORSA_MCP_RATE_LIMIT_MAX=30                   # Max requests per window
BORSA_MCP_RATE_LIMIT_WINDOW_MS=60000          # Time window (1 minute)

# Borsa-MCP Caching
BORSA_MCP_CACHE_TTL=300                       # Cache TTL in seconds (5 minutes)

# MCP Connection Settings
MCP_CONNECTION_CHECK_TTL=60000                # Connection health check interval
MCP_OAUTH_DETECTION_TIMEOUT=5000              # OAuth flow timeout
\`\`\`

### Advanced Configuration

#### Local Deployment (Optional)

If you prefer running Borsa-MCP locally instead of using the remote endpoint:

**Using Python + uv:**

\`\`\`bash
# Install uv package manager
pip install uv

# Run Borsa-MCP server
uvx borsamcp
\`\`\`

**Update [librechat.yaml](./librechat.yaml):**

\`\`\`yaml
mcpServers:
  borsa:
    command: "uvx"
    args: ["borsamcp"]
    transport: "stdio"
    description: "Turkish Financial Markets (Local)"
    enabled: true
\`\`\`

**Using Docker:**

\`\`\`bash
# Run Borsa-MCP container
docker run -d \\
  --name borsa-mcp \\
  --network librechat-network \\
  -p 8000:8000 \\
  ghcr.io/saidsurucu/borsa-mcp:latest

# Update librechat.yaml to use Docker service
\`\`\`

---

## 🎨 Features

### 1. Financial Data Display Component

Rich, interactive cards for financial data:

**Stock Data Card:**
- Current price with color-coded changes
- Volume, high, low prices
- Market cap, P/E ratio, EPS
- Turkish locale formatting (₺)

**Crypto Data Card:**
- Real-time prices in USD
- 24h volume, high, low
- Percentage changes

**Forex Card:**
- Buy/sell rates
- High precision formatting (4 decimals)
- Change indicators

**Fund Card:**
- Current price (6 decimal precision)
- 1M, 3M, 6M, 1Y returns
- Color-coded performance

### 2. Caching Strategy

**File:** [api/server/services/Config/borsaMcp.js](./api/server/services/Config/borsaMcp.js)

- **TTL:** 5 minutes (shorter than regular tools due to price volatility)
- **Key Pattern:** `mcp:tools:borsa`
- **Cache Stats API:** Available for monitoring

**Functions:**
- `getBorsaTools(serverName)` - Cached tool retrieval
- `clearBorsaCache(serverName)` - Manual cache invalidation
- `getBorsaCacheStats(serverName)` - Cache health monitoring

### 3. Rate Limiting

**File:** [api/server/middleware/borsaMcpLimiter.js](./api/server/middleware/borsaMcpLimiter.js)

**Default Limits:**
- **30 requests** per minute per IP
- **429 status code** when exceeded
- **Standard headers** for rate limit info

**Error Handling:**
- User-friendly Turkish error messages
- Automatic retry-after headers
- Detailed logging for debugging

### 4. Internationalization

**File:** [client/src/locales/tr/translation.json](./client/src/locales/tr/translation.json)

**New Translation Keys:**
- `com_ui_show_raw_data` - "Ham veriyi göster"
- `com_ui_borsa_mcp` - "Borsa Araçları"
- `com_ui_borsa_stocks` - "Hisse Senetleri"
- `com_ui_borsa_crypto` - "Kripto Paralar"
- `com_ui_borsa_forex` - "Döviz Kurları"
- `com_ui_borsa_funds` - "Yatırım Fonları"
- And 15+ more...

---

## 🛠️ Available Tools

Borsa-MCP provides 50+ tools organized by category:

### Stock Tools

| Tool | Description | Example Query |
|------|-------------|---------------|
| `get_bist_index` | BIST index data | "XU100 endeksi nedir?" |
| `search_stock` | Search stocks | "Türk Hava Yolları hissesi" |
| `get_stock_profile` | Company profile | "THYAO şirketi hakkında bilgi" |
| `get_financial_statements` | Financial tables | "THYAO finansal tabloları" |
| `get_technical_analysis` | Technical indicators | "THYAO teknik analiz" |

### Crypto Tools

| Tool | Description | Example Query |
|------|-------------|---------------|
| `get_crypto_price` | Current crypto price | "Bitcoin fiyatı nedir?" |
| `get_crypto_orderbook` | Order book data | "BTC emir defteri" |
| `get_crypto_trades` | Recent trades | "ETH son işlemler" |

### Forex Tools

| Tool | Description | Example Query |
|------|-------------|---------------|
| `get_forex_rate` | Currency rates | "Dolar kuru kaç?" |
| `get_tcmb_rates` | Official TCMB rates | "TCMB döviz kurları" |
| `get_commodity_price` | Commodity prices | "Altın fiyatı nedir?" |

### Fund Tools

| Tool | Description | Example Query |
|------|-------------|---------------|
| `search_funds` | Search funds | "Garanti yatırım fonları" |
| `get_fund_performance` | Performance metrics | "IYE fon performansı" |
| `get_fund_portfolio` | Portfolio allocation | "IYE portföy dağılımı" |

### Analysis Tools

| Tool | Description | Example Query |
|------|-------------|---------------|
| `get_buffett_analysis` | Value analysis | "THYAO değer analizi" |
| `get_altman_zscore` | Financial health | "THYAO Altman Z-Score" |
| `get_pivot_points` | Support/resistance | "XU100 pivot noktaları" |
| `get_economic_calendar` | Economic events | "Ekonomik takvim" |

---

## 💡 Usage Examples

### Basic Stock Query

**User:** "THYAO hissesinin güncel durumunu göster"

**Agent Response:**

\`\`\`
🔧 get_stock_data tool çağrılıyor...

┌─────────────────────────────────────┐
│ THYAO.IS                            │
│ Türk Hava Yolları A.O.              │
├─────────────────────────────────────┤
│ 245.50 ₺                 +2.35% ↑  │
├─────────────────────────────────────┤
│ Hacim       12.45M                  │
│ Yüksek      247.80 ₺                │
│ Düşük       242.10 ₺                │
│ Piy. Değ.   33.8B                   │
└─────────────────────────────────────┘
\`\`\`

### Crypto Price Check

**User:** "Bitcoin fiyatı nedir?"

**Agent:**

\`\`\`
┌──────────────────────────────┐
│ BTC                          │
│ Bitcoin                      │
├──────────────────────────────┤
│ $43,250.00        +3.45% ↑  │
├──────────────────────────────┤
│ 24s Hacim    $28.5B          │
│ 24s Yüksek   $43,890.00      │
│ 24s Düşük    $42,100.00      │
└──────────────────────────────┘
\`\`\`

### Fund Performance

**User:** "En iyi performans gösteren 5 fonu listele"

**Agent:** *(Uses search_funds + get_fund_performance)*

### Complex Analysis

**User:** "THYAO için tam teknik analiz yap ve değer analizi yap"

**Agent:** *(Combines multiple tools: get_technical_analysis, get_buffett_analysis, get_altman_zscore)*

---

## 🧪 Testing

### Manual Testing

1. **Connection Test**
   \`\`\`bash
   curl http://localhost:3080/api/mcp/connection/status/borsa
   \`\`\`

2. **Cache Stats**
   \`\`\`javascript
   const { getBorsaCacheStats } = require('./api/server/services/Config/borsaMcp');
   getBorsaCacheStats('borsa').then(console.log);
   \`\`\`

3. **Rate Limit Test**
   \`\`\`bash
   # Send 35 requests rapidly (should hit rate limit at 30)
   for i in {1..35}; do
     curl -X POST http://localhost:3080/api/agents/chat \\
       -H "Content-Type: application/json" \\
       -d '{"message": "THYAO fiyatı"}' &
   done
   \`\`\`

### Automated Tests

A comprehensive test suite is planned for Phase 5. Test files will cover:

- MCP connection health
- Tool discovery and execution
- Cache behavior
- Rate limiting
- Error handling
- UI component rendering

---

## 📊 Monitoring

### Cache Performance

\`\`\`javascript
// In Node.js console or monitoring script
const { getBorsaCacheStats } = require('./api/server/services/Config/borsaMcp');

setInterval(async () => {
  const stats = await getBorsaCacheStats('borsa');
  console.log('Borsa-MCP Cache Stats:', stats);
}, 60000); // Every minute
\`\`\`

### Rate Limit Monitoring

Check logs for rate limit warnings:

\`\`\`bash
tail -f logs/librechat.log | grep "Borsa-MCP.*Rate limit"
\`\`\`

### Connection Health

\`\`\`bash
# Add to cron or monitoring service
*/5 * * * * curl -s http://localhost:3080/api/mcp/connection/status/borsa | jq .
\`\`\`

---

## 🐛 Troubleshooting

### Connection Issues

**Problem:** Borsa-MCP server shows as disconnected

**Solutions:**
1. Check internet connection
2. Verify remote endpoint is accessible:
   \`\`\`bash
   curl https://borsamcp.fastmcp.app/mcp
   \`\`\`
3. Check LibreChat logs:
   \`\`\`bash
   tail -f logs/librechat.log | grep "Borsa-MCP"
   \`\`\`
4. Restart LibreChat server

### Tools Not Appearing

**Problem:** Borsa tools don't show in MCP panel

**Solutions:**
1. Verify `mcpServers.borsa.enabled` is `true` in librechat.yaml
2. Check agent capabilities include `tools`
3. Clear cache and restart:
   \`\`\`javascript
   const { clearBorsaCache } = require('./api/server/services/Config/borsaMcp');
   await clearBorsaCache('borsa');
   \`\`\`
4. Verify MCP panel is open in UI

### Rate Limit Errors

**Problem:** Getting 429 errors frequently

**Solutions:**
1. Increase rate limit in `.env`:
   \`\`\`
   BORSA_MCP_RATE_LIMIT_MAX=60
   \`\`\`
2. Implement request batching in agent logic
3. Use caching more aggressively

### Data Not Displaying

**Problem:** Financial data shows as raw JSON instead of cards

**Solutions:**
1. Verify FinancialDataDisplay component is imported
2. Check browser console for errors
3. Ensure tool output has expected fields (price, symbol, etc.)
4. Rebuild frontend:
   \`\`\`bash
   npm run build:client
   \`\`\`

---

## 🔄 Migration & Rollback

### Apply Migration

\`\`\`bash
node migrations/20251119_add_borsa_mcp.js up
\`\`\`

### Rollback

\`\`\`bash
node migrations/20251119_add_borsa_mcp_rollback.js
# OR
node migrations/20251119_add_borsa_mcp.js down
\`\`\`

### What Migration Does

1. ✅ Adds `mcpServers.borsa` to librechat.yaml
2. ✅ Creates backup at `librechat.yaml.backup`
3. ✅ Validates configuration syntax
4. ✅ Provides detailed success/failure messages

---

## 🚀 Performance Optimization

### Frontend

- **Lazy Loading:** FinancialDataDisplay only renders when needed
- **Memoization:** useMemo for expensive calculations
- **Conditional Rendering:** Only show financial cards for Borsa tools

### Backend

- **Tool Caching:** 5-minute TTL reduces MCP server load
- **Rate Limiting:** Prevents API abuse and external API quota exhaustion
- **Error Handling:** Fast-fail with user-friendly messages

### Network

- **Remote Endpoint:** No local server overhead
- **SSE Transport:** Efficient bidirectional communication
- **Compressed Responses:** Automatic with express-compression

---

### Related Files

- [librechat.yaml](./librechat.yaml) - Main configuration
- [Migration Script](./migrations/20251119_add_borsa_mcp.js)
- [Rollback Script](./migrations/20251119_add_borsa_mcp_rollback.js)
- [Caching Service](./api/server/services/Config/borsaMcp.js)
- [Rate Limiter](./api/server/middleware/borsaMcpLimiter.js)
- [Financial Display Component](./client/src/components/Chat/Messages/Content/FinancialDataDisplay.tsx)

---

**Last Updated:** 19.11.2025
