import { NormalisedFinancialMetric, NormalisedFinancialMetrics } from '@src/transformation/agent/FinancialMetricNormaliserAgent';
import { TransformedFinancialAnalysis } from '@src/transformation/FinancialAnalysisTransformer';

const HEADERS = [
  'Company',
  'Reporting Period',
  'Total Revenue',
  'Earnings Per Share',
  'Net Income',
  'Operating Income',
  'Gross Margin',
  'Operating Expenses',
  'Buybacks',
  'Dividends',
  'Financial Health Score',
];

const formatMetric = (entries: NormalisedFinancialMetric[]): string => {
  if (entries.length === 0) return '';
  if (entries.length > 1) return 'Multiple values';
  return entries[0].value;
};

const toRow = (result: TransformedFinancialAnalysis): string => {
  const m: NormalisedFinancialMetrics = result.normalisedMetrics;
  return [
    result.companyName,
    result.reportingPeriod,
    formatMetric(m.totalRevenue),
    formatMetric(m.earningsPerShare),
    formatMetric(m.netIncome),
    formatMetric(m.operatingIncome),
    formatMetric(m.grossMargin),
    formatMetric(m.operatingExpenses),
    formatMetric(m.buybacks),
    formatMetric(m.dividends),
    String(result.score),
  ]
    .map((cell) => `"${cell}"`)
    .join(',');
};

export class CsvExporter {
  export(results: TransformedFinancialAnalysis[]): string {
    const rows = [HEADERS.join(','), ...results.map(toRow)];
    return rows.join('\n');
  }
}
