const { ErrorTypes, EModelEndpoint, mapModelToAzureConfig } = require('librechat-data-provider');
const {
  isEnabled,
  resolveHeaders,
  isUserProvided,
  getOpenAIConfig,
  getAzureCredentials,
  createHandleLLMNewToken,
} = require('@librechat/api');
const { getUserKeyValues, checkUserKeyExpiry } = require('~/server/services/UserService');
const { getDecryptedAdminApiKey } = require('~/models/AdminApiKeys');
const OpenAIClient = require('~/app/clients/OpenAIClient');

const initializeClient = async ({
  req,
  res,
  endpointOption,
  optionsOnly,
  overrideEndpoint,
  overrideModel,
}) => {
  const appConfig = req.config;
  const {
    PROXY,
    OPENAI_API_KEY,
    AZURE_API_KEY,
    OPENAI_REVERSE_PROXY,
    AZURE_OPENAI_BASEURL,
    OPENAI_SUMMARIZE,
    OPENAI_CONTEXT_CLIP,
    OPENAI_CLIP_MAX_MESSAGES,
    DEBUG_OPENAI,
  } = process.env;
  const { key: expiresAt } = req.body;
  const modelName = overrideModel ?? req.body.model;
  const endpoint = overrideEndpoint ?? req.body.endpoint;

  // 🔥 DEBUG: Environment variables
  console.log('\n========================================');
  console.log('🔧 [initialize.js] Environment Check');
  console.log('========================================');
  console.log('📝 OPENAI_CONTEXT_CLIP:', OPENAI_CONTEXT_CLIP);
  console.log('📝 OPENAI_CLIP_MAX_MESSAGES:', OPENAI_CLIP_MAX_MESSAGES);
  console.log('📝 OPENAI_SUMMARIZE:', OPENAI_SUMMARIZE);
  console.log('🔍 isEnabled(OPENAI_CONTEXT_CLIP):', isEnabled(OPENAI_CONTEXT_CLIP));
  console.log('========================================\n');

  // Determine context strategy: clip takes precedence over summarize
  let contextStrategy = null;
  if (isEnabled(OPENAI_CONTEXT_CLIP)) {
    contextStrategy = 'clip';
    console.log('✅ Context Strategy set to: CLIP');
  } else if (isEnabled(OPENAI_SUMMARIZE)) {
    contextStrategy = 'summarize';
    console.log('✅ Context Strategy set to: SUMMARIZE');
  } else {
    console.log('⚠️  No context strategy enabled (will use default: discard)');
  }

  const maxRecentMessages = parseInt(OPENAI_CLIP_MAX_MESSAGES, 10) || 10;
  console.log('📊 maxRecentMessages:', maxRecentMessages);

  const credentials = {
    [EModelEndpoint.openAI]: OPENAI_API_KEY,
    [EModelEndpoint.azureOpenAI]: AZURE_API_KEY,
  };

  const baseURLOptions = {
    [EModelEndpoint.openAI]: OPENAI_REVERSE_PROXY,
    [EModelEndpoint.azureOpenAI]: AZURE_OPENAI_BASEURL,
  };

  const userProvidesKey = isUserProvided(credentials[endpoint]);
  const userProvidesURL = isUserProvided(baseURLOptions[endpoint]);

  let userValues = null;
  if (expiresAt && (userProvidesKey || userProvidesURL)) {
    checkUserKeyExpiry(expiresAt, endpoint);
    userValues = await getUserKeyValues({ userId: req.user.id, name: endpoint });
  }

  let apiKey = userProvidesKey ? userValues?.apiKey : credentials[endpoint];
  let baseURL = userProvidesURL ? userValues?.baseURL : baseURLOptions[endpoint];

  // If no API key available, try to get admin API key
  if (!apiKey) {
    try {
      const adminKey = await getDecryptedAdminApiKey(endpoint);
      if (adminKey) {
        apiKey = adminKey.apiKey;
        if (adminKey.baseURL && !baseURL) {
          baseURL = adminKey.baseURL;
        }
      }
    } catch (error) {
      // Continue without admin key if there's an error
      console.warn(`[${endpoint}] Failed to get admin API key:`, error.message);
    }
  }

  let clientOptions = {
    proxy: PROXY ?? null,
    debug: isEnabled(DEBUG_OPENAI),
    reverseProxyUrl: baseURL ? baseURL : null,
    ...endpointOption,
    // Context strategy MUST come after endpointOption to override
    contextStrategy,
    maxRecentMessages,
  };

  // 🔥 DEBUG: Check what's being passed to OpenAIClient
  console.log('\n🔧 [initialize.js] clientOptions:', {
    contextStrategy: clientOptions.contextStrategy,
    maxRecentMessages: clientOptions.maxRecentMessages,
  });

  const isAzureOpenAI = endpoint === EModelEndpoint.azureOpenAI;
  /** @type {false | TAzureConfig} */
  const azureConfig = isAzureOpenAI && appConfig.endpoints?.[EModelEndpoint.azureOpenAI];
  let serverless = false;
  if (isAzureOpenAI && azureConfig) {
    const { modelGroupMap, groupMap } = azureConfig;
    const {
      azureOptions,
      baseURL,
      headers = {},
      serverless: _serverless,
    } = mapModelToAzureConfig({
      modelName,
      modelGroupMap,
      groupMap,
    });
    serverless = _serverless;

    clientOptions.reverseProxyUrl = baseURL ?? clientOptions.reverseProxyUrl;
    clientOptions.headers = resolveHeaders({
      headers: { ...headers, ...(clientOptions.headers ?? {}) },
      user: req.user,
    });

    clientOptions.titleConvo = azureConfig.titleConvo;
    clientOptions.titleModel = azureConfig.titleModel;

    const azureRate = modelName.includes('gpt-4') ? 30 : 17;
    clientOptions.streamRate = azureConfig.streamRate ?? azureRate;

    clientOptions.titleMethod = azureConfig.titleMethod ?? 'completion';

    const groupName = modelGroupMap[modelName].group;
    clientOptions.addParams = azureConfig.groupMap[groupName].addParams;
    clientOptions.dropParams = azureConfig.groupMap[groupName].dropParams;
    clientOptions.forcePrompt = azureConfig.groupMap[groupName].forcePrompt;

    apiKey = azureOptions.azureOpenAIApiKey;
    clientOptions.azure = !serverless && azureOptions;
    if (serverless === true) {
      clientOptions.defaultQuery = azureOptions.azureOpenAIApiVersion
        ? { 'api-version': azureOptions.azureOpenAIApiVersion }
        : undefined;
      clientOptions.headers['api-key'] = apiKey;
    }
  } else if (isAzureOpenAI) {
    clientOptions.azure = userProvidesKey ? JSON.parse(userValues.apiKey) : getAzureCredentials();
    apiKey = clientOptions.azure.azureOpenAIApiKey;
  }

  /** @type {undefined | TBaseEndpoint} */
  const openAIConfig = appConfig.endpoints?.[EModelEndpoint.openAI];

  if (!isAzureOpenAI && openAIConfig) {
    clientOptions.streamRate = openAIConfig.streamRate;
    clientOptions.titleModel = openAIConfig.titleModel;
  }

  const allConfig = appConfig.endpoints?.all;
  if (allConfig) {
    clientOptions.streamRate = allConfig.streamRate;
  }

  // Note: Removed userProvidesKey check as admin API keys can provide fallback
  // if (userProvidesKey & !apiKey) {
  //   throw new Error(
  //     JSON.stringify({
  //       type: ErrorTypes.NO_USER_KEY,
  //     }),
  //   );
  // }

  if (!apiKey) {
    throw new Error(`${endpoint} API Key not provided.`);
  }

  // 🔥 DEBUG: optionsOnly kontrolü
  console.log('\n⚙️  [initialize.js] optionsOnly:', optionsOnly);

  if (optionsOnly) {
    console.log('⚠️  optionsOnly=true, using getOpenAIConfig instead of OpenAIClient');

    const modelOptions = endpointOption?.model_parameters ?? {};
    modelOptions.model = modelName;
    clientOptions = Object.assign({ modelOptions }, clientOptions);
    clientOptions.modelOptions.user = req.user.id;

    // 🔥 DEBUG: clientOptions before getOpenAIConfig
    console.log('🔧 clientOptions passed to getOpenAIConfig:', {
      contextStrategy: clientOptions.contextStrategy,
      maxRecentMessages: clientOptions.maxRecentMessages,
    });

    const options = getOpenAIConfig(apiKey, clientOptions);
    if (options != null && serverless === true) {
      options.useLegacyContent = true;
    }
    const streamRate = clientOptions.streamRate;
    if (!streamRate) {
      return options;
    }
    options.llmConfig.callbacks = [
      {
        handleLLMNewToken: createHandleLLMNewToken(streamRate),
      },
    ];
    return options;
  }

  console.log('✅ Creating OpenAIClient with clientOptions:', {
    contextStrategy: clientOptions.contextStrategy,
    maxRecentMessages: clientOptions.maxRecentMessages,
  });

  const client = new OpenAIClient(apiKey, Object.assign({ req, res }, clientOptions));
  return {
    client,
    openAIApiKey: apiKey,
  };
};

module.exports = initializeClient;
