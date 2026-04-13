import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { extname } from 'path';
import { z } from 'zod';
import { config } from '@src/config';
import { BetaOutputConfig } from '@anthropic-ai/sdk/resources/beta';

interface SendMessageOptions {
  model?: string;
  maxTokens?: number;
  system?: string;
  schema?: z.ZodTypeAny;
}

interface StreamMessageOptions extends SendMessageOptions {
  onText?: (text: string) => void;
}

export class AnthropicClient {
  private readonly client: Anthropic;
  private readonly systemPrompt?: string;

  constructor(systemPrompt?: string) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.systemPrompt = systemPrompt;
  }

  async sendMessage<T = string>(prompt: string, options: SendMessageOptions = {}): Promise<T> {
    const outputConfig = this.buildOutputConfig(options.schema);
    const response = await this.client.beta.messages.create({
      model: options.model ?? config.model,
      max_tokens: options.maxTokens ?? config.maxTokens,
      system: options.system ?? this.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      output_config: outputConfig,
    });

    const text = this.extractTextResponse(response.content);
    return (options.schema ? JSON.parse(text) : text) as T;
  }

  async streamMessage(prompt: string, options: StreamMessageOptions): Promise<string> {
    const stream = this.client.messages
      .stream({
        model: options.model ?? config.model,
        max_tokens: options.maxTokens ?? config.maxTokens,
        thinking: { type: 'adaptive' },
        system: options.system ?? this.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      })
      .on('text', (delta) => {
        options.onText?.(delta);
      });

    const final = await stream.finalMessage();
    return this.extractTextResponse(final.content);
  }

  async sendMessageWithFile<T = string>(
    prompt: string,
    filePath: string,
    options: SendMessageOptions = {}
  ): Promise<T> {
    const outputConfig = this.buildOutputConfig(options.schema);
    const content = await this.buildFileContent(filePath, prompt);

    const response = await this.client.beta.messages.create({
      model: options.model ?? config.model,
      max_tokens: options.maxTokens ?? config.maxTokens,
      system: options.system ?? this.systemPrompt,
      messages: [{ role: 'user', content }],
      betas: ['files-api-2025-04-14'],
      output_config: outputConfig,
    });

    const text = this.extractTextResponse(response.content);
    return (options.schema ? JSON.parse(text) : text) as T;
  }

  private buildOutputConfig(schema?: z.ZodTypeAny): BetaOutputConfig | undefined {
    if (!schema) return undefined;
    return { format: { type: 'json_schema', schema: z.toJSONSchema(schema) } };
  }

  /*
   * Could be a bit too restrictive to only expect/parse text response (given that this is
   * suppose to be a generic client class). But good enough for now. No need to overcomplicate things.
   * */
  private extractTextResponse(
    content: Array<Anthropic.ContentBlock | Anthropic.Beta.BetaContentBlock>
  ): string {
    const textBlock = content.find((b) => b.type === 'text');
    if (!textBlock) {
      const types = content.map((b) => b.type).join(', ');
      throw new Error(`No text block in API response. Content types received: ${types || 'none'}`);
    }
    return textBlock.text;
  }

  private async buildFileContent(
    filePath: string,
    prompt: string
  ): Promise<Anthropic.Beta.BetaContentBlockParam[]> {
    const ext = extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      const fileBuffer = readFileSync(filePath);
      const blob = Object.assign(new Blob([fileBuffer], { type: 'application/pdf' }), {
        name: 'document.pdf',
      });
      const uploaded = await this.client.beta.files.upload({ file: blob });
      return [
        { type: 'document', source: { type: 'file', file_id: uploaded.id } },
        { type: 'text', text: prompt },
      ];
    }

    const fileContent = readFileSync(filePath, 'utf-8');
    return [{ type: 'text', text: `${fileContent}\n\n${prompt}` }];
  }
}
