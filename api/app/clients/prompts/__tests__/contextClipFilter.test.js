const { contextClipFilter, simpleClipFilter } = require('../contextClipFilter');

describe('contextClipFilter', () => {
  // Mock token count function
  const mockGetTokenCount = (message) => {
    const content = message.content || message.text || '';
    return Math.ceil(content.length / 4); // Rough estimate: 1 token per 4 chars
  };

  describe('Basic Functionality', () => {
    it('should preserve system messages', async () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.', tokenCount: 10 },
        { role: 'user', content: 'Hello', tokenCount: 5 },
        { role: 'assistant', content: 'Hi there!', tokenCount: 5 },
      ];

      const result = await contextClipFilter({
        messages,
        maxRecentMessages: 10,
        maxContextTokens: 1000,
        getTokenCount: mockGetTokenCount,
      });

      expect(result.context).toHaveLength(3);
      expect(result.context[0].role).toBe('system');
    });

    it('should keep only recent N messages', async () => {
      const messages = [];
      for (let i = 0; i < 20; i++) {
        messages.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          tokenCount: 5,
        });
      }

      const result = await contextClipFilter({
        messages,
        maxRecentMessages: 10,
        maxContextTokens: 1000,
        getTokenCount: mockGetTokenCount,
      });

      // Should have 10 recent messages
      expect(result.context.length).toBeLessThanOrEqual(10);
      expect(result.clippedCount).toBe(10);
    });

    it('should respect token limits', async () => {
      const messages = [
        { role: 'user', content: 'A'.repeat(100), tokenCount: 25 },
        { role: 'assistant', content: 'B'.repeat(100), tokenCount: 25 },
        { role: 'user', content: 'C'.repeat(100), tokenCount: 25 },
        { role: 'assistant', content: 'D'.repeat(100), tokenCount: 25 },
        { role: 'user', content: 'E'.repeat(100), tokenCount: 25 },
      ];

      const result = await contextClipFilter({
        messages,
        maxRecentMessages: 10,
        maxContextTokens: 60, // Should only fit ~2 messages + buffer
        getTokenCount: mockGetTokenCount,
      });

      // Should clip messages to fit token limit
      expect(result.context.length).toBeLessThan(5);
      expect(result.remainingContextTokens).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Instructions Handling', () => {
    it('should prioritize instructions over system messages', async () => {
      const instructions = {
        role: 'system',
        content: 'Custom instructions',
        tokenCount: 10,
      };

      const messages = [
        { role: 'system', content: 'Default system message', tokenCount: 10 },
        { role: 'user', content: 'Hello', tokenCount: 5 },
      ];

      const result = await contextClipFilter({
        messages,
        instructions,
        maxRecentMessages: 10,
        maxContextTokens: 1000,
        getTokenCount: mockGetTokenCount,
      });

      expect(result.context[0].content).toBe('Custom instructions');
      // System message from messages should not be in context when instructions provided
      const systemMessages = result.context.filter((m) => m.role === 'system');
      expect(systemMessages).toHaveLength(1);
    });

    it('should account for instructions token count', async () => {
      const instructions = {
        role: 'system',
        content: 'A'.repeat(200), // Large instructions
        tokenCount: 50,
      };

      const messages = [
        { role: 'user', content: 'Message 1', tokenCount: 10 },
        { role: 'assistant', content: 'Response 1', tokenCount: 10 },
      ];

      const result = await contextClipFilter({
        messages,
        instructions,
        maxRecentMessages: 10,
        maxContextTokens: 70, // Limited tokens
        getTokenCount: mockGetTokenCount,
      });

      // Instructions should be included despite taking up most tokens
      expect(result.context[0]).toBe(instructions);
      expect(result.remainingContextTokens).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message array', async () => {
      const result = await contextClipFilter({
        messages: [],
        maxRecentMessages: 10,
        maxContextTokens: 1000,
        getTokenCount: mockGetTokenCount,
      });

      expect(result.context).toHaveLength(0);
      expect(result.clippedCount).toBe(0);
    });

    it('should handle single message', async () => {
      const messages = [{ role: 'user', content: 'Single message', tokenCount: 10 }];

      const result = await contextClipFilter({
        messages,
        maxRecentMessages: 10,
        maxContextTokens: 1000,
        getTokenCount: mockGetTokenCount,
      });

      expect(result.context).toHaveLength(1);
      expect(result.clippedCount).toBe(0);
    });

    it('should handle maxRecentMessages = 0', async () => {
      const messages = [
        { role: 'user', content: 'Message 1', tokenCount: 10 },
        { role: 'assistant', content: 'Response 1', tokenCount: 10 },
      ];

      const result = await contextClipFilter({
        messages,
        maxRecentMessages: 0,
        maxContextTokens: 1000,
        getTokenCount: mockGetTokenCount,
      });

      // Should clip all regular messages, keep only system if any
      expect(result.clippedCount).toBeGreaterThan(0);
    });

    it('should handle very large maxRecentMessages', async () => {
      const messages = [
        { role: 'user', content: 'Message 1', tokenCount: 10 },
        { role: 'assistant', content: 'Response 1', tokenCount: 10 },
      ];

      const result = await contextClipFilter({
        messages,
        maxRecentMessages: 1000,
        maxContextTokens: 1000,
        getTokenCount: mockGetTokenCount,
      });

      // Should include all messages
      expect(result.context.length).toBe(messages.length);
      expect(result.clippedCount).toBe(0);
    });
  });

  describe('Token Calculation', () => {
    it('should calculate remaining tokens correctly', async () => {
      const messages = [
        { role: 'user', content: 'Test', tokenCount: 10 },
        { role: 'assistant', content: 'Response', tokenCount: 15 },
      ];

      const maxTokens = 100;
      const result = await contextClipFilter({
        messages,
        maxRecentMessages: 10,
        maxContextTokens: maxTokens,
        getTokenCount: mockGetTokenCount,
      });

      const usedTokens = result.context.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0);
      expect(result.remainingContextTokens).toBeCloseTo(maxTokens - usedTokens - 3); // -3 for assistant label
    });

    it('should use getTokenCount when tokenCount is missing', async () => {
      const messages = [
        { role: 'user', content: 'Test message without tokenCount' },
        { role: 'assistant', content: 'Another message' },
      ];

      const result = await contextClipFilter({
        messages,
        maxRecentMessages: 10,
        maxContextTokens: 1000,
        getTokenCount: mockGetTokenCount,
      });

      // Should still work with custom token counting
      expect(result.context.length).toBeGreaterThan(0);
      expect(result.remainingContextTokens).toBeLessThan(1000);
    });
  });
});

