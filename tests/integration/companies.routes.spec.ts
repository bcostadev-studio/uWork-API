import request from "supertest";
import { createApp } from "../../src/app";
import type { Application } from "express";

jest.mock(
  "../../src/modules/companies/repositories/company.repository",
  () => ({
    createCompanyRepository: jest.fn(() => ({
      findByCnpj: jest.fn().mockResolvedValue({
        cnpj: "60746948000112",
        legalName: "ITAU UNIBANCO SA",
        tradeName: "ITAU",
        registrationStatus: "ATIVA",
        registrationDate: "1944-09-09",
        legalNature: "Sociedade Anônima Aberta",
        size: "DEMAIS",
        shareCapital: 97148600000,
        email: "contato@itau.com.br",
        phone: "(11) 5029-1818",
        address: {
          street: "PRACA ALFREDO EGYDIO DE SOUZA ARANHA",
          number: "100",
          complement: "TORRE OLAVO SETUBAL",
          neighborhood: "PARQUE JABAQUARA",
          city: "SAO PAULO",
          state: "SP",
          zipCode: "04344-902",
        },
        mainActivity: {
          code: "6422100",
          description: "Bancos múltiplos, com carteira comercial",
        },
        secondaryActivities: [],
        partners: [
          {
            name: "ROBERTO EGYDIO SETUBAL",
            role: "Diretor-Presidente",
            entryDate: "1994-04-01",
          },
        ],
        taxRegimeHistory: [{ year: 2022, regime: "LUCRO REAL" }],
        simplesNacional: false,
        mei: false,
        isHeadquarters: true,
        source: "brasilapi",
        retrievedAt: "2024-01-01T00:00:00.000Z",
      }),
      findManyByCnpjs: jest.fn().mockImplementation((cnpjs: string[]) =>
        Promise.resolve(
          cnpjs.map((cnpj) => ({
            cnpj,
            legalName: "ITAU UNIBANCO SA",
            tradeName: "ITAU",
            registrationStatus: "ATIVA",
            registrationDate: "1944-09-09",
            legalNature: "Sociedade Anônima Aberta",
            size: "DEMAIS",
            shareCapital: 97148600000,
            email: "contato@itau.com.br",
            phone: "(11) 5029-1818",
            address: {
              street: "PRACA ALFREDO EGYDIO DE SOUZA ARANHA",
              number: "100",
              complement: "TORRE OLAVO SETUBAL",
              neighborhood: "PARQUE JABAQUARA",
              city: "SAO PAULO",
              state: "SP",
              zipCode: "04344-902",
            },
            mainActivity: {
              code: "6422100",
              description: "Bancos múltiplos, com carteira comercial",
            },
            secondaryActivities: [],
            partners: [
              {
                name: "ROBERTO EGYDIO SETUBAL",
                role: "Diretor-Presidente",
                entryDate: "1994-04-01",
              },
            ],
            taxRegimeHistory: [{ year: 2022, regime: "LUCRO REAL" }],
            simplesNacional: false,
            mei: false,
            isHeadquarters: true,
            source: "brasilapi",
            retrievedAt: "2024-01-01T00:00:00.000Z",
          })),
        ),
      ),
    })),
  }),
);

