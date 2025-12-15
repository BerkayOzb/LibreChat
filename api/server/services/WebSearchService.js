const { logger } = require('@librechat/data-schemas');
const { getToolSetting } = require('~/models/AdminToolSettings');

/**
 * Web Search Providers
 */
const WEB_SEARCH_PROVIDERS = {
  SEARXNG: 'searxng',
  GEMINI: 'gemini',
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
};

/**
 * Default models for each provider
 * Note: OpenAI web search requires gpt-4o or newer models with Responses API support
 * Note: SearXNG doesn't require a model
 */
const DEFAULT_MODELS = {
  [WEB_SEARCH_PROVIDERS.SEARXNG]: 'default',
  [WEB_SEARCH_PROVIDERS.GEMINI]: 'gemini-2.0-flash',
  [WEB_SEARCH_PROVIDERS.OPENAI]: 'gpt-4o',
  [WEB_SEARCH_PROVIDERS.ANTHROPIC]: 'claude-3-5-sonnet-latest',
};

/**
 * Get the configured web search provider settings
 * @returns {Promise<{provider: string, model: string}>}
 */
const getWebSearchProviderConfig = async () => {
  try {
    const setting = await getToolSetting('web_search');
    const config = setting?.metadata?.webSearchConfig;

    console.log('\n========== WEB SEARCH CONFIG ==========');
    console.log('[WebSearchService] Raw config from DB:', JSON.stringify(config, null, 2));

    if (config?.provider) {
      const result = {
        provider: config.provider,
        model: config.model || DEFAULT_MODELS[config.provider],
      };
      console.log('[WebSearchService] Using configured provider:', result.provider);
      console.log('[WebSearchService] Using model:', result.model);
      console.log('========================================\n');
      return result;
    }

    // Default to Gemini
    console.log('[WebSearchService] No config found, using default: gemini');
    console.log('========================================\n');
    return {
      provider: WEB_SEARCH_PROVIDERS.GEMINI,
      model: DEFAULT_MODELS[WEB_SEARCH_PROVIDERS.GEMINI],
    };
  } catch (error) {
    logger.error('[getWebSearchProviderConfig] Error:', error);
    console.log('[WebSearchService] ERROR loading config:', error.message);
    return {
      provider: WEB_SEARCH_PROVIDERS.GEMINI,
      model: DEFAULT_MODELS[WEB_SEARCH_PROVIDERS.GEMINI],
    };
  }
};

/**
 * Perform a web search using the configured provider
 * @param {Object} options - Search options
 * @param {string} options.query - The search query
 * @param {string} options.userId - The user ID
 * @param {Object} options.apiKeys - Available API keys
 * @returns {Promise<Object>} Search result
 */