describe('simpleClipFilter', () => {
  it('should clip messages without token consideration', () => {
    const messages = [];
    for (let i = 0; i < 20; i++) {
      messages.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      });
    }

    const result = simpleClipFilter({
      messages,
      maxRecentMessages: 10,
    });

    expect(result.context.length).toBeLessThanOrEqual(10);
    expect(result.clippedCount).toBe(10);
  });

  it('should preserve system messages', () => {
    const messages = [
      { role: 'system', content: 'System message' },
      { role: 'user', content: 'User 1' },
      { role: 'assistant', content: 'Assistant 1' },
      { role: 'user', content: 'User 2' },
      { role: 'assistant', content: 'Assistant 2' },
    ];

    const result = simpleClipFilter({
      messages,
      maxRecentMessages: 2,
    });

    // Should have system + 2 recent messages
    expect(result.context[0].role).toBe('system');
    expect(result.context.length).toBe(3);
  });

  it('should handle instructions', () => {
    const instructions = {
      role: 'system',
      content: 'Custom instructions',
    };

    const messages = [
      { role: 'user', content: 'Message 1' },
      { role: 'assistant', content: 'Response 1' },
    ];

    const result = simpleClipFilter({
      messages,
      instructions,
      maxRecentMessages: 10,
    });

    expect(result.context[0]).toBe(instructions);
  });
});

describe('Real-world Scenarios', () => {
  it('should handle typical conversation with 50 messages', async () => {
    const messages = [
      { role: 'system', content: 'You are a coding assistant.', tokenCount: 15 },
    ];

    for (let i = 0; i < 49; i++) {
      messages.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}: ${'Lorem ipsum '.repeat(10)}`,
        tokenCount: 30,
      });
    }

    const result = await contextClipFilter({
      messages,
      maxRecentMessages: 10,
      maxContextTokens: 4096,
      getTokenCount: (msg) => msg.tokenCount,
    });

    // Should have system + 10 recent messages
    expect(result.context[0].role).toBe('system');
    expect(result.context.length).toBeLessThanOrEqual(11);
    expect(result.clippedCount).toBeGreaterThan(0);

    // Should save significant tokens
    const originalTokens = messages.reduce((sum, m) => sum + m.tokenCount, 0);
    const usedTokens = result.context.reduce((sum, m) => sum + m.tokenCount, 0);
    const savings = ((originalTokens - usedTokens) / originalTokens) * 100;
    expect(savings).toBeGreaterThan(50); // At least 50% savings
  });

  it('should handle code review conversation', async () => {
    const messages = [
      {
        role: 'system',
        content: 'You are a code reviewer. Be thorough and constructive.',
        tokenCount: 20,
      },
      { role: 'user', content: 'function add(a, b) { return a + b; }', tokenCount: 15 },
      {
        role: 'assistant',
        content: 'The function looks good but could use type checking.',
        tokenCount: 20,
      },
      {
        role: 'user',
        content: 'How would you add TypeScript types?',
        tokenCount: 12,
      },
      {
        role: 'assistant',
        content: 'function add(a: number, b: number): number { return a + b; }',
        tokenCount: 18,
      },
    ];

    const result = await contextClipFilter({
      messages,
      maxRecentMessages: 10,
      maxContextTokens: 200,
      getTokenCount: (msg) => msg.tokenCount,
    });

    // Should keep all messages as they're within limits
    expect(result.context).toHaveLength(5);
    expect(result.context[0].role).toBe('system');
  });
});
