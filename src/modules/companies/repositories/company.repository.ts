import { AxiosError } from 'axios';
import { brasilApiClient, receitaWsClient } from '../../../config/http-client';
import {
  NotFoundError,
  UpstreamUnavailableError,
} from '../../../core/errors/base-error';
import {
  BrasilApiCompanySchema,
  ReceitaWsCompanySchema,
  type BrasilApiCompany,
  type ReceitaWsCompany,
} from '../schemas/upstream.types';
import type {
  CompanyDTO,
  AddressDTO,
  CnaeDTO,
  PartnerDTO,
  TaxRegimeEntryDTO,
} from '../schemas/company.schema';

const normalizeCnpj = (raw: string): string => raw.replace(/\D/g, '');

const normalizePhone = (phone: string | null): string | null =>
  phone ? phone.replace(/\D/g, '').replace(/^(\d{2})(\d+)$/, '($1) $2') : null;

const normalizeCep = (cep: string): string =>
  cep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2');

const buildAddressFromBrasilApi = (raw: BrasilApiCompany): AddressDTO => ({
  street: raw.logradouro,
  number: raw.numero,
  complement: raw.complemento ?? null,
  neighborhood: raw.bairro,
  city: raw.municipio,
  state: raw.uf,
  zipCode: normalizeCep(raw.cep),
});

const buildAddressFromReceitaWs = (raw: ReceitaWsCompany): AddressDTO => ({
  street: raw.logradouro,
  number: raw.numero,
  complement: raw.complemento ?? null,
  neighborhood: raw.bairro,
  city: raw.municipio,
  state: raw.uf,
  zipCode: normalizeCep(raw.cep),
});

const buildMainActivityFromBrasilApi = (raw: BrasilApiCompany): CnaeDTO => ({
  code: String(raw.cnae_fiscal),
  description: raw.cnae_fiscal_descricao,
});

const buildSecondaryActivitiesFromBrasilApi = (
  raw: BrasilApiCompany
): CnaeDTO[] =>
  raw.cnaes_secundarios.map((cnae) => ({
    code: String(cnae.codigo),
    description: cnae.descricao,
  }));

const buildPartnersFromBrasilApi = (raw: BrasilApiCompany): PartnerDTO[] =>
  (raw.qsa ?? []).map((partner) => ({
    name: partner.nome_socio,
    role: partner.qualificacao_socio,
    entryDate: partner.data_entrada_sociedade ?? null,
  }));

const buildPartnersFromReceitaWs = (raw: ReceitaWsCompany): PartnerDTO[] =>
  raw.qsa.map((partner) => ({
    name: partner.nome,
    role: partner.qual,
    entryDate: null,
  }));

const buildTaxRegimeFromBrasilApi = (
  raw: BrasilApiCompany
): TaxRegimeEntryDTO[] =>
  (raw.regime_tributario ?? []).map((entry) => ({
    year: entry.ano,
    regime: entry.forma_de_tributacao,
  }));

const mapBrasilApiToCompanyDTO = (raw: BrasilApiCompany): CompanyDTO => ({
  cnpj: normalizeCnpj(raw.cnpj),
  legalName: raw.razao_social,
  tradeName: raw.nome_fantasia ?? null,
  registrationStatus: raw.descricao_situacao_cadastral,
  registrationDate: raw.data_inicio_atividade ?? raw.data_situacao_cadastral ?? '',
  legalNature: raw.natureza_juridica ?? '',
  size: raw.porte ?? '',
  shareCapital: raw.capital_social,
  email: raw.email ?? null,
  phone: normalizePhone(raw.ddd_telefone_1),
  address: buildAddressFromBrasilApi(raw),
  mainActivity: buildMainActivityFromBrasilApi(raw),
  secondaryActivities: buildSecondaryActivitiesFromBrasilApi(raw),
  partners: buildPartnersFromBrasilApi(raw),
  taxRegimeHistory: buildTaxRegimeFromBrasilApi(raw),
  simplesNacional: raw.opcao_pelo_simples ?? null,
  mei: raw.opcao_pelo_mei ?? null,
  isHeadquarters: raw.descricao_identificador_matriz_filial === 'MATRIZ',
  source: 'brasilapi',
  retrievedAt: new Date().toISOString(),
});

