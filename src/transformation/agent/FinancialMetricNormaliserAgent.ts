import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { AnthropicClient } from '@src/common/ai-client/AnthropicClient';
import { FinancialAnalysisResult } from '@src/ingestion/agent/FinancialAnalystAgent';

const SYSTEM_PROMPT = readFileSync(
  join(__dirname, 'skills/financial-metric-normaliser.md'),
  'utf-8'
).trim();

const NormalisedFinancialMetricSchema = z.object({
  sourceMetricNames: z.array(z.string()).describe('The original metric names from the source data — includes all merged synonyms'),
  value: z.string().describe('The value of the metric'),
});

const NormalisedFinancialMetricsSchema = z.object({
  totalRevenue: z.array(NormalisedFinancialMetricSchema),
  earningsPerShare: z.array(NormalisedFinancialMetricSchema),
  netIncome: z.array(NormalisedFinancialMetricSchema),
  operatingIncome: z.array(NormalisedFinancialMetricSchema),
  grossMargin: z.array(NormalisedFinancialMetricSchema),
  operatingExpenses: z.array(NormalisedFinancialMetricSchema),
  buybacks: z.array(NormalisedFinancialMetricSchema),
  dividends: z.array(NormalisedFinancialMetricSchema),
});

export type NormalisedFinancialMetrics = z.infer<typeof NormalisedFinancialMetricsSchema>;

export class FinancialMetricNormaliserAgent {
  private readonly client: AnthropicClient;

  constructor() {
    this.client = new AnthropicClient(SYSTEM_PROMPT);
  }

  async normalise(
    financialMetrics: FinancialAnalysisResult['keyMetrics']
  ): Promise<NormalisedFinancialMetrics> {
    return this.client.sendMessage<NormalisedFinancialMetrics>(JSON.stringify(financialMetrics), {
      schema: NormalisedFinancialMetricsSchema,
    });
  }
}
