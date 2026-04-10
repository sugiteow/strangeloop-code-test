import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from '@src/config';
import { FinancialAnalystAgent, FinancialAnalysisResult } from './agent/FinancialAnalystAgent';

export class FinancialReportDocumentIngestor {
  constructor(
    private readonly financialAnalystAgent: FinancialAnalystAgent = new FinancialAnalystAgent(),
    private readonly batchSize: number = config.ingestorBatchSize
  ) {}

  async ingestAllDocumentsOnPath(dirPath: string): Promise<FinancialAnalysisResult[]> {
    const filePaths = readdirSync(dirPath)
      .filter((file) => file.toLowerCase().endsWith('.pdf'))
      .map((file) => join(dirPath, file));
    const results: FinancialAnalysisResult[] = [];

    for (let i = 0; i < filePaths.length; i += this.batchSize) {
      const batch = filePaths.slice(i, i + this.batchSize);
      const batchResults = await Promise.all(
        batch.map((filePath) => this.financialAnalystAgent.analyseFile(filePath))
      );
      results.push(...batchResults);
    }

    return results;
  }
}
