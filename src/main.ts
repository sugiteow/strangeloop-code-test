import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { CsvExporter } from '@src/export/CsvExporter';
import { FinancialReportDocumentIngestor } from '@src/ingestion/FinancialReportDocumentIngestor';
import { FinancialAnalysisTransformer } from '@src/transformation/FinancialAnalysisTransformer';

const inputDir = resolve(process.argv[2] ?? '.');
const outputDir = resolve('.', '.');

async function main() {
  console.log(
    `Reading PDF documents from: ${inputDir}. This might take up to 3 minutes. Do not close this window while it runs`
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

  const csv = new CsvExporter().export(transformedResults);
  writeFileSync(`${outputDir}/analysis-result.csv`, csv);

  console.log(`Done. Output written to: ${outputDir}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