const performWebSearch = async ({ query, userId, apiKeys = {} }) => {
  const config = await getWebSearchProviderConfig();
  const { provider, model } = config;

  console.log('\n🔍 ========== WEB SEARCH EXECUTION ==========');
  console.log('[WebSearchService] Query:', query);
  console.log('[WebSearchService] Provider:', provider);
  console.log('[WebSearchService] Model:', model);
  console.log('[WebSearchService] API Keys Available:');
  console.log('  - SearXNG:', apiKeys.searxngUrl ? '✅ YES (URL present)' : '❌ NO');
  console.log('  - Google/Gemini:', apiKeys.google ? '✅ YES (key present)' : '❌ NO');
  console.log('  - OpenAI:', apiKeys.openai ? '✅ YES (key present)' : '❌ NO');
  console.log('  - Anthropic:', apiKeys.anthropic ? '✅ YES (key present)' : '❌ NO');
  console.log('=============================================\n');

  logger.info(`[WebSearchService] Performing search with provider: ${provider}, model: ${model}`);

  try {
    let result;
    const startTime = Date.now();

    switch (provider) {
      case WEB_SEARCH_PROVIDERS.SEARXNG:
        console.log('🚀 [WebSearchService] Calling SearXNG API...');
        result = await performSearXNGSearch({ query, instanceUrl: apiKeys.searxngUrl });
        break;

      case WEB_SEARCH_PROVIDERS.GEMINI:
        console.log('🚀 [WebSearchService] Calling Gemini API...');
        result = await performGeminiSearch({ query, model, apiKey: apiKeys.google });
        break;

      case WEB_SEARCH_PROVIDERS.OPENAI:
        console.log('🚀 [WebSearchService] Calling OpenAI API...');
        result = await performOpenAISearch({ query, model, apiKey: apiKeys.openai });
        break;

      case WEB_SEARCH_PROVIDERS.ANTHROPIC:
        console.log('🚀 [WebSearchService] Calling Anthropic API...');
        result = await performAnthropicSearch({ query, model, apiKey: apiKeys.anthropic });
        break;

      default:
        console.log(`⚠️ [WebSearchService] Unknown provider: ${provider}, falling back to SearXNG or first available`);
        logger.warn(`[WebSearchService] Unknown provider: ${provider}, attempting fallback`);
        // Try SearXNG first if available, then others
        if (apiKeys.searxngUrl) {
          result = await performSearXNGSearch({ query, instanceUrl: apiKeys.searxngUrl });
        } else if (apiKeys.openai) {
          result = await performOpenAISearch({ query, model: DEFAULT_MODELS[WEB_SEARCH_PROVIDERS.OPENAI], apiKey: apiKeys.openai });
        } else if (apiKeys.google) {
          result = await performGeminiSearch({ query, model: DEFAULT_MODELS[WEB_SEARCH_PROVIDERS.GEMINI], apiKey: apiKeys.google });
        } else if (apiKeys.anthropic) {
          result = await performAnthropicSearch({ query, model: DEFAULT_MODELS[WEB_SEARCH_PROVIDERS.ANTHROPIC], apiKey: apiKeys.anthropic });
        } else {
          throw new Error('No web search provider configured. Please configure at least one provider.');
        }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ [WebSearchService] Search completed in ${duration}ms`);
    console.log(`[WebSearchService] Response length: ${result.content?.length || 0} chars`);
    console.log(`[WebSearchService] Sources found: ${result.sources?.length || 0}`);
    console.log('=============================================\n');

    return result;
  } catch (error) {
    console.log(`\n❌ [WebSearchService] Search FAILED:`, error.message);
    console.log('=============================================\n');
    logger.error(`[WebSearchService] Search failed:`, error);
    throw error;
  }
};

/**
 * Perform search using Google Gemini with grounding
 */
const performGeminiSearch = async ({ query, model, apiKey }) => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');

  console.log('[Gemini] Starting Gemini search...');
  console.log('[Gemini] Model:', model || 'gemini-2.0-flash');
  console.log('[Gemini] API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT PROVIDED');

  if (!apiKey) {
    console.log('[Gemini] ❌ ERROR: No API key provided!');
    throw new Error('Google API key is required for Gemini web search');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model || 'gemini-2.0-flash',
    tools: [{ googleSearch: {} }],
  });
  console.log('[Gemini] Model initialized with Google Search grounding');

  const searchPrompt = `Search the web for: "${query}"

Please provide a comprehensive answer based on the search results. Include:
1. A direct answer to the query
2. Key facts and information found
3. Sources/references when available

Be concise but thorough.`;

  console.log('[Gemini] Sending request to Gemini API...');
  const result = await geminiModel.generateContent(searchPrompt);
  const response = result.response;
  const text = response.text();
  console.log('[Gemini] Response received, text length:', text?.length || 0);

  // Extract grounding metadata if available
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const sources = groundingMetadata?.groundingChunks?.map(chunk => ({
    title: chunk.web?.title || 'Source',
    url: chunk.web?.uri,
  })) || [];

  console.log('[Gemini] Grounding sources found:', sources.length);
  if (sources.length > 0) {
    sources.forEach((s, i) => console.log(`  [${i + 1}] ${s.title}: ${s.url}`));
  }

  return {
    provider: WEB_SEARCH_PROVIDERS.GEMINI,
    model,
    query,
    content: text,
    sources,
    raw: groundingMetadata,
  };
};

/**
 * Perform search using OpenAI Responses API with native web search
 */
const performOpenAISearch = async ({ query, model, apiKey }) => {
  const OpenAI = require('openai');

  // OpenAI web search requires specific models
  const webSearchModel = model || 'gpt-4o';

  console.log('[OpenAI] Starting OpenAI web search...');
  console.log('[OpenAI] Model:', webSearchModel);
  console.log('[OpenAI] API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT PROVIDED');

  if (!apiKey) {
    console.log('[OpenAI] ❌ ERROR: No API key provided!');
    throw new Error('OpenAI API key is required for OpenAI web search');
  }

  const openai = new OpenAI({ apiKey });
  console.log('[OpenAI] Client initialized');

  // Check if responses API is available
  const hasResponsesAPI = typeof openai.responses?.create === 'function';
  console.log('[OpenAI] Responses API available:', hasResponsesAPI);

  const searchPrompt = `Search the web for: "${query}"

Please provide a comprehensive answer based on current web information. Include:
1. A direct answer to the query
2. Key facts and information found
3. Sources/references when available

Be concise but thorough.`;

  try {
    if (hasResponsesAPI) {
      console.log('[OpenAI] Using Responses API with web_search tool...');

      const response = await openai.responses.create({
        model: webSearchModel,
        tools: [{ type: 'web_search' }],
        input: searchPrompt,
      });

      console.log('[OpenAI] Response received');
      console.log('[OpenAI] Output items:', response.output?.length || 0);

      // Extract content and sources from response
      let content = '';
      const sources = [];

      // Process output items
      if (response.output && Array.isArray(response.output)) {
        for (const item of response.output) {
          console.log('[OpenAI] Processing output item type:', item.type);

          if (item.type === 'message' && item.content) {
            // Extract text content from message
            for (const contentItem of item.content) {
              if (contentItem.type === 'output_text') {
                content += contentItem.text;
              } else if (contentItem.type === 'text') {
                content += contentItem.text;
              }
            }
          } else if (item.type === 'web_search_call') {
            console.log('[OpenAI] Web search call:', item.status);
          }
        }
      }

      // Try to extract sources from annotations if available
      if (response.output) {
        for (const item of response.output) {
          if (item.type === 'message' && item.content) {
            for (const contentItem of item.content) {
              if (contentItem.annotations) {
                for (const annotation of contentItem.annotations) {
                  if (annotation.type === 'url_citation' && annotation.url) {
                    sources.push({
                      title: annotation.title || annotation.url,
                      url: annotation.url,
                    });
                  }
                }
              }
            }
          }
        }
      }

      console.log('[OpenAI] Content length:', content?.length || 0);
      console.log('[OpenAI] Sources found:', sources.length);
      if (sources.length > 0) {
        sources.forEach((s, i) => console.log(`  [${i + 1}] ${s.title}: ${s.url}`));
      }

      return {
        provider: WEB_SEARCH_PROVIDERS.OPENAI,
        model: webSearchModel,
        query,
        content,
        sources,
        raw: response,
      };
    } else {
      // Fallback: Responses API not available, use Chat Completions
      console.log('[OpenAI] Responses API not available, using Chat Completions fallback...');
      console.log('[OpenAI] ⚠️ Note: Chat Completions does not have native web search, results will be based on training data only.');

      const response = await openai.chat.completions.create({
        model: webSearchModel,
        messages: [{ role: 'user', content: searchPrompt }],
      });

      const content = response.choices[0]?.message?.content || '';
      console.log('[OpenAI] Response received, content length:', content?.length || 0);

      return {
        provider: WEB_SEARCH_PROVIDERS.OPENAI,
        model: webSearchModel,
        query,
        content: content + '\n\n⚠️ **Note:** This response is based on training data, not real-time web search. OpenAI Responses API with web search is not available in your SDK version.',
        sources: [],
        raw: response,
      };
    }
  } catch (error) {
    console.log('[OpenAI] Error:', error.message);
    console.log('[OpenAI] Error stack:', error.stack);

    // Check if it's an API availability issue
    if (error.message?.includes('responses') || error.status === 404) {
      throw new Error('OpenAI Responses API with web search is not available. Please check your API access or try a different provider (Gemini recommended).');
    }

    throw error;
  }
};

/**
 * Perform search using Anthropic Claude with web search
 */
const performAnthropicSearch = async ({ query, model, apiKey }) => {
  const Anthropic = require('@anthropic-ai/sdk');

  console.log('[Anthropic] Starting Anthropic search...');
  console.log('[Anthropic] Model:', model || 'claude-3-5-sonnet-latest');
  console.log('[Anthropic] API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT PROVIDED');

  if (!apiKey) {
    console.log('[Anthropic] ❌ ERROR: No API key provided!');
    throw new Error('Anthropic API key is required for Claude web search');
  }

  const anthropic = new Anthropic({ apiKey });
  console.log('[Anthropic] Client initialized');

  const searchPrompt = `Search the web for: "${query}"

Please provide a comprehensive answer based on current web information. Include:
1. A direct answer to the query
2. Key facts and information
3. Sources/references when available

Be concise but thorough.`;

  console.log('[Anthropic] Sending request to Anthropic API...');
  const response = await anthropic.messages.create({
    model: model || 'claude-3-5-sonnet-latest',
    max_tokens: 4096,
    messages: [{ role: 'user', content: searchPrompt }],
    tools: [{
      type: 'web_search_20250305',
      name: 'web_search',
    }],
  });
  console.log('[Anthropic] Response received');
  console.log('[Anthropic] Content blocks:', response.content?.length || 0);
  console.log('[Anthropic] Usage:', response.usage);

  // Extract text content
  const textContent = response.content.find(c => c.type === 'text');
  const content = textContent?.text || '';
  console.log('[Anthropic] Text content length:', content?.length || 0);

  // Extract sources from tool use results
  const sources = [];
  for (const block of response.content) {
    if (block.type === 'tool_result' && block.content) {
      // Parse sources from tool result
      try {
        const toolResult = typeof block.content === 'string'
          ? JSON.parse(block.content)
          : block.content;
        if (toolResult.sources) {
          sources.push(...toolResult.sources);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  return {
    provider: WEB_SEARCH_PROVIDERS.ANTHROPIC,
    model,
    query,
    content,
    sources,
    raw: response,
  };
};

/**
 * Perform search using SearXNG instance
 */
const performSearXNGSearch = async ({ query, instanceUrl }) => {
  console.log('[SearXNG] Starting SearXNG search...');
  console.log('[SearXNG] Instance URL:', instanceUrl || 'NOT PROVIDED');

  if (!instanceUrl) {
    console.log('[SearXNG] ❌ ERROR: No instance URL provided!');
    throw new Error('SearXNG instance URL is required for SearXNG web search');
  }

  // Clean URL and build search endpoint
  const baseUrl = instanceUrl.replace(/\/+$/, '');
  const searchUrl = `${baseUrl}/search`;
  console.log('[SearXNG] Search URL:', searchUrl);

  const searchParams = new URLSearchParams({
    q: query,
    format: 'json',
    engines: 'google,bing,duckduckgo',
    language: 'auto',
  });

  console.log('[SearXNG] Sending request...');
  const response = await fetch(`${searchUrl}?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('[SearXNG] ❌ ERROR: HTTP', response.status, errorText);
    throw new Error(`SearXNG search failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('[SearXNG] Response received');
  console.log('[SearXNG] Results count:', data.results?.length || 0);

  // Extract sources from SearXNG results
  const sources = (data.results || []).slice(0, 10).map((result, index) => ({
    title: result.title || `Source ${index + 1}`,
    url: result.url,
    snippet: result.content || '',
  }));

  console.log('[SearXNG] Sources extracted:', sources.length);
  if (sources.length > 0) {
    sources.forEach((s, i) => console.log(`  [${i + 1}] ${s.title}: ${s.url}`));
  }

  // Build content from search results
  let content = '';

  // Add infobox if available
  if (data.infoboxes && data.infoboxes.length > 0) {
    const infobox = data.infoboxes[0];
    if (infobox.content) {
      content += `${infobox.content}\n\n`;
    }
  }

  // Add summary from top results
  if (sources.length > 0) {
    content += `Here are the top search results for "${query}":\n\n`;
    sources.forEach((source, i) => {
      content += `${i + 1}. **${source.title}**\n`;
      if (source.snippet) {
        content += `   ${source.snippet}\n`;
      }
      content += '\n';
    });
  } else {
    content = `No search results found for "${query}".`;
  }

  return {
    provider: WEB_SEARCH_PROVIDERS.SEARXNG,
    model: 'default',
    query,
    content,
    sources,
    raw: data,
  };
};

/**
 * Create a web search tool that uses the configured provider
 * This returns a LangChain-compatible tool
 * @param {Object} options
 * @param {Object} options.apiKeys - API keys for providers
 * @param {Object} [options.res] - HTTP response object for streaming attachments
 * @param {Object} [options.req] - HTTP request object for fallback IDs
 * @param {Function} [options.onSearchResults] - Callback for search results (from ToolService)
 */
const createNativeWebSearchTool = ({ apiKeys, res, onSearchResults, req }) => {
  const { DynamicStructuredTool } = require('@langchain/core/tools');
  const { Tools } = require('librechat-data-provider');
  const { nanoid } = require('nanoid');
  const { z } = require('zod');

  console.log('\n🔧 [createNativeWebSearchTool] Creating web search tool...');
  console.log('[createNativeWebSearchTool] API Keys provided:', {
    searxngUrl: apiKeys?.searxngUrl ? 'YES' : 'NO',
    google: apiKeys?.google ? 'YES' : 'NO',
    openai: apiKeys?.openai ? 'YES' : 'NO',
    anthropic: apiKeys?.anthropic ? 'YES' : 'NO',
  });
  console.log('[createNativeWebSearchTool] Response object:', res ? 'YES' : 'NO');
  console.log('[createNativeWebSearchTool] Request object:', req ? 'YES' : 'NO');
  console.log('[createNativeWebSearchTool] onSearchResults callback:', onSearchResults ? 'YES' : 'NO');
  if (req?.body) {
    console.log('[createNativeWebSearchTool] req.body keys:', Object.keys(req.body));
    console.log('[createNativeWebSearchTool] req.body.conversationId:', req.body.conversationId);
    console.log('[createNativeWebSearchTool] req.body.messageId:', req.body.messageId);
    console.log('[createNativeWebSearchTool] req.body.parentMessageId:', req.body.parentMessageId);
  }

  return new DynamicStructuredTool({
    name: 'search',
    description: 'Search the web for real-time information. Use this when you need current information, news, or facts that may not be in your training data.',
    schema: z.object({
      query: z.string().describe('The search query to look up'),
    }),
    // Enable content_and_artifact return format for artifact persistence
    // This tells LangChain that the tool returns [content, artifact] tuple
    responseFormat: 'content_and_artifact',
    // LangChain DynamicStructuredTool func signature: (input, runManager, config)
    // The third parameter 'config' is the RunnableConfig containing metadata
    func: async ({ query }, runManager, config) => {
      console.log('\n🎯 ========== WEB SEARCH TOOL INVOKED ==========');
      console.log('[web_search] Query received:', query);
      console.log('[web_search] RunnableConfig available:', config ? 'YES' : 'NO');
      if (config) {
        console.log('[web_search] Config metadata:', JSON.stringify(config.metadata || {}, null, 2));
        console.log('[web_search] Config toolCall:', JSON.stringify(config.toolCall || {}, null, 2));
      }
      console.log('[web_search] req available:', req ? 'YES' : 'NO');
      if (req?.body) {
        console.log('[web_search] req.body keys:', Object.keys(req.body));
        console.log('[web_search] req.body.conversationId:', req.body.conversationId);
        console.log('[web_search] req.body.parentMessageId:', req.body.parentMessageId);
        console.log('[web_search] req.body.responseMessageId:', req.body.responseMessageId);
      }
      console.log('================================================\n');

      try {
        const result = await performWebSearch({ query, apiKeys });

        // Get IDs from config (preferred) or req.body (fallback)
        let messageId = config?.metadata?.run_id;
        let conversationId = config?.metadata?.thread_id;
        let toolCallId = config?.toolCall?.id;
        let toolName = config?.toolCall?.name || 'web_search';
        let turn = config?.toolCall?.turn ?? 0;

        // Fallback to req.body if config is not available
        if (!conversationId && req?.body?.conversationId) {
          conversationId = req.body.conversationId;
          console.log('[web_search] Using conversationId from req.body:', conversationId);
        }
        // Use responseMessageId or messageId (assistant's message), NOT parentMessageId (user's message)
        if (!messageId) {
          if (req?.body?.responseMessageId) {
            messageId = req.body.responseMessageId;
            console.log('[web_search] Using messageId from req.body.responseMessageId:', messageId);
          } else if (req?.body?.messageId) {
            messageId = req.body.messageId;
            console.log('[web_search] Using messageId from req.body.messageId:', messageId);
          }
        }
        if (!toolCallId) {
          toolCallId = nanoid();
          console.log('[web_search] Generated toolCallId:', toolCallId);
        }

        // Stream attachment with source cards using the callback if available, otherwise stream directly
        if (result.sources && result.sources.length > 0) {
          // Convert sources to SearXNG-like format for UI compatibility
          const organic = (result.sources || []).map((source, index) => ({
            title: source.title || `Source ${index + 1}`,
            link: source.url,
            snippet: source.snippet || '',
            position: index + 1,
          }));

          const searchResultData = {
            success: true,
            data: {
              organic,
              topStories: [],
              query: query,
              provider: result.provider,
            },
          };

          // Try to use the onSearchResults callback first (same as SearXNG)
          if (onSearchResults && config) {
            console.log('[web_search] Using onSearchResults callback with config');
            console.log('[web_search] Config for callback:', JSON.stringify({
              metadata: config.metadata,
              toolCall: config.toolCall,
            }, null, 2));

            try {
              onSearchResults(searchResultData, config);
              console.log('[web_search] ✅ onSearchResults callback executed!');
            } catch (callbackError) {
              console.log('[web_search] ⚠️ onSearchResults callback error:', callbackError.message);
            }
          } else if (res && conversationId) {
            // Fallback: stream directly if callback not available
            console.log('[web_search] Falling back to direct streaming');
            console.log('[web_search] Streaming attachment with IDs:');
            console.log('  - messageId:', messageId);
            console.log('  - conversationId:', conversationId);
            console.log('  - toolCallId:', toolCallId);
            console.log('  - turn:', turn);

            const attachmentName = `${toolName}_${toolCallId}_${nanoid()}`;
            const attachment = {
              messageId,
              toolCallId,
              conversationId,
              name: attachmentName,
              type: Tools.web_search,
              [Tools.web_search]: { turn, ...searchResultData.data },
            };

            console.log('[web_search] Attachment built:', JSON.stringify({
              messageId,
              toolCallId,
              conversationId,
              name: attachmentName,
              type: Tools.web_search,
              organicCount: organic.length,
            }, null, 2));

            if (res.headersSent) {
              const attachmentData = `event: attachment\ndata: ${JSON.stringify(attachment)}\n\n`;
              res.write(attachmentData);
              console.log('[web_search] ✅ Attachment streamed successfully!');
            } else {
              console.log('[web_search] ⚠️ Headers not sent yet, cannot stream attachment');
            }
          } else {
            console.log('[web_search] ⚠️ Cannot stream attachment:');
            console.log('  - onSearchResults:', onSearchResults ? 'available' : 'missing');
            console.log('  - config:', config ? 'available' : 'missing');
            console.log('  - res:', res ? 'available' : 'missing');
            console.log('  - conversationId:', conversationId || 'missing');
          }
        } else {
          console.log('[web_search] No sources to stream as attachment');
        }

        // Format the text response
        let response = result.content;

        if (result.sources && result.sources.length > 0) {
          response += '\n\n**Sources:**\n';
          result.sources.forEach((source, i) => {
            response += `${i + 1}. [${source.title}](${source.url})\n`;
          });
        }

        console.log('\n✅ [web_search] Tool execution completed successfully');
        console.log('[web_search] Response length:', response?.length || 0);
        console.log('[web_search] Sources count:', result.sources?.length || 0);
        console.log('================================================\n');

        // Build artifact for persistence (this is what toolEndCallback processes)
        // The artifact ensures cards persist after the message is saved
        // Return format: [content, artifact] - tuple for content_and_artifact responseFormat
        if (result.sources && result.sources.length > 0) {
          const organic = (result.sources || []).map((source, index) => ({
            title: source.title || `Source ${index + 1}`,
            link: source.url,
            snippet: source.snippet || '',
            position: index + 1,
          }));

          const artifactData = {
            turn: config?.toolCall?.turn ?? 0,
            organic,
            topStories: [],
            query: query,
            provider: result.provider,
          };

          console.log('[web_search] Returning tuple [content, artifact] for persistence:', JSON.stringify({
            hasArtifact: true,
            organicCount: organic.length,
            turn: artifactData.turn,
          }));

          // Return tuple [content, artifact] - LangChain will process this with content_and_artifact format
          return [response, { [Tools.web_search]: artifactData }];
        }

        // No sources - return tuple with undefined artifact
        return [response, undefined];
      } catch (error) {
        console.log('\n❌ [web_search] Tool execution FAILED:', error.message);
        console.log('[web_search] Full error:', error);
        console.log('================================================\n');
        logger.error('[createNativeWebSearchTool] Search error:', error);
        // Return tuple with error message and no artifact
        return [`Web search failed: ${error.message}. Please try again or rephrase your query.`, undefined];
      }
    },
  });
};

module.exports = {
  WEB_SEARCH_PROVIDERS,
  DEFAULT_MODELS,
  getWebSearchProviderConfig,
  performWebSearch,
  performSearXNGSearch,
  performGeminiSearch,
  performOpenAISearch,
  performAnthropicSearch,
  createNativeWebSearchTool,
};
