import { createCompanyService } from '../../src/modules/companies/services/company.service';
import { NotFoundError } from '../../src/core/errors/base-error';
import type { ICompanyRepository } from '../../src/modules/companies/repositories/company.repository';
import type { CompanyDTO } from '../../src/modules/companies/schemas/company.schema';

const makeCompanyDTO = (overrides: Partial<CompanyDTO> = {}): CompanyDTO => ({
  cnpj: '60746948000112',
  legalName: 'ITAU UNIBANCO SA',
  tradeName: 'ITAU',
  registrationStatus: 'ATIVA',
  registrationDate: '1944-09-09',
  legalNature: 'Sociedade Anônima Aberta',
  size: 'DEMAIS',
  shareCapital: 97148600000,
  email: 'contato@itau.com.br',
  phone: '(11) 5029-1818',
  address: {
    street: 'PRACA ALFREDO EGYDIO DE SOUZA ARANHA',
    number: '100',
    complement: 'TORRE OLAVO SETUBAL',
    neighborhood: 'PARQUE JABAQUARA',
    city: 'SAO PAULO',
    state: 'SP',
    zipCode: '04344-902',
  },
  mainActivity: {
    code: '6422100',
    description: 'Bancos múltiplos, com carteira comercial',
  },
  secondaryActivities: [],
  partners: [
    {
      name: 'ROBERTO EGYDIO SETUBAL',
      role: 'Diretor-Presidente',
      entryDate: '1994-04-01',
    },
  ],
  taxRegimeHistory: [
    { year: 2022, regime: 'LUCRO REAL' },
  ],
  simplesNacional: false,
  mei: false,
  isHeadquarters: true,
  source: 'brasilapi',
  retrievedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const makeRepository = (
  overrides: Partial<ICompanyRepository> = {}
): ICompanyRepository => ({
  findByCnpj: jest.fn().mockResolvedValue(makeCompanyDTO()),
  findManyByCnpjs: jest.fn().mockResolvedValue([makeCompanyDTO()]),
  ...overrides,
});

describe('CompanyService', () => {
  describe('getCompanyByCnpj', () => {
    it('should return a company DTO when the repository resolves', async () => {
      const dto = makeCompanyDTO();
      const repository = makeRepository({ findByCnpj: jest.fn().mockResolvedValue(dto) });
      const service = createCompanyService(repository);

      const result = await service.getCompanyByCnpj('60746948000112');

      expect(result).toStrictEqual(dto);
      expect(repository.findByCnpj).toHaveBeenCalledWith('60746948000112');
      expect(repository.findByCnpj).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when repository throws NotFoundError', async () => {
      const repository = makeRepository({
        findByCnpj: jest.fn().mockRejectedValue(new NotFoundError('errors.cnpj_not_found')),
      });
      const service = createCompanyService(repository);

      await expect(service.getCompanyByCnpj('00000000000000')).rejects.toBeInstanceOf(
        NotFoundError
      );
    });

    it('should propagate unknown errors from the repository', async () => {
      const cause = new Error('Network timeout');
      const repository = makeRepository({
        findByCnpj: jest.fn().mockRejectedValue(cause),
      });
      const service = createCompanyService(repository);

      await expect(service.getCompanyByCnpj('60746948000112')).rejects.toThrow(
        'Network timeout'
      );
    });
  });

  describe('generateDataset', () => {
    it('should return a dataset response with all resolved companies', async () => {
      const dtos = [
        makeCompanyDTO({ cnpj: '60746948000112' }),
        makeCompanyDTO({ cnpj: '33000167000101', legalName: 'PETROBRAS SA' }),
      ];
      const repository = makeRepository({
        findManyByCnpjs: jest.fn().mockResolvedValue(dtos),
      });
      const service = createCompanyService(repository);

      const result = await service.generateDataset({
        cnpjs: ['60746948000112', '33000167000101'],
      });

      expect(result.status).toBe('success');
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.generatedAt).toBeDefined();
      expect(repository.findManyByCnpjs).toHaveBeenCalledWith([
        '60746948000112',
        '33000167000101',
      ]);
    });

    it('should return an empty dataset when no CNPJs resolve', async () => {
      const repository = makeRepository({
        findManyByCnpjs: jest.fn().mockResolvedValue([]),
      });
      const service = createCompanyService(repository);

      const result = await service.generateDataset({ cnpjs: ['99999999999999'] });

      expect(result.status).toBe('success');
      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should include a generatedAt ISO timestamp', async () => {
      const repository = makeRepository();
      const service = createCompanyService(repository);

      const result = await service.generateDataset({ cnpjs: ['60746948000112'] });

      expect(() => new Date(result.generatedAt)).not.toThrow();
      expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
    });
  });

  describe('listCompanies', () => {
    it('should return paginated companies with correct metadata', async () => {
      const dtos = Array.from({ length: 5 }, (_, i) =>
        makeCompanyDTO({ cnpj: `0000000000000${i}`, registrationStatus: 'ATIVA' })
      );
      const repository = makeRepository({
        findManyByCnpjs: jest.fn().mockResolvedValue(dtos),
      });
      const service = createCompanyService(repository);

      const result = await service.listCompanies({ page: 1, limit: 3 });

      expect(result.status).toBe('success');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(3);
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(5);
    });

    it('should filter companies by active registration status', async () => {
      const dtos = [
        makeCompanyDTO({ cnpj: '60746948000112', registrationStatus: 'ATIVA' }),
        makeCompanyDTO({ cnpj: '33000167000101', registrationStatus: 'BAIXADA' }),
        makeCompanyDTO({ cnpj: '43209527000148', registrationStatus: 'ATIVA' }),
      ];
      const repository = makeRepository({
        findManyByCnpjs: jest.fn().mockResolvedValue(dtos),
      });
      const service = createCompanyService(repository);

      const result = await service.listCompanies({ page: 1, limit: 10, active: true });

      expect(result.data.every((c) => c.registrationStatus.toUpperCase() === 'ATIVA')).toBe(
        true
      );
      expect(result.total).toBe(2);
    });

    it('should filter companies by inactive registration status', async () => {
      const dtos = [
        makeCompanyDTO({ cnpj: '60746948000112', registrationStatus: 'ATIVA' }),
        makeCompanyDTO({ cnpj: '33000167000101', registrationStatus: 'BAIXADA' }),
      ];
      const repository = makeRepository({
        findManyByCnpjs: jest.fn().mockResolvedValue(dtos),
      });
      const service = createCompanyService(repository);

      const result = await service.listCompanies({ page: 1, limit: 10, active: false });

      expect(result.data.every((c) => c.registrationStatus.toUpperCase() !== 'ATIVA')).toBe(
        true
      );
      expect(result.total).toBe(1);
    });

    it('should filter companies by state', async () => {
      const dtos = [
        makeCompanyDTO({ cnpj: '60746948000112', address: { ...makeCompanyDTO().address, state: 'SP' } }),
        makeCompanyDTO({ cnpj: '33000167000101', address: { ...makeCompanyDTO().address, state: 'RJ' } }),
        makeCompanyDTO({ cnpj: '43209527000148', address: { ...makeCompanyDTO().address, state: 'SP' } }),
      ];
      const repository = makeRepository({
        findManyByCnpjs: jest.fn().mockResolvedValue(dtos),
      });
      const service = createCompanyService(repository);

      const result = await service.listCompanies({ page: 1, limit: 10, state: 'SP' });

      expect(result.data.every((c) => c.address.state === 'SP')).toBe(true);
      expect(result.total).toBe(2);
    });

    it('should return second page with offset applied', async () => {
      const dtos = Array.from({ length: 6 }, (_, i) =>
        makeCompanyDTO({ cnpj: `0000000000000${i}` })
      );
      const repository = makeRepository({
        findManyByCnpjs: jest.fn().mockResolvedValue(dtos),
      });
      const service = createCompanyService(repository);

      const result = await service.listCompanies({ page: 2, limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].cnpj).toBe('00000000000002');
      expect(result.data[1].cnpj).toBe('00000000000003');
    });

    it('should return an empty array when page exceeds available data', async () => {
      const dtos = [makeCompanyDTO()];
      const repository = makeRepository({
        findManyByCnpjs: jest.fn().mockResolvedValue(dtos),
      });
      const service = createCompanyService(repository);

      const result = await service.listCompanies({ page: 99, limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(1);
    });
  });
});
