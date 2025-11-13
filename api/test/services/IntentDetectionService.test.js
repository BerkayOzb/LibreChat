// Mock logger before requiring the module
jest.mock('@librechat/data-schemas', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('librechat-data-provider', () => ({
  Tools: {
    execute_code: 'execute_code',
    file_search: 'file_search',
    web_search: 'web_search',
  },
}));

const {
  quickPatternDetection,
  TOOL_CATEGORIES,
} = require('~/server/services/IntentDetectionService');

describe('IntentDetectionService', () => {
  describe('quickPatternDetection', () => {
    const allTools = ['nano-banana', 'flux', 'dalle', 'web_search', 'google', 'execute_code'];

    describe('Image Generation Detection', () => {
      test('should detect "create an image" request', () => {
        const result = quickPatternDetection('Create an image of a sunset', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(TOOL_CATEGORIES.imageGeneration.filter((t) =>
          allTools.includes(t),
        ));
      });

      test('should detect "generate a picture" request', () => {
        const result = quickPatternDetection('Generate a picture of a cat', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['nano-banana', 'flux', 'dalle']);
      });

      test('should detect "make a visual" request', () => {
        const result = quickPatternDetection('Make a visual representation', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['nano-banana', 'flux', 'dalle']);
      });

      test('should detect Turkish "resim oluştur" request', () => {
        const result = quickPatternDetection('Bir köpek resmi oluştur', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['nano-banana', 'flux', 'dalle']);
      });

      test('should detect Turkish "görsel üret" request', () => {
        const result = quickPatternDetection('Güneş batımı görseli üret', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['nano-banana', 'flux', 'dalle']);
      });

      test('should detect "illustration" request', () => {
        const result = quickPatternDetection('Draw an illustration of a house', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['nano-banana', 'flux', 'dalle']);
      });
    });

    describe('Web Search Detection', () => {
      test('should detect "search for" request', () => {
        const result = quickPatternDetection('Search for the latest news', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['web_search', 'google']);
      });

      test('should detect "find information" request', () => {
        const result = quickPatternDetection('Find information about quantum computing', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['web_search', 'google']);
      });

      test('should detect "latest" request', () => {
        const result = quickPatternDetection('What is the latest news about AI?', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['web_search', 'google']);
      });

      test('should detect Turkish "ara" request', () => {
        const result = quickPatternDetection('Son teknoloji haberlerini ara', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['web_search', 'google']);
      });

      test('should detect "research" request', () => {
        const result = quickPatternDetection('Research recent developments in AI', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['web_search', 'google']);
      });
    });

    describe('No Pattern Detection', () => {
      test('should NOT detect tools for general conversation', () => {
        const result = quickPatternDetection('Hello, how are you?', allTools);
        expect(result.detected).toBe(false);
        expect(result.tools).toEqual(allTools);
      });

      test('should NOT detect tools for knowledge questions', () => {
        const result = quickPatternDetection('What is the capital of France?', allTools);
        expect(result.detected).toBe(false);
        expect(result.tools).toEqual(allTools);
      });

      test('should NOT detect tools for coding help', () => {
        const result = quickPatternDetection('How do I create a function in Python?', allTools);
        expect(result.detected).toBe(false);
        expect(result.tools).toEqual(allTools);
      });

      test('should handle empty message', () => {
        const result = quickPatternDetection('', allTools);
        expect(result.detected).toBe(false);
        expect(result.tools).toEqual(allTools);
      });

      test('should handle null message', () => {
        const result = quickPatternDetection(null, allTools);
        expect(result.detected).toBe(false);
        expect(result.tools).toEqual(allTools);
      });

      test('should handle undefined message', () => {
        const result = quickPatternDetection(undefined, allTools);
        expect(result.detected).toBe(false);
        expect(result.tools).toEqual(allTools);
      });
    });

    describe('Limited Tool Availability', () => {
      test('should return empty array if no image tools available', () => {
        const limitedTools = ['web_search', 'google'];
        const result = quickPatternDetection('Create an image of a sunset', limitedTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual([]);
      });

      test('should return only available image tools', () => {
        const limitedTools = ['nano-banana', 'web_search'];
        const result = quickPatternDetection('Generate a picture', limitedTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['nano-banana']);
      });

      test('should return empty array if no search tools available', () => {
        const limitedTools = ['nano-banana', 'flux'];
        const result = quickPatternDetection('Search for latest news', limitedTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual([]);
      });
    });

    describe('Edge Cases', () => {
      test('should be case-insensitive for English', () => {
        const result = quickPatternDetection('CREATE AN IMAGE', allTools);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual(['nano-banana', 'flux', 'dalle']);
      });

      test('should handle mixed content', () => {
        const result = quickPatternDetection(
          'Can you search for information and then create an image?',
          allTools,
        );
        // Should detect the first pattern (search)
        expect(result.detected).toBe(true);
      });

      test('should handle non-string input gracefully', () => {
        const result = quickPatternDetection(123, allTools);
        expect(result.detected).toBe(false);
        expect(result.tools).toEqual(allTools);
      });

      test('should handle empty tools array', () => {
        const result = quickPatternDetection('Create an image', []);
        expect(result.detected).toBe(true);
        expect(result.tools).toEqual([]);
      });
    });
  });

  describe('TOOL_CATEGORIES', () => {
    test('should have correct image generation tools', () => {
      expect(TOOL_CATEGORIES.imageGeneration).toEqual(['nano-banana', 'flux', 'dalle']);
    });

    test('should have correct web search tools', () => {
      expect(TOOL_CATEGORIES.webSearch).toEqual(['web_search', 'google', 'tavily']);
    });

    test('should have correct code execution tools', () => {
      expect(TOOL_CATEGORIES.codeExecution).toEqual(['execute_code']);
    });

    test('should have correct file search tools', () => {
      expect(TOOL_CATEGORIES.fileSearch).toEqual(['file_search']);
    });
  });
});
