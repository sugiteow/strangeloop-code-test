import { AnthropicClient } from '@src/common/ai-client/AnthropicClient';

describe('AnthropicClient (integration)', () => {
  let client: AnthropicClient;

  beforeEach(() => {
    client = new AnthropicClient();
  });

  describe('sendMessage', () => {
    it('returns a response from the API', async () => {
      const result = await client.sendMessage('Reply with only the word yes.');

      expect(result).toBe('Yes');
    }, 30000);
  });

  describe('streamMessage', () => {
    it('streams a response from the API', async () => {
      const result = await client.streamMessage('Reply with only the word yes.', {});

      expect(result).toBe('Yes');
    }, 30000);
  });
});
