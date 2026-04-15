import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from '@src/config';
import { FinancialAnalystAgent, FinancialAnalysisResult } from './agent/FinancialAnalystAgent';

export class FinancialReportDocumentIngestor {
  constructor(
    private readonly financialAnalystAgent: FinancialAnalystAgent = new FinancialAnalystAgent(),
    private readonly batchSize: number = config.ingestorBatchSize
  ) {}

  /*
  * As we don't implement a persistence layer as part of this assignment, I just use the file system
  * as a source of the documents.  In real life system, we prob. would have a reference/url to the file
  * persisted in the db, while the file itself lives either in s3 or fetched directly from the source.
  * */
  async ingestAllDocumentsOnPath(dirPath: string): Promise<FinancialAnalysisResult[]> {
    const filePaths = readdirSync(dirPath)
      .filter((file) => file.toLowerCase().endsWith('.pdf'))
      .map((file) => join(dirPath, file));
    const results: FinancialAnalysisResult[] = [];

    const total = filePaths.length;
    for (let i = 0; i < filePaths.length; i += this.batchSize) {
      const batch = filePaths.slice(i, i + this.batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((filePath, j) => {
          console.log(`Ingesting document ${i + j + 1}/${total}: ${filePath}`);
          return this.financialAnalystAgent.analyseFile(filePath);
        })
      );
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Failed to ingest document:', result.reason);
        }
      }
    }

    return results;
  }
}
