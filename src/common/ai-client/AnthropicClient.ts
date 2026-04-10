import Anthropic, { toFile } from '@anthropic-ai/sdk';
import { createReadStream, readFileSync } from 'fs';
import { extname } from 'path';
import { z } from 'zod';
import { config } from '../../config';

interface SendMessageOptions {
  model?: string;
  maxTokens?: number;
  system?: string;
}

interface StreamMessageOptions extends SendMessageOptions {
  onText?: (text: string) => void;
}

interface SendMessageWithFileOptions extends SendMessageOptions {
  schema?: z.ZodTypeAny;
}

export class AnthropicClient {
  private readonly client: Anthropic;
  private readonly systemPrompt?: string;

  constructor(systemPrompt?: string) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.systemPrompt = systemPrompt;
  }

  async sendMessage(prompt: string, options: SendMessageOptions = {}): Promise<string> {
    const response = await this.client.messages.create({
      model: options.model ?? config.model,
      max_tokens: options.maxTokens ?? config.maxTokens,
      system: options.system ?? this.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    return this.extractTextResponse(response.content);
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
    options: SendMessageWithFileOptions = {}
  ): Promise<T> {
    const outputConfig = options.schema
      ? {
          format: {
            type: 'json_schema' as const,
            schema: z.toJSONSchema(options.schema) as Record<string, unknown>,
          },
        }
      : undefined;

    const content = await this.buildFileContent(filePath, prompt);

    const response = await this.client.beta.messages.create({
      model: options.model ?? config.model,
      max_tokens: options.maxTokens ?? config.maxTokens,
      system: options.system ?? this.systemPrompt,
      messages: [{ role: 'user', content }],
      betas: ['files-api-2025-04-14'],
      ...(outputConfig && { output_config: outputConfig }),
    });

    const text = this.extractTextResponse(response.content);
    return (options.schema ? JSON.parse(text) : text) as T;
  }

  /*
  * Could be a bit too restrictive to only expect/parse text response (given that this is
  * suppose to be a generic client class). But good enough for now. No need to overcomplicate things.
  * */
  private extractTextResponse(
    content: Array<Anthropic.ContentBlock | Anthropic.Beta.BetaContentBlock>
  ): string {
    const textBlock = content.find((b) => b.type === 'text');
    return textBlock ? textBlock.text : '';
  }

  private async buildFileContent(
    filePath: string,
    prompt: string
  ): Promise<Anthropic.Beta.BetaContentBlockParam[]> {
    const ext = extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      const uploaded = await this.client.beta.files.upload({
        file: await toFile(createReadStream(filePath), undefined, { type: 'application/pdf' }),
      });
      return [
        { type: 'document', source: { type: 'file', file_id: uploaded.id } },
        { type: 'text', text: prompt },
      ];
    }

    const fileContent = readFileSync(filePath, 'utf-8');
    return [{ type: 'text', text: `${fileContent}\n\n${prompt}` }];
  }
}
