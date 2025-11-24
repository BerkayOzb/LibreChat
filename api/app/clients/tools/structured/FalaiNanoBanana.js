const { z } = require('zod');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { FileContext, ContentTypes } = require('librechat-data-provider');

const displayMessage = "İşte istediğiniz görsel!";

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
      'Ultra-fast image generation using Fal.ai Nano Banana Pro. Optimized for speed and efficiency. Perfect for quick image generation needs.';

    this.description_for_model = `// Use Nano Banana Pro for ultra-fast image generation. This tool is optimized for speed.
    // Automatically enhance prompts to be descriptive and detailed (3-5 sentences minimum).
    // Focus on visual elements: subject, setting, lighting, mood, style, and composition.
    // Example: Instead of "a cat", use: "A majestic orange tabby cat sitting on a sunlit windowsill, gazing out at a garden. Soft natural lighting highlights its fluffy fur. The composition creates a peaceful, contemplative mood with bokeh background effect."
    // Support for various image sizes and aspect ratios. Default is square format.
    // Extremely fast generation, typically under 2 seconds.`;

    // Fal.ai Nano Banana Pro API endpoint
    this.baseUrl = 'https://fal.run/fal-ai/nano-banana-pro';

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
      num_images: 1, // SADECE 1 görsel üret
    };

    // Add optional seed if provided
    if (seed !== undefined) {
      payload.seed = seed;
    }

    logger.debug('[FalaiNanoBanana] Generating image with payload:', payload);
    console.log('[FalaiNanoBanana] 🚀 Generating image using endpoint:', this.baseUrl); // Verification Log

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

      if (this.isAgent) {
        // For agent mode: ONLY fetch image and convert to base64
        // DO NOT call processFileURL - callbacks.js will handle saving via saveBase64Image()
        // This matches DALLE3's implementation exactly
        try {
          logger.debug('[FalaiNanoBanana] Agent mode: Fetching image for base64 conversion:', imageUrl);

          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            ...this.getAxiosConfig(),
          });

          const contentType = imageResponse.headers['content-type'] || 'image/png';
          const base64 = Buffer.from(imageResponse.data).toString('base64');

          // Create content array with base64 image (will be processed by callbacks.js)
          const content = [
            {
              type: ContentTypes.IMAGE_URL,
              image_url: {
                url: `data:${contentType};base64,${base64}`,
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

          logger.debug('[FalaiNanoBanana] Agent mode: Returning response in DALLE3-compatible format');
          return [response, { content }];
        } catch (error) {
          const details = this.getDetails(error?.message ?? 'No additional error details.');
          logger.error('[FalaiNanoBanana] Agent mode: Error while fetching/converting image:', details);
          return this.returnValue(`Failed to process the image. ${details}`);
        }
      }

      // Regular mode: Save to file storage and return markdown
      try {
        logger.debug('[FalaiNanoBanana] Regular mode: Saving image to storage:', imageUrl);
        const result = await this.processFileURL({
          fileStrategy: this.fileStrategy,
          userId: this.userId,
          URL: imageUrl,
          fileName: imageName,
          basePath: 'images',
          context: FileContext.image_generation,
        });

        logger.debug('[FalaiNanoBanana] Regular mode: Image saved to path:', result.filepath);

        const markdownResult = this.wrapInMarkdown(result.filepath);
        this.result = this.returnMetadata ? result : markdownResult;
        return this.returnValue(this.result);
      } catch (error) {
        const details = this.getDetails(error?.message ?? 'No additional error details.');
        logger.error('[FalaiNanoBanana] Regular mode: Error while saving the image:', details);
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
