import { FinancialAnalysisResult } from '@src/ingestion/agent/FinancialAnalystAgent';
import {
  FinancialMetricNormaliserAgent,
  NormalisedFinancialMetrics,
} from '@src/transformation/agent/FinancialMetricNormaliserAgent';

type KeyMetrics = FinancialAnalysisResult['keyMetrics'];

const CITATION = { pageNumber: 1, sectionTitle: 'Financial Summary' };

const scenarios: {
  name: string;
  description: string;
  input: KeyMetrics;
  expected: NormalisedFinancialMetrics;
}[] = [
  {
    name: 'empty metrics',
    description: 'should return empty arrays for all fields',
    input: [],
    expected: {
      totalRevenue: [],
      earningsPerShare: [],
      netIncome: [],
      operatingIncome: [],
      grossMargin: [],
      operatingExpenses: [],
      buybacks: [],
      dividends: [],
    },
  },
  {
    name: 'single value per field',
    description: 'should map each source field to its corresponding normalised field',
    input: [
      { name: 'Total Revenue', value: '$22,496M', citation: CITATION },
      { name: 'Diluted EPS', value: '$0.33', citation: CITATION },
      { name: 'Net Income', value: '$1,172M', citation: CITATION },
      { name: 'Operating Income', value: '$923M', citation: CITATION },
      { name: 'Gross Margin', value: '17.2%', citation: CITATION },
      { name: 'Operating Expenses', value: '$2,955M', citation: CITATION },
      { name: 'Share Buybacks', value: '$0', citation: CITATION },
    ],
    expected: {
      totalRevenue: [{ sourceMetricNames: ['Total Revenue'], value: '$22,496M' }],
      earningsPerShare: [{ sourceMetricNames: ['Diluted EPS'], value: '$0.33' }],
      netIncome: [{ sourceMetricNames: ['Net Income'], value: '$1,172M' }],
      operatingIncome: [{ sourceMetricNames: ['Operating Income'], value: '$923M' }],
      grossMargin: [{ sourceMetricNames: ['Gross Margin'], value: '17.2%' }],
      operatingExpenses: [{ sourceMetricNames: ['Operating Expenses'], value: '$2,955M' }],
      buybacks: [{ sourceMetricNames: ['Share Buybacks'], value: '$0' }],
      dividends: [],
    },
  },
  {
    name: 'fields containing GAAP and Non-GAAP numbers',
    description: 'should use Non-GAAP values when both GAAP and Non-GAAP are present',
    input: [
      { name: 'GAAP Total Revenue', value: '$22,496M', citation: CITATION },
      { name: 'Non-GAAP Total Revenue', value: '$23,100M', citation: CITATION },
      { name: 'GAAP Diluted EPS', value: '$0.33', citation: CITATION },
      { name: 'Non-GAAP Diluted EPS', value: '$0.40', citation: CITATION },
      { name: 'GAAP Net Income', value: '$1,172M', citation: CITATION },
      { name: 'Non-GAAP Net Income', value: '$1,393M', citation: CITATION },
    ],
    expected: {
      totalRevenue: [{ sourceMetricNames: ['Non-GAAP Total Revenue'], value: '$23,100M' }],
      earningsPerShare: [{ sourceMetricNames: ['Non-GAAP Diluted EPS'], value: '$0.40' }],
      netIncome: [{ sourceMetricNames: ['Non-GAAP Net Income'], value: '$1,393M' }],
      operatingIncome: [],
      grossMargin: [],
      operatingExpenses: [],
      buybacks: [],
      dividends: [],
    },
  },
  {
    name: 'fields with different naming conventions for the same metric',
    description: 'should merge synonymous fields with the same value, and keep separate entries when values differ',
    input: [
      // same value synonyms — should be merged into the first field name
      { name: 'Revenue', value: '$22,496M', citation: CITATION },
      { name: 'Rev', value: '$22,496M', citation: CITATION },
      { name: 'Gross Sales', value: '$22,496M', citation: CITATION },
      { name: 'Turnover', value: '$22,496M', citation: CITATION },
      // same value synonyms — should be merged into the first field name
      { name: 'Opex', value: '$2,955M', citation: CITATION },
      { name: 'Operating Costs', value: '$2,955M', citation: CITATION },
      // different values — should be kept as separate entries
      { name: 'Net Profit', value: '$1,172M', citation: CITATION },
      { name: 'Net Earnings', value: '$1,393M', citation: CITATION },
    ],
    expected: {
      // Revenue, Rev, Gross Sales, Turnover all have the same value — merged under first field name
      totalRevenue: [{ sourceMetricNames: ['Revenue', 'Rev', 'Gross Sales', 'Turnover'], value: '$22,496M' }],
      earningsPerShare: [],
      // Net Profit and Net Earnings have different values — kept as separate entries
      netIncome: [
        { sourceMetricNames: ['Net Profit'], value: '$1,172M' },
        { sourceMetricNames: ['Net Earnings'], value: '$1,393M' },
      ],
      operatingIncome: [],
      grossMargin: [],
      // Opex and Operating Costs have the same value — merged under first field name
      operatingExpenses: [{ sourceMetricNames: ['Opex', 'Operating Costs'], value: '$2,955M' }],
      buybacks: [],
      dividends: [],
    },
  },
  {
    name: 'fields with equivalent values expressed in different scale notations',
    description: 'should merge fields whose values are scale-equivalent',
    input: [
      // different scale notation ($22.496B vs $22,496M) — same value, should merge
      { name: 'Revenue', value: '$22.496B', citation: CITATION },
      { name: 'Rev', value: '$22,496M', citation: CITATION },
      // different scale notation ($2.955B vs $2,955M) — same value, should merge
      { name: 'Opex', value: '$2.955B', citation: CITATION },
      { name: 'Operating Costs', value: '$2,955M', citation: CITATION },
      // different term for the same scale ($1,172 million vs $1,172M) — same value, should merge
      { name: 'Net Profit', value: '$1,172 million', citation: CITATION },
      { name: 'Net Earnings', value: '$1,172M', citation: CITATION },
    ],
    expected: {
      totalRevenue: [{ sourceMetricNames: ['Revenue', 'Rev'], value: '$22.496B' }],
      earningsPerShare: [],
      netIncome: [{ sourceMetricNames: ['Net Profit', 'Net Earnings'], value: '$1,172M' }],
      operatingIncome: [],
      grossMargin: [],
      operatingExpenses: [{ sourceMetricNames: ['Opex', 'Operating Costs'], value: '$2.955B' }],
      buybacks: [],
      dividends: [],
    },
  },
  {
    name: 'fields with the same digit but different scale',
    description: 'should keep entries separate when the same digit appears at different scales',
    input: [
      { name: 'Net Profit', value: '$2B', citation: CITATION },
      { name: 'Net Earnings', value: '$2M', citation: CITATION },
    ],
    expected: {
      totalRevenue: [],
      earningsPerShare: [],
      netIncome: [
        { sourceMetricNames: ['Net Profit'], value: '$2B' },
        { sourceMetricNames: ['Net Earnings'], value: '$2M' },
      ],
      operatingIncome: [],
      grossMargin: [],
      operatingExpenses: [],
      buybacks: [],
      dividends: [],
    },
  },
  {
    name: 'values with written-out scale units',
    description: 'should abbreviate scale units to their single letter suffix',
    input: [
      { name: 'Total Revenue', value: '$2.1 trillion', citation: CITATION },
      { name: 'Net Income', value: '$4.1 billion', citation: CITATION },
      { name: 'Operating Expenses', value: '$850 million', citation: CITATION },
      { name: 'Buybacks', value: '$500 thousand', citation: CITATION },
      { name: 'EPS', value: '$1.96', citation: CITATION },
    ],
    expected: {
      totalRevenue: [{ sourceMetricNames: ['Total Revenue'], value: '$2.1T' }],
      earningsPerShare: [{ sourceMetricNames: ['EPS'], value: '$1.96' }],
      netIncome: [{ sourceMetricNames: ['Net Income'], value: '$4.1B' }],
      operatingIncome: [],
      grossMargin: [],
      operatingExpenses: [{ sourceMetricNames: ['Operating Expenses'], value: '$850M' }],
      buybacks: [{ sourceMetricNames: ['Buybacks'], value: '$500K' }],
      dividends: [],
    },
  },
];

/*
 * Probably a bit too expensive to run this all the time. In real world, this should probably run
 * as some sort of smoke test.
 */
describe('FinancialMetricNormaliserAgent (integration)', () => {
  describe('normalise', () => {
    describe.each(scenarios)('when given $name', ({ description, input, expected }) => {
      let result: NormalisedFinancialMetrics;

      beforeAll(async () => {
        const agent = new FinancialMetricNormaliserAgent();
        result = await agent.normalise(input);
      }, 60000);

      it(description, () => {
        expect(result).toEqual(expected);
      });
    });
  });
});
