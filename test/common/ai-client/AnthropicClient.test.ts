import { AnthropicClient } from '@src/common/ai-client/AnthropicClient';

const TEST_PDF = './test/common/ai-client/test-document.pdf';
const TEST_RTF = './test/common/ai-client/test-document.rtf';

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

  describe('sendMessageWithFile', () => {
    it('reads a PDF file and returns a response from the API', async () => {
      const result = await client.sendMessageWithFile(
        'What is the only word in this document? Reply with that word only.',
        TEST_PDF
      );

      expect(result).toBe('Yes');
    }, 30000);

    it('reads an RTF file and returns a response from the API', async () => {
      const result = await client.sendMessageWithFile(
        'What is the only word in this document? Reply with that word only.',
        TEST_RTF
      );

      expect(result).toBe('Yes');
    }, 30000);
  });
});
