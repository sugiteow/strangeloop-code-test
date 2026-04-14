import ExcelJS from 'exceljs';
import {
  NormalisedFinancialMetric,
  NormalisedFinancialMetrics,
} from '@src/transformation/agent/FinancialMetricNormaliserAgent';
import { TransformedFinancialAnalysis } from '@src/transformation/FinancialAnalysisTransformer';
import { toRag } from './formatters';

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

const COLUMN_WIDTHS = [25, 18, 18, 20, 18, 18, 15, 20, 15, 15, 22];

const HEADER_STYLE = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1F4E79' } },
  alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
  border: { bottom: { style: 'thin' as const, color: { argb: 'FFAAAAAA' } } },
};

const ROW_FILLS = [
  { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } },
  { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF0F4FA' } },
];


const formatMetric = (entries: NormalisedFinancialMetric[]): string => {
  if (entries.length === 0) return '';
  if (entries.length > 1) return 'Multiple values';
  return entries[0].value;
};

export class XlsxExporter {
  async export(results: TransformedFinancialAnalysis[], outputPath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    this.buildSheet(workbook.addWorksheet('Financial Analysis'), results);
    await workbook.xlsx.writeFile(outputPath);
  }

  private buildSheet(sheet: ExcelJS.Worksheet, results: TransformedFinancialAnalysis[]): void {
    sheet.columns = HEADERS.map((header, i) => ({ header, key: header, width: COLUMN_WIDTHS[i] }));
    this.styleHeaderRow(sheet.getRow(1));
    results.forEach((result, index) => {
      const rowValues = this.toRowValues(result);
      return this.styleDataRow(sheet.addRow(rowValues), index);
    });
  }

  private toRowValues(result: TransformedFinancialAnalysis): (string | number)[] {
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
      `${result.score} ${toRag(result.score)}`,
    ];
  }

  private styleHeaderRow(row: ExcelJS.Row): void {
    row.height = 22;
    row.eachCell((cell) => Object.assign(cell, HEADER_STYLE));
  }

  private styleDataRow(row: ExcelJS.Row, index: number): void {
    row.height = 18;
    row.eachCell((cell) => {
      cell.fill = ROW_FILLS[index % 2];
      cell.alignment = { vertical: 'middle' };
    });
  }
}
