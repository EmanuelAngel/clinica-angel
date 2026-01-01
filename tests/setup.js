import { prisma } from "../src/_shared/infrastructure/prisma.js";
import { env } from "../src/_shared/infrastructure/env-variables.js";

export const cleanDatabase = async () => {
  const dbName = env.MYSQL_DATABASE_NAME;

  // 1. Obtener tablas (esto puede ir fuera de la transacción)
  const tablenames = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = ${dbName}
  `;

  const tables = tablenames
    .map(({ table_name }) => table_name)
    .filter((name) => name !== "_prisma_migrations");

  try {
    // 2. Usar una transacción interactiva para "anclar" la conexión.
    // IMPORTANTE: Aumentamos el timeout porque limpiar puede tardar.
    await prisma.$transaction(
      async (tx) => {
        // Todo lo que ocurra aquí dentro usa la MISMA conexión (tx)

        // A. Desactivar FKs en ESTA conexión
        await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

        // B. Truncar tablas
        // NOTA: Dentro de una transacción interactiva de Prisma,
        // NO debemos usar Promise.all paralelo, es mejor secuencial
        // para garantizar la estabilidad del driver adapter.
        for (const table of tables) {
          await tx.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
        }

        // C. Reactivar FKs
        await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
      },
      {
        maxWait: 5000, // Tiempo máximo esperando una conexión
        timeout: 10000, // Tiempo máximo para ejecutar la limpieza
      }
    );
  } catch (error) {
    console.error(`Error cleaning database ${dbName}:`, error);
  }
};

export default prisma;
