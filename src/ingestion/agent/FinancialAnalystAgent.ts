import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { AnthropicClient } from '../../common/ai-client/AnthropicClient';

const SYSTEM_PROMPT = readFileSync(join(__dirname, 'skills/financial-analyst.md'), 'utf-8').trim();

const CitationSchema = z.object({
  pageNumber: z.number().describe('Page number where the information was found'),
  sectionTitle: z.string().describe('Title of the section where the information was found'),
  paragraphNumber: z.number().optional().describe('Paragraph number within the section (if applicable)'),
});

const FinancialAnalysisResultSchema = z.object({
  companyName: z.string().describe('Name of the company being analysed'),
  reportingPeriod: z.string().describe('Reporting period covered by the document (e.g. Q2 2025)'),
  summary: z.string().describe('A concise summary of the document'),
  keyMetrics: z
    .array(z.object({ name: z.string(), value: z.string(), citation: CitationSchema }))
    .describe('Key financial metrics extracted from the document'),
  risks: z
    .array(z.object({ text: z.string(), citation: CitationSchema }))
    .describe('Key risks identified in the document'),
  opportunities: z
    .array(z.object({ text: z.string(), citation: CitationSchema }))
    .describe('Key opportunities identified in the document'),
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