describe("Companies Routes — Integration", () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe("GET /health", () => {
    it("should return 200 with health payload", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.uptime).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });
  });

  describe("GET /api/v1/companies/:cnpj", () => {
    it("should return 200 with company data for a valid CNPJ", async () => {
      const response = await request(app)
        .get("/api/v1/companies/60746948000112")
        .set("Accept-Language", "en");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();
      expect(response.body.data.cnpj).toBe("60746948000112");
      expect(response.body.data.legalName).toBeDefined();
      expect(response.body.data.address).toBeDefined();
      expect(response.body.data.mainActivity).toBeDefined();
    });

    it("should return 422 when CNPJ param has fewer than 14 digits", async () => {
      const response = await request(app)
        .get("/api/v1/companies/1234")
        .set("Accept-Language", "en");

      expect(response.status).toBe(422);
      expect(response.body.status).toBe("error");
    });

    it("should return 422 when CNPJ contains non-numeric characters", async () => {
      const response = await request(app)
        .get("/api/v1/companies/6074694800011X")
        .set("Accept-Language", "en");

      expect(response.status).toBe(422);
      expect(response.body.status).toBe("error");
    });

    it("should return 400 when CNPJ is 14 digits but fails the check-digit algorithm", async () => {
      const response = await request(app)
        .get("/api/v1/companies/11111111111111")
        .set("Accept-Language", "en");

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });

    it("should respond with Portuguese messages when Accept-Language is pt", async () => {
      const response = await request(app)
        .get("/api/v1/companies/60746948000112")
        .set("Accept-Language", "pt");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "Dados da empresa recuperados com sucesso",
      );
    });

    it("should respond with English messages when Accept-Language is en", async () => {
      const response = await request(app)
        .get("/api/v1/companies/60746948000112")
        .set("Accept-Language", "en");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Company data retrieved successfully");
    });
  });

  describe("GET /api/v1/companies", () => {
    it("should return 200 with a paginated list of companies", async () => {
      const response = await request(app)
        .get("/api/v1/companies")
        .set("Accept-Language", "en");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.page).toBeDefined();
      expect(response.body.limit).toBeDefined();
      expect(response.body.total).toBeDefined();
      expect(response.body.generatedAt).toBeDefined();
    });

    it("should accept valid page and limit query params", async () => {
      const response = await request(app)
        .get("/api/v1/companies?page=1&limit=5")
        .set("Accept-Language", "en");

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
    });

    it("should return 422 when limit exceeds 100", async () => {
      const response = await request(app)
        .get("/api/v1/companies?limit=101")
        .set("Accept-Language", "en");

      expect(response.status).toBe(422);
      expect(response.body.status).toBe("error");
    });

    it("should return 422 when page is less than 1", async () => {
      const response = await request(app)
        .get("/api/v1/companies?page=0")
        .set("Accept-Language", "en");

      expect(response.status).toBe(422);
      expect(response.body.status).toBe("error");
    });

    it("should return 422 when state is not a valid Brazilian state abbreviation", async () => {
      const response = await request(app)
        .get("/api/v1/companies?state=XX")
        .set("Accept-Language", "en");

      expect(response.status).toBe(422);
      expect(response.body.status).toBe("error");
    });

    it("should accept a valid state filter", async () => {
      const response = await request(app)
        .get("/api/v1/companies?state=SP")
        .set("Accept-Language", "en");

      expect(response.status).toBe(200);
    });

    it("should accept active=true filter", async () => {
      const response = await request(app)
        .get("/api/v1/companies?active=true")
        .set("Accept-Language", "en");

      expect(response.status).toBe(200);
    });

    it("should accept active=false filter", async () => {
      const response = await request(app)
        .get("/api/v1/companies?active=false")
        .set("Accept-Language", "en");

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/v1/companies/dataset", () => {
    it("should return 200 with a dataset for valid CNPJs", async () => {
      const cnpjs = "60746948000112,33000167000101";

      const response = await request(app)
        .get(`/api/v1/companies/dataset?cnpjs=${cnpjs}`)
        .set("Accept-Language", "en");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(response.body.generatedAt).toBeDefined();
    });

    it("should return 422 when cnpjs query param is missing", async () => {
      const response = await request(app)
        .get("/api/v1/companies/dataset")
        .set("Accept-Language", "en");

      expect(response.status).toBe(422);
      expect(response.body.status).toBe("error");
    });

    it("should return 422 when a CNPJ in the list is not 14 digits", async () => {
      const response = await request(app)
        .get("/api/v1/companies/dataset?cnpjs=123,60746948000112")
        .set("Accept-Language", "en");

      expect(response.status).toBe(422);
      expect(response.body.status).toBe("error");
    });

    it("should return 400 when a CNPJ fails check-digit validation", async () => {
      const response = await request(app)
        .get("/api/v1/companies/dataset?cnpjs=11111111111111")
        .set("Accept-Language", "en");

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
    });

    it("should include a valid ISO generatedAt timestamp", async () => {
      const response = await request(app)
        .get("/api/v1/companies/dataset?cnpjs=60746948000112")
        .set("Accept-Language", "en");

      expect(response.status).toBe(200);
      expect(new Date(response.body.generatedAt).toISOString()).toBe(
        response.body.generatedAt,
      );
    });
  });

  describe("GET /unknown-route", () => {
    it("should return 404 for unregistered routes", async () => {
      const response = await request(app)
        .get("/api/v1/unknown")
        .set("Accept-Language", "en");

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
    });
  });
});
