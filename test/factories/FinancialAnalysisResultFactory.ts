import { faker } from '@faker-js/faker';
import { Factory } from 'rosie';
import { FinancialAnalysisResult } from '@src/ingestion/agent/FinancialAnalystAgent';

const randomReportingPeriod = () => {
  const quarter = faker.number.int({ min: 1, max: 4 });
  const year = faker.number.int({ min: 2020, max: 2025 });
  return `Q${quarter} ${year}`;
};

export const financialAnalysisResultFactory = new Factory<FinancialAnalysisResult>()
  .attr('companyName', () => faker.company.name())
  .attr('reportingPeriod', () => randomReportingPeriod())
  .attr('summary', () => faker.lorem.sentence())
  .attr('keyMetrics', [{ name: 'Total Revenue', value: '$22,496M', citation: { pageNumber: 1, sectionTitle: 'Financial Summary' } }])
  .attr('risks', [])
  .attr('opportunities', [])
  .attr('outlook', '');