const mapReceitaWsToCompanyDTO = (raw: ReceitaWsCompany): CompanyDTO => ({
  cnpj: normalizeCnpj(raw.cnpj),
  legalName: raw.nome,
  tradeName: raw.fantasia ?? null,
  registrationStatus: raw.situacao,
  registrationDate: raw.abertura ?? '',
  legalNature: raw.natureza_juridica ?? '',
  size: raw.porte ?? '',
  shareCapital: parseFloat(raw.capital_social.replace(',', '.')) || 0,
  email: raw.email ?? null,
  phone: normalizePhone(raw.telefone),
  address: buildAddressFromReceitaWs(raw),
  mainActivity:
    raw.atividade_principal[0] != null
      ? {
          code: raw.atividade_principal[0].code,
          description: raw.atividade_principal[0].text,
        }
      : { code: '', description: '' },
  secondaryActivities: raw.atividades_secundarias
    .filter((a) => a.code !== '00.00-0-00')
    .map((a) => ({ code: a.code, description: a.text })),
  partners: buildPartnersFromReceitaWs(raw),
  taxRegimeHistory: [],
  simplesNacional: raw.simples?.optante ?? null,
  mei: raw.simei?.optante ?? null,
  isHeadquarters: raw.tipo === 'MATRIZ',
  source: 'receitaws',
  retrievedAt: new Date().toISOString(),
});

const isAxiosNotFound = (err: unknown): boolean =>
  err instanceof AxiosError && err.response?.status === 404;

const isAxiosServerError = (err: unknown): boolean =>
  err instanceof AxiosError &&
  (err.response == null || (err.response.status >= 500 && err.response.status <= 599));

const fetchFromBrasilApi = async (cnpj: string): Promise<CompanyDTO> => {
  const { data } = await brasilApiClient.get<unknown>(`/cnpj/v1/${cnpj}`);
  const parsed = BrasilApiCompanySchema.parse(data);
  return mapBrasilApiToCompanyDTO(parsed);
};

const fetchFromReceitaWs = async (cnpj: string): Promise<CompanyDTO> => {
  const { data } = await receitaWsClient.get<unknown>(`/cnpj/${cnpj}`);
  const parsed = ReceitaWsCompanySchema.parse(data);
  return mapReceitaWsToCompanyDTO(parsed);
};

export interface ICompanyRepository {
  findByCnpj(cnpj: string): Promise<CompanyDTO>;
  findManyByCnpjs(cnpjs: string[]): Promise<CompanyDTO[]>;
}

export const createCompanyRepository = (): ICompanyRepository => ({
  async findByCnpj(cnpj: string): Promise<CompanyDTO> {
    try {
      return await fetchFromBrasilApi(cnpj);
    } catch (primaryErr) {
      if (isAxiosNotFound(primaryErr)) {
        throw new NotFoundError(`errors.cnpj_not_found`);
      }

      try {
        return await fetchFromReceitaWs(cnpj);
      } catch (fallbackErr) {
        if (isAxiosNotFound(fallbackErr)) {
          throw new NotFoundError(`errors.cnpj_not_found`);
        }

        if (isAxiosServerError(fallbackErr)) {
          throw new UpstreamUnavailableError();
        }

        throw new UpstreamUnavailableError();
      }
    }
  },

  async findManyByCnpjs(cnpjs: string[]): Promise<CompanyDTO[]> {
    const settled = await Promise.allSettled(
      cnpjs.map((cnpj) =>
        fetchFromBrasilApi(cnpj).catch(() => fetchFromReceitaWs(cnpj))
      )
    );

    const fulfilled = settled
      .filter(
        (result): result is PromiseFulfilledResult<CompanyDTO> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value);

    return fulfilled;
  },
});
