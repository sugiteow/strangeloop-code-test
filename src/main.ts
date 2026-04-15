import { mkdirSync } from 'fs';
import { resolve } from 'path';
import { logger } from '@src/common/logger';
import { XlsxExporter } from '@src/export/XlsxExporter';
import { FinancialReportDocumentIngestor } from '@src/ingestion/FinancialReportDocumentIngestor';
import { FinancialAnalysisTransformer } from '@src/transformation/FinancialAnalysisTransformer';

const inputDir = resolve(process.argv[2] ?? '.');
const outputDir = resolve('.', '.');

async function main() {
  logger.info(
    `Reading PDF documents from: ${inputDir}. This might take a while to complete. Do not close this window while it runs...`
  );

  mkdirSync(outputDir, { recursive: true });

  const ingestedResults = await new FinancialReportDocumentIngestor().ingestAllDocumentsOnPath(
    inputDir
  );

  if (ingestedResults.length === 0) {
    logger.error('No documents were successfully ingested.');
    process.exit(1);
  }

  logger.info(`Ingested ${ingestedResults.length} document(s). Transforming...`);
  const transformedResults = await new FinancialAnalysisTransformer().transform(ingestedResults);
  logger.info('Transformation complete. Exporting...');

  const outputFile = `${outputDir}/analysis-result.xlsx`;
  await new XlsxExporter().export(transformedResults, outputFile);

  logger.info(`Done. Output written to: ${outputFile}`);
}

main().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
