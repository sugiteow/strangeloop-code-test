import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { CsvExporter } from '@src/export/CsvExporter';
import { XlsxExporter } from '@src/export/XlsxExporter';
import { FinancialReportDocumentIngestor } from '@src/ingestion/FinancialReportDocumentIngestor';
import { FinancialAnalysisTransformer } from '@src/transformation/FinancialAnalysisTransformer';

const E2E_DIR = './test/e2e';
const OUTPUT_DIR = `${E2E_DIR}/output`;
const xlsxPath = `${OUTPUT_DIR}/final-result.xlsx`;

beforeAll(() => {
  mkdirSync(OUTPUT_DIR, { recursive: true });
});

it('ingests, transforms and exports financial report documents', async () => {
  const ingestedResults = await new FinancialReportDocumentIngestor().ingestAllDocumentsOnPath(E2E_DIR);
  const transformedResults = await new FinancialAnalysisTransformer().transform(ingestedResults);
  const csv = new CsvExporter().export(transformedResults);
  await new XlsxExporter().export(transformedResults, xlsxPath);

  expect(ingestedResults.length).toBeGreaterThan(0);
  expect(transformedResults).toHaveLength(ingestedResults.length);
  expect(csv).not.toBe('');

  writeFileSync(`${OUTPUT_DIR}/ingested-document.json`, JSON.stringify(ingestedResults, null, 2));
  writeFileSync(`${OUTPUT_DIR}/transformed-document.json`, JSON.stringify(transformedResults, null, 2));
  writeFileSync(`${OUTPUT_DIR}/final-result.csv`, csv);
  expect(existsSync(xlsxPath)).toBe(true);
}, 300000);
