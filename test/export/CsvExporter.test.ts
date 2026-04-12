import { CsvExporter } from '@src/export/CsvExporter';
import { NormalisedFinancialMetrics } from '@src/transformation/agent/FinancialMetricNormaliserAgent';
import { TransformedFinancialAnalysis } from '@src/transformation/FinancialAnalysisTransformer';

const HEADER_ROW = 'Company,Reporting Period,Total Revenue,Earnings Per Share,Net Income,Operating Income,Gross Margin,Operating Expenses,Buybacks,Dividends,Financial Health Score';

const metric = (value: string) => ({ sourceMetricNames: ['Some Metric'], value });

const emptyMetrics: NormalisedFinancialMetrics = {
  totalRevenue: [],
  earningsPerShare: [],
  netIncome: [],
  operatingIncome: [],
  grossMargin: [],
  operatingExpenses: [],
  buybacks: [],
  dividends: [],
};

const singleMetrics: NormalisedFinancialMetrics = {
  totalRevenue: [metric('$22,496M')],
  earningsPerShare: [metric('$0.33')],
  netIncome: [metric('$1,172M')],
  operatingIncome: [metric('$923M')],
  grossMargin: [metric('17.2%')],
  operatingExpenses: [metric('$2,955M')],
  buybacks: [metric('$500M')],
  dividends: [metric('$100M')],
};

const multipleMetrics: NormalisedFinancialMetrics = {
  totalRevenue: [metric('$22,496M'), metric('$23,100M')],
  earningsPerShare: [metric('$0.33'), metric('$0.40')],
  netIncome: [metric('$1,172M'), metric('$1,393M')],
  operatingIncome: [metric('$923M'), metric('$950M')],
  grossMargin: [metric('17.2%'), metric('18.0%')],
  operatingExpenses: [metric('$2,955M'), metric('$3,000M')],
  buybacks: [metric('$500M'), metric('$600M')],
  dividends: [metric('$100M'), metric('$120M')],
};

const score = 3;

const scenarios: {
  name: string;
  normalisedMetrics: NormalisedFinancialMetrics;
  expectedDataRow: string;
}[] = [
  {
    name: 'empty metrics',
    normalisedMetrics: emptyMetrics,
    expectedDataRow: '"Tesla, Inc.","Q2 2025","","","","","","","","","3 🟡"',
  },
  {
    name: 'single value per field',
    normalisedMetrics: singleMetrics,
    expectedDataRow: '"Tesla, Inc.","Q2 2025","$22,496M","$0.33","$1,172M","$923M","17.2%","$2,955M","$500M","$100M","3 🟡"',
  },
  {
    name: 'multiple values per field',
    normalisedMetrics: multipleMetrics,
    expectedDataRow: '"Tesla, Inc.","Q2 2025","Multiple values","Multiple values","Multiple values","Multiple values","Multiple values","Multiple values","Multiple values","Multiple values","3 🟡"',
  },
];

describe('CsvExporter', () => {
  const exporter = new CsvExporter();

  describe('export', () => {
    describe.each(scenarios)('when given $name', ({ normalisedMetrics, expectedDataRow }) => {
      const input: TransformedFinancialAnalysis = {
        companyName: 'Tesla, Inc.',
        reportingPeriod: 'Q2 2025',
        score,
        normalisedMetrics,
      };

      let result: string;

      beforeAll(() => {
        result = exporter.export([input]);
      });

      it('includes the header row', () => {
        expect(result.split('\n')[0]).toBe(HEADER_ROW);
      });

      it('outputs the correct data row', () => {
        expect(result.split('\n')[1]).toBe(expectedDataRow);
      });
    });
  });
});
