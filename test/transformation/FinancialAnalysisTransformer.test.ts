import { FinancialAnalysisResult } from '@src/ingestion/agent/FinancialAnalystAgent';
import {
  FinancialMetricNormaliserAgent,
  NormalisedFinancialMetrics,
} from '@src/transformation/agent/FinancialMetricNormaliserAgent';
import {
  FinancialAnalysisTransformer,
  TransformedFinancialAnalysis,
} from '@src/transformation/FinancialAnalysisTransformer';




describe('FinancialAnalysisTransformer', () => {
  let service: FinancialAnalysisTransformer;
  let mockNormaliserAgent: FinancialMetricNormaliserAgent;

  const citation = { pageNumber: 1, sectionTitle: 'Financial Summary' };
  const financialAnalysisResult: FinancialAnalysisResult = {
    companyName: 'Tesla, Inc.',
    reportingPeriod: 'Q2 2025',
    summary: 'A summary.',
    keyMetrics: [
      { name: 'Total Revenue', value: '$22,496M', citation: citation },
      { name: 'Diluted EPS', value: '$0.33', citation: citation },
    ],
    risks: [],
    opportunities: [],
    outlook: '',
  };

  const expectedNormalisedMetrics: NormalisedFinancialMetrics = {
    totalRevenue: [{ sourceMetricNames: ['Total Revenue'], value: '$22,496M' }],
    earningsPerShare: [{ sourceMetricNames: ['Diluted EPS'], value: '$0.33' }],
    netIncome: [],
    operatingIncome: [],
    grossMargin: [],
    operatingExpenses: [],
    buybacks: [],
    dividends: [],
  };

  beforeAll(() => {
    mockNormaliserAgent = new FinancialMetricNormaliserAgent();
    jest.spyOn(mockNormaliserAgent, 'normalise').mockResolvedValue(expectedNormalisedMetrics);
    service = new FinancialAnalysisTransformer(mockNormaliserAgent);
  });

  describe('transform', () => {
    let result: TransformedFinancialAnalysis;

    beforeAll(async () => {
      result = await service.transform(financialAnalysisResult);
    });

    it('calls the normaliser agent with the key metrics', () => {
      expect(mockNormaliserAgent.normalise).toHaveBeenCalledWith(financialAnalysisResult.keyMetrics);
    });

    it('returns company name, reporting period and normalised metrics', () => {
      expect(result.companyName).toBe('Tesla, Inc.');
      expect(result.reportingPeriod).toBe('Q2 2025');
      expect(result.normalisedMetrics).toEqual(expectedNormalisedMetrics);
    });
  });
});
