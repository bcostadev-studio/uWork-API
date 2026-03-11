import { Router } from "express";
import { createCompanyRepository } from "./repositories/company.repository";
import { createCompanyService } from "./services/company.service";
import { createCompanyController } from "./controllers/company.controller";

const router = Router();

const repository = createCompanyRepository();
const service = createCompanyService(repository);
const controller = createCompanyController(service);

/**
 * @openapi
 * /companies/dataset:
 *   get:
 *     summary: Generate a JSON dataset from a list of CNPJs
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: cnpjs
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of 14-digit CNPJs (max 50)
 *         example: "60746948000112,33000167000101,43209527000148"
 *     responses:
 *       200:
 *         description: Dataset generated successfully
 *       400:
 *         description: One or more CNPJs are invalid
 *       422:
 *         description: Validation error
 */
router.get("/dataset", controller.generateDataset);

/**
 * @openapi
 * /companies:
 *   get:
 *     summary: List Brazilian companies with optional filters
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *           enum: [AC,AL,AP,AM,BA,CE,DF,ES,GO,MA,MT,MS,MG,PA,PB,PR,PE,PI,RJ,RN,RS,RO,RR,SC,SP,SE,TO]
 *         description: Filter by Brazilian state abbreviation
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active registration status
 *     responses:
 *       200:
 *         description: Companies listed successfully
 *       422:
 *         description: Validation error
 */
router.get("/", controller.listCompanies);

/**
 * @openapi
 * /companies/{cnpj}:
 *   get:
 *     summary: Retrieve a single Brazilian company by CNPJ
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: cnpj
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{14}$'
 *         description: 14-digit CNPJ (numbers only, no mask)
 *     responses:
 *       200:
 *         description: Company data retrieved successfully
 *       400:
 *         description: Invalid CNPJ
 *       404:
 *         description: Company not found
 *       502:
 *         description: Upstream data provider unavailable
 */
router.get("/:cnpj", controller.getCompanyByCnpj);

export default router;
