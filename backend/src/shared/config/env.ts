import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  DATABASE_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  PRISMA_TRANSACTION_MAX_WAIT_MS: z.coerce.number().int().positive().default(10_000),
  PRISMA_TRANSACTION_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // WhatsApp
  WA_PHONE_ID: z.string().optional(),
  WA_TOKEN: z.string().optional(),
  WA_WEBHOOK_SECRET: z.string().optional(),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Email
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().default("noreply@billflow.app"),

  // App
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
