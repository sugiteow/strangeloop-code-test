import { z } from 'zod';
import { AnthropicClient } from '../AnthropicClient';

const SYSTEM_PROMPT =
  'You are an expert financial analyst specialising in equity research and earnings analysis.';

const FinancialAnalysisResultSchema = z.object({
  summary: z.string().describe('A concise summary of the document'),
  keyMetrics: z
    .array(z.object({ name: z.string(), value: z.string() }))
    .describe('Key financial metrics extracted from the document'),
  risks: z.array(z.string()).describe('Key risks identified in the document'),
  opportunities: z.array(z.string()).describe('Key opportunities identified in the document'),
  outlook: z.string().describe('Forward-looking statements and overall outlook'),
});

export type FinancialAnalysisResult = z.infer<typeof FinancialAnalysisResultSchema>;

export class FinancialAnalystAgent {
  private readonly client: AnthropicClient;

  constructor() {
    this.client = new AnthropicClient(SYSTEM_PROMPT);
  }

  async analyseFile(filePath: string): Promise<FinancialAnalysisResult> {
    return this.client.sendMessageWithFile<FinancialAnalysisResult>(
      'Extract the key financial information and provide a structured analysis of this document.',
      filePath,
      { schema: FinancialAnalysisResultSchema }
    );
  }
}
