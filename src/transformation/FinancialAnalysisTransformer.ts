import { config } from '@src/config';
import { FinancialAnalysisResult } from '@src/ingestion/agent/FinancialAnalystAgent';
import { FinancialMetricNormaliserAgent, NormalisedFinancialMetrics } from './agent/FinancialMetricNormaliserAgent';

export interface TransformedFinancialAnalysis {
  companyName: string;
  reportingPeriod: string;
  normalisedMetrics: NormalisedFinancialMetrics;
}

export class FinancialAnalysisTransformer {
  constructor(
    private readonly normaliserAgent: FinancialMetricNormaliserAgent = new FinancialMetricNormaliserAgent(),
    private readonly batchSize: number = config.transformerBatchSize
  ) {}

  async transform(
    analysisResults: FinancialAnalysisResult[]
  ): Promise<TransformedFinancialAnalysis[]> {
    const results: TransformedFinancialAnalysis[] = [];

    for (let i = 0; i < analysisResults.length; i += this.batchSize) {
      const batch = analysisResults.slice(i, i + this.batchSize);
      const batchResults = await Promise.all(
        batch.map(async (analysisResult) => ({
          companyName: analysisResult.companyName,
          reportingPeriod: analysisResult.reportingPeriod,
          normalisedMetrics: await this.normaliserAgent.normalise(analysisResult.keyMetrics),
        }))
      );
      results.push(...batchResults);
    }

    return results;
  }
}
