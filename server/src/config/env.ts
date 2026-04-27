import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export const env = envSchema.parse(process.env);

