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

  MYSQL_DATABASE_HOST: z
    .string()
    .min(1, "El host de la base de datos es requerido")
    .default("localhost"),

  MYSQL_DATABASE_USER: z
    .string()
    .min(1, "El usuario de la base de datos es requerido"),

  MYSQL_DATABASE_PASSWORD: z.string().default(""),

  MYSQL_DATABASE_NAME: z
    .string()
    .min(1, "El nombre de la base de datos es requerido"),

  MYSQL_DATABASE_CONNECTION_LIMIT: z.coerce
    .number()
    .positive("El límite de conexiones debe ser positivo")
    .default(4),
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
