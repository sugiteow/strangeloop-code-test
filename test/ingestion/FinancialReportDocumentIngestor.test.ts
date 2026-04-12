import { FinancialAnalystAgent } from '@src/ingestion/agent/FinancialAnalystAgent';
import { FinancialReportDocumentIngestor } from '@src/ingestion/FinancialReportDocumentIngestor';
import { financialAnalysisResultFactory } from '../factories/FinancialAnalysisResultFactory';

const TEST_DIR = './test/e2e';

describe('FinancialReportDocumentIngestor', () => {
  let ingestor: FinancialReportDocumentIngestor;
  let mockAnalystAgent: FinancialAnalystAgent;
  let analyseSpy: jest.SpyInstance;

  beforeAll(() => {
    mockAnalystAgent = new FinancialAnalystAgent();
    analyseSpy = jest
      .spyOn(mockAnalystAgent, 'analyseFile')
      .mockResolvedValue(financialAnalysisResultFactory.build());
    ingestor = new FinancialReportDocumentIngestor(mockAnalystAgent);
  });

  describe('ingestAllDocumentsOnPath', () => {
    describe('when given a directory with PDF and non-PDF files', () => {
      beforeAll(async () => {
        jest.clearAllMocks();
        await ingestor.ingestAllDocumentsOnPath(TEST_DIR);
      });

      it('only processes PDF files', () => {
        expect(analyseSpy).toHaveBeenCalledTimes(2);
        expect(analyseSpy).toHaveBeenCalledWith('test/e2e/TSLA-Q2-2025-Update.pdf');
        expect(analyseSpy).toHaveBeenCalledWith('test/e2e/citi_earnings_q12025.pdf');
      });
    });

    describe('when one file fails to ingest', () => {
      let results: Awaited<ReturnType<typeof ingestor.ingestAllDocumentsOnPath>>;
      let failingSpy: jest.SpyInstance;

      beforeAll(async () => {
        const agent = new FinancialAnalystAgent();
        const successResult = financialAnalysisResultFactory.build({ companyName: 'Tesla, Inc.' });
        failingSpy = jest
          .spyOn(agent, 'analyseFile')
          .mockResolvedValueOnce(successResult)
          .mockRejectedValueOnce(new Error('API error'));
        results = await new FinancialReportDocumentIngestor(agent).ingestAllDocumentsOnPath(TEST_DIR);
      });

      it('returns results for the successful files', () => {
        expect(results).toHaveLength(1);
        expect(results[0].companyName).toBe('Tesla, Inc.');
      });

      it('still calls analyseFile for all PDFs', () => {
        expect(failingSpy).toHaveBeenCalledTimes(2);
      });
    });

    describe('when the number of files exceeds the batch size', () => {
      let batchedSpy: jest.SpyInstance;

      beforeAll(async () => {
        const agent = new FinancialAnalystAgent();
        batchedSpy = jest
          .spyOn(agent, 'analyseFile')
          .mockResolvedValue(financialAnalysisResultFactory.build());
        await new FinancialReportDocumentIngestor(agent, 1).ingestAllDocumentsOnPath(TEST_DIR);
      });

      it('processes all PDF files across multiple batches', () => {
        expect(batchedSpy).toHaveBeenCalledTimes(2);
      });
    });
  });
});
