import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const isTest = env.NODE_ENV === "test";

const servers = isTest
  ? [{ url: `http://localhost:${env.PORT}/api/v1`, description: "Test" }]
  : [
      {
        url: `https://uwork.api.prod/api/v1`,
        description: "Production — https://uwork.api.prod",
      },
      {
        url: `https://uwork.api.dev/api/v1`,
        description: "Development — https://uwork.api.dev",
      },
    ];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "uWork — Brazilian Company Dataset API",
      version: "1.0.0",
      description: [
        "REST API for retrieving and generating structured JSON datasets from Brazilian public company registries.",
        "",
        "**Data Sources**",
        "- [BrasilAPI](https://brasilapi.com.br) — primary source, provides tax regime history and full QSA",
        "- [ReceitaWS](https://receitaws.com.br) — automatic fallback when BrasilAPI is unavailable",
        "",
        "**CNPJ Format**",
        "All CNPJ values must be sent as 14 raw digits (no dots, slashes or dashes).",
        "The API validates the check-digit algorithm on every request.",
        "",
        "**i18n**",
        "All response messages are localised. Send `Accept-Language: pt` for Brazilian Portuguese or `Accept-Language: en` (default) for English.",
      ].join("\n"),
      contact: {
        name: "uWork API",
        url: "https://github.com/uwork",
      },
      license: {
        name: "ISC",
      },
    },
    servers,
    tags: [
      {
        name: "Health",
        description: "Service liveness and readiness",
      },
      {
        name: "Companies",
        description:
          "Lookup, list and dataset generation for Brazilian companies (CNPJ)",
      },
    ],
    components: {
      schemas: {
        Cnae: {
          type: "object",
          required: ["code", "description"],
          properties: {
            code: {
              type: "string",
              example: "6422100",
              description: "CNAE numeric code",
            },
            description: {
              type: "string",
              example: "Bancos múltiplos, com carteira comercial",
            },
          },
        },
        Address: {
          type: "object",
          required: [
            "street",
            "number",
            "complement",
            "neighborhood",
            "city",
            "state",
            "zipCode",
          ],
          properties: {
            street: {
              type: "string",
              example: "PRACA ALFREDO EGYDIO DE SOUZA ARANHA",
            },
            number: { type: "string", example: "100" },
            complement: {
              type: "string",
              nullable: true,
              example: "TORRE OLAVO SETUBAL",
            },
            neighborhood: { type: "string", example: "PARQUE JABAQUARA" },
            city: { type: "string", example: "SAO PAULO" },
            state: {
              type: "string",
              example: "SP",
              description: "Brazilian state abbreviation (UF)",
            },
            zipCode: { type: "string", example: "04344-902" },
          },
        },
        Partner: {
          type: "object",
          required: ["name", "role", "entryDate"],
          properties: {
            name: { type: "string", example: "ROBERTO EGYDIO SETUBAL" },
            role: { type: "string", example: "Diretor-Presidente" },
            entryDate: {
              type: "string",
              nullable: true,
              example: "1994-04-01",
              description: "Date the partner joined the company (ISO 8601)",
            },
          },
        },
        TaxRegimeEntry: {
          type: "object",
          required: ["year", "regime"],
          properties: {
            year: { type: "integer", example: 2023 },
            regime: { type: "string", example: "LUCRO REAL" },
          },
        },
        Company: {
          type: "object",
          required: [
            "cnpj",
            "legalName",
            "tradeName",
            "registrationStatus",
            "registrationDate",
            "legalNature",
            "size",
            "shareCapital",
            "email",
            "phone",
            "address",
            "mainActivity",
            "secondaryActivities",
            "partners",
            "taxRegimeHistory",
            "simplesNacional",
            "mei",
            "isHeadquarters",
            "source",
            "retrievedAt",
          ],
          properties: {
            cnpj: {
              type: "string",
              example: "60746948000112",
              description: "14-digit CNPJ (no mask)",
            },
            legalName: {
              type: "string",
              example: "ITAU UNIBANCO SA",
              description: "Razão Social",
            },
            tradeName: {
              type: "string",
              nullable: true,
              example: "ITAU",
              description: "Nome Fantasia",
            },
            registrationStatus: {
              type: "string",
              example: "ATIVA",
              description: "Situação Cadastral na Receita Federal",
            },
            registrationDate: {
              type: "string",
              example: "1944-09-09",
              description: "Date of first registration (ISO 8601)",
            },
            legalNature: {
              type: "string",
              example: "Sociedade Anônima Aberta",
              description: "Natureza Jurídica",
            },
            size: {
              type: "string",
              example: "DEMAIS",
              description: "Porte da empresa (ME, EPP, DEMAIS, etc.)",
            },
            shareCapital: {
              type: "number",
              format: "float",
              example: 97148600000,
              description: "Capital Social in BRL",
            },
            email: {
              type: "string",
              nullable: true,
              example: "contato@itau.com.br",
            },
            phone: {
              type: "string",
              nullable: true,
              example: "(11) 5029-1818",
            },
            address: { $ref: "#/components/schemas/Address" },
            mainActivity: { $ref: "#/components/schemas/Cnae" },
            secondaryActivities: {
              type: "array",
              items: { $ref: "#/components/schemas/Cnae" },
            },
            partners: {
              type: "array",
              items: { $ref: "#/components/schemas/Partner" },
            },
            taxRegimeHistory: {
              type: "array",
              items: { $ref: "#/components/schemas/TaxRegimeEntry" },
              description: "Available only when source is brasilapi",
            },
            simplesNacional: {
              type: "boolean",
              nullable: true,
              example: false,
              description: "Whether the company is opted into Simples Nacional",
            },
            mei: {
              type: "boolean",
              nullable: true,
              example: false,
              description: "Whether the company is a MEI",
            },
            isHeadquarters: {
              type: "boolean",
              example: true,
              description: "True when this CNPJ is the MATRIZ (headquarter)",
            },
            source: {
              type: "string",
              enum: ["brasilapi", "receitaws"],
              example: "brasilapi",
              description: "Which upstream provider served this record",
            },
            retrievedAt: {
              type: "string",
              format: "date-time",
              example: "2024-07-01T12:00:00.000Z",
              description: "Timestamp when the record was fetched (ISO 8601)",
            },
          },
        },
        DatasetResponse: {
          type: "object",
          required: ["status", "total", "data", "generatedAt"],
          properties: {
            status: { type: "string", enum: ["success"], example: "success" },
            message: {
              type: "string",
              example: "Dataset generated successfully",
            },
            total: { type: "integer", example: 3 },
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Company" },
            },
            generatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-07-01T12:00:00.000Z",
            },
          },
        },
        SingleCompanyResponse: {
          type: "object",
          required: ["status", "message", "data"],
          properties: {
            status: { type: "string", enum: ["success"], example: "success" },
            message: {
              type: "string",
              example: "Company data retrieved successfully",
            },
            data: { $ref: "#/components/schemas/Company" },
          },
        },
        HealthResponse: {
          type: "object",
          required: ["status", "uptime", "timestamp", "environment"],
          properties: {
            status: { type: "string", enum: ["ok"], example: "ok" },
            uptime: { type: "number", example: 3724.5 },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2024-07-01T12:00:00.000Z",
            },
            environment: {
              type: "string",
              enum: ["development", "production", "test"],
              example: "production",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["status", "statusCode", "message"],
          properties: {
            status: { type: "string", enum: ["error"], example: "error" },
            statusCode: { type: "integer", example: 400 },
            message: {
              type: "string",
              example: "The provided CNPJ is invalid",
            },
            details: {
              type: "object",
              description: "Present only on validation errors (422)",
              additionalProperties: {
                type: "array",
                items: { type: "string" },
              },
              example: {
                cnpj: ["CNPJ must be exactly 14 digits (numbers only)"],
              },
            },
          },
        },
      },
      parameters: {
        CnpjPath: {
          name: "cnpj",
          in: "path",
          required: true,
          schema: { type: "string", pattern: "^\\d{14}$" },
          description:
            "14-digit CNPJ — numbers only, no mask (e.g. `60746948000112`)",
          example: "60746948000112",
        },
        PageQuery: {
          name: "page",
          in: "query",
          schema: { type: "integer", minimum: 1, default: 1 },
          description: "Page number (1-based)",
        },
        LimitQuery: {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          description: "Number of results per page (max 100)",
        },
        StateQuery: {
          name: "state",
          in: "query",
          schema: {
            type: "string",
            enum: [
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
            ],
          },
          description: "Filter by Brazilian state abbreviation (UF)",
        },
        ActiveQuery: {
          name: "active",
          in: "query",
          schema: { type: "boolean" },
          description:
            "`true` returns only companies with `registrationStatus = ATIVA`, `false` returns all others",
        },
        CnpjsQuery: {
          name: "cnpjs",
          in: "query",
          required: true,
          schema: { type: "string" },
          description:
            "Comma-separated list of 14-digit CNPJs (max 50). Example: `60746948000112,33000167000101`",
          example: "60746948000112,33000167000101,43209527000148",
        },
      },
      responses: {
        BadRequest: {
          description: "Invalid CNPJ (check-digit validation failed)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                status: "error",
                statusCode: 400,
                message: "The provided CNPJ is invalid",
              },
            },
          },
        },
        NotFound: {
          description: "Company not found in any upstream source",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                status: "error",
                statusCode: 404,
                message: "Company with CNPJ 60746948000112 was not found",
              },
            },
          },
        },
        ValidationError: {
          description:
            "Request payload or query params failed Zod schema validation",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                status: "error",
                statusCode: 422,
                message: "Validation error",
                details: {
                  cnpj: ["CNPJ must be exactly 14 digits (numbers only)"],
                },
              },
            },
          },
        },
        TooManyRequests: {
          description: "Rate limit exceeded",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                status: "error",
                statusCode: 429,
                message: "Too many requests, please try again later",
              },
            },
          },
        },
        UpstreamUnavailable: {
          description: "Both BrasilAPI and ReceitaWS are currently unavailable",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                status: "error",
                statusCode: 502,
                message: "Upstream data provider is currently unavailable",
              },
            },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Liveness check",
          description:
            "Returns service uptime, timestamp and current environment.",
          operationId: "getHealth",
          responses: {
            "200": {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/companies": {
        get: {
          tags: ["Companies"],
          summary: "List Brazilian companies",
          description:
            "Returns a paginated list of Brazilian companies sourced from a curated seed of real CNPJs. Filter by state (UF) and/or active registration status.",
          operationId: "listCompanies",
          parameters: [
            { $ref: "#/components/parameters/PageQuery" },
            { $ref: "#/components/parameters/LimitQuery" },
            { $ref: "#/components/parameters/StateQuery" },
            { $ref: "#/components/parameters/ActiveQuery" },
          ],
          responses: {
            "200": {
              description: "Companies listed successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DatasetResponse" },
                },
              },
            },
            "422": { $ref: "#/components/responses/ValidationError" },
            "429": { $ref: "#/components/responses/TooManyRequests" },
          },
        },
      },
      "/api/v1/companies/dataset": {
        get: {
          tags: ["Companies"],
          summary: "Generate a JSON dataset from a CNPJ list",
          description:
            "Accepts up to **50** CNPJs as a comma-separated query parameter and returns a structured JSON dataset. Partial failures are tolerated — companies that cannot be fetched are silently omitted from the result.",
          operationId: "generateDataset",
          parameters: [{ $ref: "#/components/parameters/CnpjsQuery" }],
          responses: {
            "200": {
              description: "Dataset generated successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DatasetResponse" },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "422": { $ref: "#/components/responses/ValidationError" },
            "429": { $ref: "#/components/responses/TooManyRequests" },
          },
        },
      },
      "/api/v1/companies/{cnpj}": {
        get: {
          tags: ["Companies"],
          summary: "Get a single company by CNPJ",
          description:
            "Fetches a single Brazilian company record by its 14-digit CNPJ. Tries BrasilAPI first and automatically falls back to ReceitaWS on failure.",
          operationId: "getCompanyByCnpj",
          parameters: [{ $ref: "#/components/parameters/CnpjPath" }],
          responses: {
            "200": {
              description: "Company data retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SingleCompanyResponse",
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
            "404": { $ref: "#/components/responses/NotFound" },
            "422": { $ref: "#/components/responses/ValidationError" },
            "429": { $ref: "#/components/responses/TooManyRequests" },
            "502": { $ref: "#/components/responses/UpstreamUnavailable" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
