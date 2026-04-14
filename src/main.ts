import { mkdirSync } from 'fs';
import { resolve } from 'path';
import { XlsxExporter } from '@src/export/XlsxExporter';
import { FinancialReportDocumentIngestor } from '@src/ingestion/FinancialReportDocumentIngestor';
import { FinancialAnalysisTransformer } from '@src/transformation/FinancialAnalysisTransformer';

const inputDir = resolve(process.argv[2] ?? '.');
const outputDir = resolve('.', '.');

async function main() {
  console.log(
    `Reading PDF documents from: ${inputDir}. This might take a while to complete. Do not close this window while it runs...`
  );

  mkdirSync(outputDir, { recursive: true });

  const ingestedResults = await new FinancialReportDocumentIngestor().ingestAllDocumentsOnPath(
    inputDir
  );

  if (ingestedResults.length === 0) {
    console.error('No documents were successfully ingested.');
    process.exit(1);
  }

  console.log(`Ingested ${ingestedResults.length} document(s). Transforming...`);
  const transformedResults = await new FinancialAnalysisTransformer().transform(ingestedResults);
  console.log('Transformation complete. Exporting...');

  const outputFile = `${outputDir}/analysis-result.xlsx`;
  await new XlsxExporter().export(transformedResults, outputFile);

  console.log(`Done. Output written to: ${outputFile}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
