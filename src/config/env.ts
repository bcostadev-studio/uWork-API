import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  API_HOST: z.string().optional(),
  BRASIL_API_BASE_URL: z.string().url().default("https://brasilapi.com.br/api"),
  RECEITAWS_BASE_URL: z.string().url().default("https://receitaws.com.br/v1"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(30),
  CORS_ORIGIN: z.string().default("*"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

const data = parsed.data;

const resolvedApiHost =
  data.API_HOST !== undefined
    ? data.API_HOST
    : data.NODE_ENV === "production"
      ? "uwork.api.prod"
      : data.NODE_ENV === "development"
        ? "uwork.api.dev"
        : "localhost";

export const env = {
  ...data,
  API_HOST: resolvedApiHost,
};
