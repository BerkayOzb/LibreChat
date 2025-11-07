const { z } = require('zod');
const axios = require('axios');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { FileContext, ContentTypes } = require('librechat-data-provider');

const displayMessage =
  "Nano Banana görsel üretti. Üretilen tüm görseller zaten görünür durumda, detayları tekrarlamaya gerek yok. İndirme linkleri zaten arayüzde mevcut. Kullanıcı görsellere tıklayarak indirebilir, ancak kullanıcıya indirme hakkında bir şey söyleme.";

/**
 * FalaiNanoBanana - Ultra-fast image generation using Fal.ai's Nano Banana model.
 * Optimized for speed with minimal latency. Automatically used when image generation is detected.
 */
class FalaiNanoBanana extends Tool {
  // Pricing constant in USD per image
  static PRICING = {
    NANO_BANANA: -0.003, // Very cost-effective
  };

  constructor(fields = {}) {
    super();

    /** @type {boolean} Used to initialize the Tool without necessary variables. */
    this.override = fields.override ?? false;

    this.userId = fields.userId;
    this.fileStrategy = fields.fileStrategy;

    /** @type {boolean} **/
    this.isAgent = fields.isAgent;
    this.returnMetadata = fields.returnMetadata ?? false;

    if (fields.processFileURL) {
      /** @type {processFileURL} Necessary for output to contain all image metadata. */
      this.processFileURL = fields.processFileURL.bind(this);
    }

    this.apiKey = fields.FALAI_API_KEY || this.getApiKey();

    this.name = 'nano-banana';
    this.description =
      'Ultra-fast image generation using Fal.ai Nano Banana. Optimized for speed and efficiency. Perfect for quick image generation needs.';

    this.description_for_model = `// Use Nano Banana for ultra-fast image generation. This tool is optimized for speed.
    // Automatically enhance prompts to be descriptive and detailed (3-5 sentences minimum).
    // Focus on visual elements: subject, setting, lighting, mood, style, and composition.
    // Example: Instead of "a cat", use: "A majestic orange tabby cat sitting on a sunlit windowsill, gazing out at a garden. Soft natural lighting highlights its fluffy fur. The composition creates a peaceful, contemplative mood with bokeh background effect."
    // Support for various image sizes and aspect ratios. Default is square format.
    // Extremely fast generation, typically under 2 seconds.`;

    // Fal.ai Nano Banana API endpoint
    this.baseUrl = 'https://fal.run/fal-ai/nano-banana';

    // Define the schema for structured input
    this.schema = z.object({
      prompt: z
        .string()
        .max(4000)
        .describe(
          'Detailed text description for image generation. Should be descriptive and specific about visual elements.',
        ),
      image_size: z
        .enum([
          'square',
          'square_hd',
          'portrait_4_3',
          'portrait_16_9',
          'landscape_4_3',
          'landscape_16_9',
        ])
        .optional()
        .default('square')
        .describe(
          'Output image size/aspect ratio. Options: square (512x512), square_hd (1024x1024), portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9',
        ),
      num_inference_steps: z
        .number()
        .int()
        .min(1)
        .max(8)
        .optional()
        .default(4)
        .describe('Number of denoising steps. Range: 1-8. Lower is faster, higher is better quality.'),
      guidance_scale: z
        .number()
        .optional()
        .default(3.5)
        .describe(
          'How closely to follow the prompt. Range: 1.0-10.0. Higher values follow prompt more strictly.',
        ),
      seed: z
        .number()
        .int()
        .optional()
        .describe('Random seed for reproducibility. Use same seed for consistent results.'),
    });
  }

  getAxiosConfig() {
    const config = {};
    if (process.env.PROXY) {
      config.httpsAgent = new HttpsProxyAgent(process.env.PROXY);
    }
    return config;
  }

  /** @param {Object|string} value */
  getDetails(value) {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  }

  getApiKey() {
    const apiKey = process.env.FALAI_API_KEY || '';
    if (!apiKey && !this.override) {
      throw new Error('Missing FALAI_API_KEY environment variable.');
    }
    return apiKey;
  }

  wrapInMarkdown(imageUrl) {
    const serverDomain = process.env.DOMAIN_SERVER || 'http://localhost:3080';
    return `![generated image](${serverDomain}${imageUrl})`;
  }

  returnValue(value) {
    if (this.isAgent === true && typeof value === 'string') {
      return [value, {}];
    } else if (this.isAgent === true && typeof value === 'object') {
      if (Array.isArray(value)) {
        return value;
      }
      return [displayMessage, value];
    }
    return value;
  }

  async _call(data) {
    const {
      prompt,
      image_size = 'square',
      num_inference_steps = 4,
      guidance_scale = 3.5,
      seed,
    } = data;

    if (!prompt) {
      throw new Error('Missing required field: prompt');
    }

    // Use provided API key for this request if available, otherwise use default
    const requestApiKey = this.apiKey || this.getApiKey();

    const payload = {
      prompt,
      image_size,
      num_inference_steps,
      guidance_scale,
    };

    // Add optional seed if provided
    if (seed !== undefined) {
      payload.seed = seed;
    }

    logger.debug('[FalaiNanoBanana] Generating image with payload:', payload);

    try {
      // Fal.ai Nano Banana is synchronous - direct response with image URL
      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          Authorization: `Key ${requestApiKey}`,
          'Content-Type': 'application/json',
        },
        ...this.getAxiosConfig(),
      });

      // Extract image URL from response
      const imageUrl = response.data.images[0].url;
      const imageName = `nano-banana-${uuidv4()}.png`;

      logger.debug('[FalaiNanoBanana] Image generated successfully:', imageUrl);

      // Handle agent mode with base64 encoding
      if (this.isAgent) {
        try {
          // Fetch the image and convert to base64
          const fetchOptions = {};
          if (process.env.PROXY) {
            fetchOptions.agent = new HttpsProxyAgent(process.env.PROXY);
          }
          const imageResponse = await fetch(imageUrl, fetchOptions);
          const arrayBuffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');

          const content = [
            {
              type: ContentTypes.IMAGE_URL,
              image_url: {
                url: `data:image/png;base64,${base64}`,
              },
            },
          ];

          const responseContent = [
            {
              type: ContentTypes.TEXT,
              text: displayMessage,
            },
          ];

          return [responseContent, { content }];
        } catch (error) {
          logger.error('[FalaiNanoBanana] Error processing image for agent:', error);
          return this.returnValue(`Failed to process the image. ${error.message}`);
        }
      }

      // Regular mode - save to file storage
      try {
        logger.debug('[FalaiNanoBanana] Saving image:', imageUrl);
        const result = await this.processFileURL({
          fileStrategy: this.fileStrategy,
          userId: this.userId,
          URL: imageUrl,
          fileName: imageName,
          basePath: 'images',
          context: FileContext.image_generation,
        });

        logger.debug('[FalaiNanoBanana] Image saved to path:', result.filepath);

        this.result = this.returnMetadata ? result : this.wrapInMarkdown(result.filepath);
        return this.returnValue(this.result);
      } catch (error) {
        const details = this.getDetails(error?.message ?? 'No additional error details.');
        logger.error('[FalaiNanoBanana] Error while saving the image:', details);
        return this.returnValue(`Failed to save the image locally. ${details}`);
      }
    } catch (error) {
      const details = this.getDetails(error?.response?.data || error.message);
      logger.error('[FalaiNanoBanana] Error while generating image:', details);

      return this.returnValue(
        `Something went wrong when trying to generate the image. The Fal.ai API may be unavailable:
        Error Message: ${details}`,
      );
    }
  }
}

module.exports = FalaiNanoBanana;
