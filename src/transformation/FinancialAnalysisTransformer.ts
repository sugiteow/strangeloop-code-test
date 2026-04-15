import { config } from '@src/config';
import { batchProcess } from '@src/common/batchProcess';
import { logger } from '@src/common/logger';
import { FinancialAnalysisResult } from '@src/ingestion/agent/FinancialAnalystAgent';
import { FinancialMetricNormaliserAgent, NormalisedFinancialMetrics } from './agent/FinancialMetricNormaliserAgent';

export interface TransformedFinancialAnalysis {
  companyName: string;
  reportingPeriod: string;
  score: number;
  normalisedMetrics: NormalisedFinancialMetrics;
}

export class FinancialAnalysisTransformer {
  constructor(
    private readonly normaliserAgent: FinancialMetricNormaliserAgent = new FinancialMetricNormaliserAgent(),
    private readonly batchSize: number = config.transformerBatchSize
  ) {}

  async transform(analysisResults: FinancialAnalysisResult[]): Promise<TransformedFinancialAnalysis[]> {
    return batchProcess(
      analysisResults,
      this.batchSize,
      async (analysisResult, index) => {
        logger.info(`Transforming document ${index + 1}/${analysisResults.length}`);
        return {
          companyName: analysisResult.companyName,
          reportingPeriod: analysisResult.reportingPeriod,
          score: analysisResult.score.overall,
          normalisedMetrics: await this.normaliserAgent.normalise(analysisResult.keyMetrics),
        };
      },
      (reason) => logger.error('Failed to transform analysis result:', reason)
    );
  }
}
