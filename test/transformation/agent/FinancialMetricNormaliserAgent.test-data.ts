import { FinancialAnalysisResult } from '../../../src/ingestion/agent/FinancialAnalystAgent';
import { NormalisedFinancialMetrics } from '../../../src/transformation/agent/FinancialMetricNormaliserAgent';

type KeyMetrics = FinancialAnalysisResult['keyMetrics'];

const CITATION = { pageNumber: 1, sectionTitle: 'Financial Summary' };

export interface Scenario {
  name: string;
  description: string;
  input: KeyMetrics;
  expected: NormalisedFinancialMetrics;
}

export const scenarios: Scenario[] = [
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
      buybacksAndDividends: [],
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
      totalRevenue: [{ sourceFieldName: 'Total Revenue', value: '$22,496M' }],
      earningsPerShare: [{ sourceFieldName: 'Diluted EPS', value: '$0.33' }],
      netIncome: [{ sourceFieldName: 'Net Income', value: '$1,172M' }],
      operatingIncome: [{ sourceFieldName: 'Operating Income', value: '$923M' }],
      grossMargin: [{ sourceFieldName: 'Gross Margin', value: '17.2%' }],
      operatingExpenses: [{ sourceFieldName: 'Operating Expenses', value: '$2,955M' }],
      buybacksAndDividends: [{ sourceFieldName: 'Share Buybacks', value: '$0' }],
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
      totalRevenue: [{ sourceFieldName: 'Non-GAAP Total Revenue', value: '$23,100M' }],
      earningsPerShare: [{ sourceFieldName: 'Non-GAAP Diluted EPS', value: '$0.40' }],
      netIncome: [{ sourceFieldName: 'Non-GAAP Net Income', value: '$1,393M' }],
      operatingIncome: [],
      grossMargin: [],
      operatingExpenses: [],
      buybacksAndDividends: [],
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
      totalRevenue: [{ sourceFieldName: 'Revenue', value: '$22,496M' }],
      earningsPerShare: [],
      // Net Profit and Net Earnings have different values — kept as separate entries
      netIncome: [
        { sourceFieldName: 'Net Profit', value: '$1,172M' },
        { sourceFieldName: 'Net Earnings', value: '$1,393M' },
      ],
      operatingIncome: [],
      grossMargin: [],
      // Opex and Operating Costs have the same value — merged under first field name
      operatingExpenses: [{ sourceFieldName: 'Opex', value: '$2,955M' }],
      buybacksAndDividends: [],
    },
  },
];
