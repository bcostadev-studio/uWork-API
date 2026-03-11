import { z } from 'zod';

export const BrasilApiQsaSchema = z.object({
  pais: z.string().nullable(),
  nome_socio: z.string(),
  codigo_pais: z.string().nullable(),
  faixa_etaria: z.string().nullable(),
  cnpj_cpf_do_socio: z.string().nullable(),
  qualificacao_socio: z.string(),
  codigo_faixa_etaria: z.number().nullable(),
  data_entrada_sociedade: z.string().nullable(),
  identificador_de_socio: z.number(),
  cpf_representante_legal: z.string().nullable(),
  nome_representante_legal: z.string().nullable(),
  codigo_qualificacao_socio: z.number(),
  qualificacao_representante_legal: z.string().nullable(),
  codigo_qualificacao_representante_legal: z.number(),
});

export const BrasilApiCnaeSecundarioSchema = z.object({
  codigo: z.number(),
  descricao: z.string(),
});

export const BrasilApiRegimeTributarioSchema = z.object({
  ano: z.number(),
  cnpj_da_scp: z.string().nullable(),
  forma_de_tributacao: z.string(),
  quantidade_de_escrituracoes: z.number(),
});

export const BrasilApiCompanySchema = z.object({
  cnpj: z.string(),
  razao_social: z.string(),
  nome_fantasia: z.string().nullable(),
  descricao_situacao_cadastral: z.string(),
  data_situacao_cadastral: z.string().nullable(),
  data_inicio_atividade: z.string().nullable(),
  natureza_juridica: z.string().nullable(),
  porte: z.string().nullable(),
  capital_social: z.number(),
  email: z.string().nullable(),
  ddd_telefone_1: z.string().nullable(),
  ddd_telefone_2: z.string().nullable(),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string().nullable(),
  bairro: z.string(),
  municipio: z.string(),
  uf: z.string(),
  cep: z.string(),
  cnae_fiscal: z.number(),
  cnae_fiscal_descricao: z.string(),
  cnaes_secundarios: z.array(BrasilApiCnaeSecundarioSchema),
  qsa: z.array(BrasilApiQsaSchema).nullable(),
  regime_tributario: z.array(BrasilApiRegimeTributarioSchema).nullable(),
  opcao_pelo_simples: z.boolean().nullable(),
  opcao_pelo_mei: z.boolean().nullable(),
  descricao_identificador_matriz_filial: z.string().nullable(),
  codigo_natureza_juridica: z.number().nullable(),
});

export const ReceitaWsAtividadeSchema = z.object({
  code: z.string(),
  text: z.string(),
});

export const ReceitaWsQsaSchema = z.object({
  nome: z.string(),
  qual: z.string(),
});

export const ReceitaWsSimplesSchema = z.object({
  optante: z.boolean(),
  data_opcao: z.string().nullable(),
  data_exclusao: z.string().nullable(),
  ultima_atualizacao: z.string().nullable(),
});

export const ReceitaWsCompanySchema = z.object({
  cnpj: z.string(),
  nome: z.string(),
  fantasia: z.string().nullable(),
  situacao: z.string(),
  data_situacao: z.string().nullable(),
  abertura: z.string().nullable(),
  natureza_juridica: z.string().nullable(),
  porte: z.string().nullable(),
  capital_social: z.string(),
  email: z.string().nullable(),
  telefone: z.string().nullable(),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string().nullable(),
  bairro: z.string(),
  municipio: z.string(),
  uf: z.string(),
  cep: z.string(),
  atividade_principal: z.array(ReceitaWsAtividadeSchema),
  atividades_secundarias: z.array(ReceitaWsAtividadeSchema),
  qsa: z.array(ReceitaWsQsaSchema),
  simples: ReceitaWsSimplesSchema.nullable(),
  simei: ReceitaWsSimplesSchema.nullable(),
  tipo: z.string().nullable(),
  status: z.string(),
});

export type BrasilApiQsa = z.infer<typeof BrasilApiQsaSchema>;
export type BrasilApiCnaeSecundario = z.infer<typeof BrasilApiCnaeSecundarioSchema>;
export type BrasilApiRegimeTributario = z.infer<typeof BrasilApiRegimeTributarioSchema>;
export type BrasilApiCompany = z.infer<typeof BrasilApiCompanySchema>;

export type ReceitaWsAtividade = z.infer<typeof ReceitaWsAtividadeSchema>;
export type ReceitaWsQsa = z.infer<typeof ReceitaWsQsaSchema>;
export type ReceitaWsSimples = z.infer<typeof ReceitaWsSimplesSchema>;
export type ReceitaWsCompany = z.infer<typeof ReceitaWsCompanySchema>;
