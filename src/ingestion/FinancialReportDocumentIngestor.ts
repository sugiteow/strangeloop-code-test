import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from '@src/config';
import { batchProcess } from '@src/common/batchProcess';
import { logger } from '@src/common/logger';
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
      .sort()
      .map((file) => join(dirPath, file));

    return batchProcess(
      filePaths,
      this.batchSize,
      (filePath, index) => {
        logger.info(`Ingesting document ${index + 1}/${filePaths.length}: ${filePath}`);
        return this.financialAnalystAgent.analyseFile(filePath);
      },
      (reason) => logger.error('Failed to ingest document:', reason)
    );
  }
}
