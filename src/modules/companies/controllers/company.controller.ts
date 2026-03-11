import { Request, Response } from 'express';
import { asyncHandler } from '../../../core/utils/async-handler';
import { isValidCnpj, sanitizeCnpj } from '../../../core/utils/cnpj-validator';
import { BadRequestError } from '../../../core/errors/base-error';
import {
  GetCompanyByCnpjParamsSchema,
  ListCompaniesQuerySchema,
  GenerateDatasetQuerySchema,
} from '../schemas/company.schema';
import type { ICompanyService } from '../services/company.service';

export const createCompanyController = (service: ICompanyService) => ({
  getCompanyByCnpj: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { cnpj } = GetCompanyByCnpjParamsSchema.parse(req.params);

    const sanitized = sanitizeCnpj(cnpj);

    !isValidCnpj(sanitized)
      ? (() => { throw new BadRequestError('errors.cnpj_invalid'); })()
      : null;

    const company = await service.getCompanyByCnpj(sanitized);

    res.status(200).json({
      status: 'success',
      message: req.t('success.company_fetched'),
      data: company,
    });
  }),

  generateDataset: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = GenerateDatasetQuerySchema.parse(req.query);

    const invalidCnpj = query.cnpjs.find((cnpj) => !isValidCnpj(cnpj));

    invalidCnpj !== undefined
      ? (() => { throw new BadRequestError('errors.cnpj_invalid'); })()
      : null;

    const dataset = await service.generateDataset(query);

    res.status(200).json({
      ...dataset,
      message: req.t('success.dataset_generated'),
    });
  }),

  listCompanies: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = ListCompaniesQuerySchema.parse(req.query);

    const result = await service.listCompanies(query);

    res.status(200).json({
      ...result,
      message: req.t('success.companies_listed'),
    });
  }),
});

export type CompanyController = ReturnType<typeof createCompanyController>;
