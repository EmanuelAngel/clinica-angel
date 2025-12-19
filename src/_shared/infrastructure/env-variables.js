/* eslint-disable no-console */

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().positive().default(8080),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  JWT_SECRET: z
    .string()
    .min(32, "Se recomienda un secreto de al menos 32 caracteres"),
  JWT_EXPIRES: z
    .string()
    .regex(/^\d+[hdms]$/, 'Formato inválido (ej: "1h", "7d")')
    .default("1h"),

  MYSQL_CONNECTION_STRING: z
    .string()
    .url()
    .startsWith("mysql://", "Debe ser una URL de MySQL"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Error en las variables de entorno:");
  // Formatea los errores de Zod para que sean legibles
  console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

// Exportamos los datos validados
export const env = result.data;
