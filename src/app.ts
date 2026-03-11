import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { i18next, i18nMiddleware } from "./config/i18n";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { errorHandlerMiddleware } from "./core/middlewares/error-handler.middleware";
import { notFoundMiddleware } from "./core/middlewares/not-found.middleware";
import companiesRouter from "./modules/companies/routes";

const buildRateLimiter = () =>
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        status: "error",
        statusCode: 429,
        message: i18next.t("errors.too_many_requests"),
      });
    },
  });

const buildCorsOptions = (): cors.CorsOptions => ({
  origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
  methods: ["GET", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Accept-Language"],
  optionsSuccessStatus: 204,
});

const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: "uWork API — Docs",
  customCss: ".swagger-ui .topbar { display: none }",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

export const createApp = (): Application => {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }),
  );
  app.use(cors(buildCorsOptions()));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(i18nMiddleware.handle(i18next));
  app.use(buildRateLimiter());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  app.get("/docs/spec.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions),
  );

  app.use("/api/v1/companies", companiesRouter);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
};
