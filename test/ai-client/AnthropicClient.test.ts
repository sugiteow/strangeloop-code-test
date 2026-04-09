import { AnthropicClient } from '../../src/ai-client/AnthropicClient';

describe('AnthropicClient (integration)', () => {
  let client: AnthropicClient;

  beforeEach(() => {
    client = new AnthropicClient();
  });

  describe('sendMessage', () => {
    it('returns a response from the API', async () => {
      const result = await client.sendMessage('Reply with only the word yes.');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('streamMessage', () => {
    it('streams a response from the API', async () => {
      const deltas: string[] = [];
      const result = await client.streamMessage('Reply with only the word yes.', {
        onText: (t) => deltas.push(t),
      });

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(deltas.length).toBeGreaterThan(0);
    }, 30000);
  });
});
