import { FinancialAnalysisResult } from '@src/ingestion/agent/FinancialAnalystAgent';
import { FinancialMetricNormaliserAgent, NormalisedFinancialMetrics } from './agent/FinancialMetricNormaliserAgent';

export interface TransformedFinancialAnalysis {
  companyName: string;
  reportingPeriod: string;
  normalisedMetrics: NormalisedFinancialMetrics;
}

export class FinancialAnalysisTransformer {
  constructor(private readonly normaliserAgent: FinancialMetricNormaliserAgent) {}

  async transform(analysisResult: FinancialAnalysisResult): Promise<TransformedFinancialAnalysis> {
    const normalisedMetrics = await this.normaliserAgent.normalise(analysisResult.keyMetrics);

    return {
      companyName: analysisResult.companyName,
      reportingPeriod: analysisResult.reportingPeriod,
      normalisedMetrics,
    };
  }

}
