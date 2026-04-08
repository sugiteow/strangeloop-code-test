import Anthropic from '@anthropic-ai/sdk';
import { AnthropicClient } from '../src/AnthropicClient';

jest.mock('@anthropic-ai/sdk');

const mockCreate = jest.fn();
const mockStream = jest.fn();

const MockAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;
MockAnthropic.mockImplementation(() => ({
  messages: {
    create: mockCreate,
    stream: mockStream,
  },
} as unknown as Anthropic));

describe('AnthropicClient', () => {
  let client: AnthropicClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new AnthropicClient();
  });

  describe('sendMessage', () => {
    it('returns text from the response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello!' }],
      });

      const result = await client.sendMessage('Hi');

      expect(result).toBe('Hello!');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-opus-4-6',
          max_tokens: 16000,
          messages: [{ role: 'user', content: 'Hi' }],
        })
      );
    });

    it('supports custom model and maxTokens', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'response' }],
      });

      await client.sendMessage('Hi', { model: 'claude-haiku-4-5', maxTokens: 1024 });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-haiku-4-5', max_tokens: 1024 })
      );
    });

    it('returns empty string when no text block in response', async () => {
      mockCreate.mockResolvedValue({ content: [] });

      const result = await client.sendMessage('Hi');

      expect(result).toBe('');
    });
  });

  describe('streamMessage', () => {
    it('returns the final text and calls onText for each delta', async () => {
      const onEvents: Record<string, (arg: string) => void> = {};
      const mockStreamInstance = {
        on: jest.fn((event: string, cb: (arg: string) => void) => {
          onEvents[event] = cb;
        }),
        finalMessage: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'streamed response' }],
        }),
      };
      mockStream.mockReturnValue(mockStreamInstance);

      const received: string[] = [];
      const resultPromise = client.streamMessage('Hi', {
        onText: (t) => received.push(t),
      });

      onEvents['text']?.('streamed ');
      onEvents['text']?.('response');

      const result = await resultPromise;

      expect(result).toBe('streamed response');
      expect(received).toEqual(['streamed ', 'response']);
    });
  });
});
