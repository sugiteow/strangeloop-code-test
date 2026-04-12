import {
  FinancialMetricNormaliserAgent,
  NormalisedFinancialMetrics,
} from '@src/transformation/agent/FinancialMetricNormaliserAgent';
import {
  FinancialAnalysisTransformer,
  TransformedFinancialAnalysis,
} from '@src/transformation/FinancialAnalysisTransformer';
import { financialAnalysisResultFactory } from '../factories/FinancialAnalysisResultFactory';

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
      const input = financialAnalysisResultFactory.build({
        companyName: 'Tesla, Inc.',
        reportingPeriod: 'Q2 2025',
      });

      beforeAll(async () => {
        jest.clearAllMocks();
        results = await service.transform([input]);
      });

      it('returns one transformed result', () => {
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          companyName: 'Tesla, Inc.',
          reportingPeriod: 'Q2 2025',
          score: input.score.overall,
          normalisedMetrics: NORMALISED_METRICS,
        });
      });
    });

    describe('when given multiple results within a single batch', () => {
      const inputs = [
        financialAnalysisResultFactory.build({
          companyName: 'Tesla, Inc.',
          reportingPeriod: 'Q2 2025',
        }),
        financialAnalysisResultFactory.build({
          companyName: 'Citigroup Inc.',
          reportingPeriod: 'Q1 2025',
        }),
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

    describe('when one normalisation fails', () => {
      const inputs = [
        financialAnalysisResultFactory.build({ companyName: 'Tesla, Inc.' }),
        financialAnalysisResultFactory.build({ companyName: 'Citigroup Inc.' }),
      ];

      beforeAll(async () => {
        jest.clearAllMocks();
        jest
          .spyOn(mockNormaliserAgent, 'normalise')
          .mockResolvedValueOnce(NORMALISED_METRICS)
          .mockRejectedValueOnce(new Error('normalisation error'));
        results = await service.transform(inputs);
      });

      it('returns results for the successful items', () => {
        expect(results).toHaveLength(1);
        expect(results[0].companyName).toBe('Tesla, Inc.');
      });
    });

    describe('when the number of results exceeds the batch size', () => {
      const inputs = [
        financialAnalysisResultFactory.build(),
        financialAnalysisResultFactory.build(),
        financialAnalysisResultFactory.build(),
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
