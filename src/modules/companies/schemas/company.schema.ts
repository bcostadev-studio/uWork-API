import { z } from "zod";

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export const BrazilianStateSchema = z.enum(BRAZILIAN_STATES);

export const CompanySectorSchema = z.enum([
  "agriculture",
  "construction",
  "education",
  "energy",
  "finance",
  "health",
  "industry",
  "logistics",
  "retail",
  "services",
  "technology",
  "telecommunications",
  "other",
]);

export const GetCompanyByCnpjParamsSchema = z.object({
  cnpj: z
    .string({ error: "validation.cnpj_required" })
    .regex(/^\d{14}$/, "validation.cnpj_length"),
});

export const ListCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "validation.page_min").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "validation.limit_min")
    .max(100, "validation.limit_max")
    .default(20),
  state: BrazilianStateSchema.optional(),
  sector: CompanySectorSchema.optional(),
  active: z
    .string()
    .toLowerCase()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
});

export const GenerateDatasetQuerySchema = z.object({
  cnpjs: z
    .string()
    .transform((v) => v.split(",").map((s) => s.trim()))
    .pipe(
      z
        .array(z.string().regex(/^\d{14}$/, "validation.cnpj_length"))
        .min(1)
        .max(50),
    ),
});

export const CnaeSchema = z.object({
  code: z.string(),
  description: z.string(),
});

export const PartnerSchema = z.object({
  name: z.string(),
  role: z.string(),
  entryDate: z.string().nullable(),
});

export const AddressSchema = z.object({
  street: z.string(),
  number: z.string(),
  complement: z.string().nullable(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
});

export const TaxRegimeEntrySchema = z.object({
  year: z.number(),
  regime: z.string(),
});

export const CompanySchema = z.object({
  cnpj: z.string(),
  legalName: z.string(),
  tradeName: z.string().nullable(),
  registrationStatus: z.string(),
  registrationDate: z.string(),
  legalNature: z.string(),
  size: z.string(),
  shareCapital: z.number(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: AddressSchema,
  mainActivity: CnaeSchema,
  secondaryActivities: z.array(CnaeSchema),
  partners: z.array(PartnerSchema),
  taxRegimeHistory: z.array(TaxRegimeEntrySchema),
  simplesNacional: z.boolean().nullable(),
  mei: z.boolean().nullable(),
  isHeadquarters: z.boolean(),
  source: z.enum(["brasilapi", "receitaws"]),
  retrievedAt: z.string(),
});

export const DatasetResponseSchema = z.object({
  status: z.literal("success"),
  total: z.number(),
  page: z.number().optional(),
  limit: z.number().optional(),
  data: z.array(CompanySchema),
  generatedAt: z.string(),
});

export type BrazilianState = z.infer<typeof BrazilianStateSchema>;
export type CompanySector = z.infer<typeof CompanySectorSchema>;
export type GetCompanyByCnpjParams = z.infer<
  typeof GetCompanyByCnpjParamsSchema
>;
export type ListCompaniesQuery = z.infer<typeof ListCompaniesQuerySchema>;
export type GenerateDatasetQuery = z.infer<typeof GenerateDatasetQuerySchema>;
export type CnaeDTO = z.infer<typeof CnaeSchema>;
export type PartnerDTO = z.infer<typeof PartnerSchema>;
export type AddressDTO = z.infer<typeof AddressSchema>;
export type TaxRegimeEntryDTO = z.infer<typeof TaxRegimeEntrySchema>;
export type CompanyDTO = z.infer<typeof CompanySchema>;
export type DatasetResponseDTO = z.infer<typeof DatasetResponseSchema>;
