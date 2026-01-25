/* eslint-disable no-console */

import ms from "ms";
import { z } from "zod";

const envSchema = z
  .object({
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
    SALT_ROUNDS: z.coerce.number().positive().default(10),
    LOG_ERRORS: z.coerce.boolean().default(false),
  })
  .transform((data) => {
    /** @type {import('ms').StringValue} */
    // eslint-disable-next-line
    const expiresValue = /** @type {any} */ (data.JWT_EXPIRES);

    const milliseconds = ms(expiresValue);

    if (milliseconds === undefined) {
      throw new Error(`Valor inválido para JWT_EXPIRES: ${data.JWT_EXPIRES}`);
    }

    return {
      ...data,
      JWT_EXPIRES: expiresValue,
      COOKIE_MAX_AGE: milliseconds,
    };
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // flatten() saca los errores por campo: { DB_URL: ['Required'], PORT: ['Invalid number'] }
  const errors = JSON.stringify(result.error.flatten().fieldErrors, null, 2);

  const errorMessage = `\n❌ Invalid Environment Variables:\n${errors}\n`;

  if (process.env.NODE_ENV !== "test") {
    console.error(errorMessage);
    process.exit(1);
  } else {
    // Al meter los errores dentro del Error(), Jest los imprimirá SI O SÍ en la consola
    throw new Error(errorMessage);
  }
}

// Exportamos los datos validados
export const env = result.data;
