import type { ICompanyRepository } from '../repositories/company.repository';
import { NotFoundError } from '../../../core/errors/base-error';
import type {
  CompanyDTO,
  DatasetResponseDTO,
  ListCompaniesQuery,
  GenerateDatasetQuery,
} from '../schemas/company.schema';

export interface ICompanyService {
  getCompanyByCnpj(cnpj: string): Promise<CompanyDTO>;
  generateDataset(query: GenerateDatasetQuery): Promise<DatasetResponseDTO>;
  listCompanies(query: ListCompaniesQuery): Promise<DatasetResponseDTO>;
}

const SEED_CNPJS_BY_STATE: Record<string, string[]> = {
  SP: [
    '60746948000112',
    '43209527000148',
    '45543915000154',
    '07526557000100',
    '17245234000151',
  ],
  RJ: [
    '33000167000101',
    '60701190000104',
    '28152650000148',
    '31601725000192',
    '07206816000115',
  ],
  MG: [
    '17116948000120',
    '25468906000100',
    '07975910000130',
    '09427518000170',
    '21361003000105',
  ],
  RS: [
    '92690783000192',
    '87163987000186',
    '89678660000138',
    '00776574000129',
    '11222333000181',
  ],
  PR: [
    '76535764000143',
    '81243735000148',
    '80611769000129',
    '82771017000145',
    '05570714000139',
  ],
  SC: [
    '83494523000128',
    '78588415000115',
    '79379495000183',
    '00558456000196',
    '09166517000124',
  ],
  BA: [
    '15139629000180',
    '13754954000120',
    '11179011000102',
    '09606330000168',
    '40432544000147',
  ],
  PE: [
    '10979541000110',
    '07693441000104',
    '03506307000157',
    '11305218000116',
    '23866199000100',
  ],
  CE: [
    '07976879000150',
    '23621980000109',
    '07612993000179',
    '42498567000101',
    '09609604000115',
  ],
  GO: [
    '01096355000180',
    '14615540000171',
    '02738523000130',
    '08613546000190',
    '10334580000195',
  ],
};

const DEFAULT_SEED_CNPJS = [
  '60746948000112',
  '33000167000101',
  '43209527000148',
  '60701190000104',
  '17116948000120',
  '92690783000192',
  '76535764000143',
  '83494523000128',
  '15139629000180',
  '10979541000110',
];

const applyActiveFilter = (
  companies: CompanyDTO[],
  active: boolean | undefined
): CompanyDTO[] =>
  active === undefined
    ? companies
    : companies.filter((c) =>
        active
          ? c.registrationStatus.toUpperCase() === 'ATIVA'
          : c.registrationStatus.toUpperCase() !== 'ATIVA'
      );

const applyStateFilter = (
  companies: CompanyDTO[],
  state: string | undefined
): CompanyDTO[] =>
  state === undefined
    ? companies
    : companies.filter(
        (c) => c.address.state.toUpperCase() === state.toUpperCase()
      );

const applyPagination = (
  companies: CompanyDTO[],
  page: number,
  limit: number
): CompanyDTO[] => companies.slice((page - 1) * limit, page * limit);

const resolveCnpjsForListing = (
  state: string | undefined,
  limit: number
): string[] => {
  const pool =
    state !== undefined && SEED_CNPJS_BY_STATE[state.toUpperCase()] !== undefined
      ? SEED_CNPJS_BY_STATE[state.toUpperCase()]
      : DEFAULT_SEED_CNPJS;

  return pool.slice(0, Math.min(limit, pool.length));
};

/**
 * Factory that creates a CompanyService instance with injected repository dependency.
 *
 * @param repository - The ICompanyRepository implementation to use for data access
 * @returns An ICompanyService instance with all business logic methods
 */
export const createCompanyService = (
  repository: ICompanyRepository
): ICompanyService => ({
  async getCompanyByCnpj(cnpj: string): Promise<CompanyDTO> {
    const company = await repository.findByCnpj(cnpj);

    if (company === null || company === undefined) {
      throw new NotFoundError('errors.cnpj_not_found');
    }

    return company;
  },

  async generateDataset(query: GenerateDatasetQuery): Promise<DatasetResponseDTO> {
    const companies = await repository.findManyByCnpjs(query.cnpjs);

    return {
      status: 'success',
      total: companies.length,
      data: companies,
      generatedAt: new Date().toISOString(),
    };
  },

  async listCompanies(query: ListCompaniesQuery): Promise<DatasetResponseDTO> {
    const { page, limit, state, active } = query;

    const cnpjsToFetch = resolveCnpjsForListing(state, limit * page);
    const rawCompanies = await repository.findManyByCnpjs(cnpjsToFetch);

    const stateFiltered = applyStateFilter(rawCompanies, state);
    const activeFiltered = applyActiveFilter(stateFiltered, active);
    const paginated = applyPagination(activeFiltered, page, limit);

    return {
      status: 'success',
      total: activeFiltered.length,
      page,
      limit,
      data: paginated,
      generatedAt: new Date().toISOString(),
    };
  },
});
