import { FinancialAnalysisResult } from '@src/ingestion/agent/FinancialAnalystAgent';
import {
  FinancialMetricNormaliserAgent,
  NormalisedFinancialMetrics,
} from '@src/transformation/agent/FinancialMetricNormaliserAgent';
import {
  FinancialAnalysisTransformer,
  TransformedFinancialAnalysis,
} from '@src/transformation/FinancialAnalysisTransformer';

const CITATION = { pageNumber: 1, sectionTitle: 'Financial Summary' };

const NORMALISED_METRICS: NormalisedFinancialMetrics = {
  totalRevenue: [{ sourceMetricNames: ['Total Revenue', 'Rev'], value: '$22,496M' }],
  earningsPerShare: [{ sourceMetricNames: ['Diluted EPS'], value: '$0.33' }],
  netIncome: [{ sourceMetricNames: ['Net Income'], value: '$1,172M' }],
  operatingIncome: [],
  grossMargin: [{ sourceMetricNames: ['Gross Margin'], value: '17.2%' }],
  operatingExpenses: [{ sourceMetricNames: ['Opex', 'Operating Costs'], value: '$2,955M' }],
  buybacks: [{ sourceMetricNames: ['Share Buybacks'], value: '$500M' }],
  dividends: [],
};

const makeAnalysisResult = (
  companyName: string,
  reportingPeriod: string
): FinancialAnalysisResult => ({
  companyName,
  reportingPeriod,
  summary: 'A summary.',
  keyMetrics: [{ name: 'Total Revenue', value: '$22,496M', citation: CITATION }],
  risks: [],
  opportunities: [],
  outlook: '',
});

describe('FinancialAnalysisTransformer', () => {
  const batchSize = 2;

  let service: FinancialAnalysisTransformer;
  let mockNormaliserAgent: FinancialMetricNormaliserAgent;
  let results: TransformedFinancialAnalysis[];

  beforeAll(() => {
    mockNormaliserAgent = new FinancialMetricNormaliserAgent();
    jest.spyOn(mockNormaliserAgent, 'normalise').mockResolvedValue(NORMALISED_METRICS);
    service = new FinancialAnalysisTransformer(mockNormaliserAgent, batchSize);
  });

  describe('transform', () => {
    describe('when given a single result', () => {
      beforeAll(async () => {
        jest.clearAllMocks();
        results = await service.transform([makeAnalysisResult('Tesla, Inc.', 'Q2 2025')]);
      });

      it('returns one transformed result', () => {
        expect(results).toHaveLength(1);
        expect(results[0]).toBe({
          companyName: 'Tesla, Inc.',
          reportingPeriod: 'Q2 2025',
          normalisedMetrics: NORMALISED_METRICS,
        });
      });
    });

    describe('when given multiple results within a single batch', () => {
      const inputs = [
        makeAnalysisResult('Tesla, Inc.', 'Q2 2025'),
        makeAnalysisResult('Citigroup Inc.', 'Q1 2025'),
      ];

      beforeAll(async () => {
        jest.clearAllMocks();
        results = await service.transform(inputs);
      });

      it('returns a transformed result for each input', () => {
        expect(results).toHaveLength(2);
        expect(results[0].companyName).toBe('Tesla, Inc.');
        expect(results[1].companyName).toBe('Citigroup Inc.');
      });

      it('calls the normaliser agent once per input', () => {
        expect(mockNormaliserAgent.normalise).toHaveBeenCalledTimes(2);
      });
    });

    describe('when the number of results exceeds the batch size', () => {
      const inputs = [
        makeAnalysisResult('Company A', 'Q1 2025'),
        makeAnalysisResult('Company B', 'Q1 2025'),
        makeAnalysisResult('Company C', 'Q1 2025'),
      ];

      beforeAll(async () => {
        jest.clearAllMocks();
        results = await service.transform(inputs);
      });

      it('returns a transformed result for each input', () => {
        expect(results).toHaveLength(3);
      });

      it('processes inputs across multiple batches', () => {
        expect(mockNormaliserAgent.normalise).toHaveBeenCalledTimes(3);
      });
    });
  });
});
