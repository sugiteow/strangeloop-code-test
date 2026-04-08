import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';

export class AnthropicClient {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async sendMessage(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      system?: string;
    } = {}
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: options.model ?? config.model,
      max_tokens: options.maxTokens ?? config.maxTokens,
      system: options.system,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    return textBlock?.text ?? '';
  }

  async streamMessage(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      system?: string;
      onText?: (text: string) => void;
    } = {}
  ): Promise<string> {
    const stream = this.client.messages.stream({
      model: options.model ?? config.model,
      max_tokens: options.maxTokens ?? config.maxTokens,
      thinking: { type: 'adaptive' },
      system: options.system,
      messages: [{ role: 'user', content: prompt }],
    });

    stream.on('text', (delta) => {
      options.onText?.(delta);
    });

    const final = await stream.finalMessage();
    const textBlock = final.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    return textBlock?.text ?? '';
  }
}
