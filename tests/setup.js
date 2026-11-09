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
    // MySQL 8 devuelve la columna como TABLE_NAME (mayúsculas), MariaDB como
    // table_name. Desestructurar solo una de las dos formas deja undefined en
    // todas las filas y la limpieza falla silenciosamente.
    .map((row) => row.TABLE_NAME ?? row.table_name)
    .filter((name) => name && name !== "_prisma_migrations");

  try {
    // 2. Usar una transacción interactiva para "anclar" la conexión.
    // IMPORTANTE: Aumentamos el timeout porque limpiar puede tardar.
    await prisma.$transaction(
      async (tx) => {
        // Todo lo que ocurra aquí dentro usa la MISMA conexión (tx)

        // A. Desactivar FKs en ESTA conexión
        await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

        // B. Borrar filas.
        // NO usar TRUNCATE: en MySQL TRUNCATE es DDL y hace COMMIT IMPLÍCITO,
        // lo que invalida la transacción interactiva de Prisma. El error se
        // tragaba el catch y los tests seguían con fixtures sucios, fallando
        // con P2002 en el segundo test de cada archivo. DELETE es DML: respeta
        // la transacción. La PK conserva el contador, que los tests no asumen.
        for (const table of tables) {
          await tx.$executeRawUnsafe(`DELETE FROM \`${table}\`;`);
        }

        // C. Reactivar FKs
        await tx.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
      },
      {
        maxWait: 5000, // Tiempo máximo esperando una conexión
        timeout: 20000, // Tiempo máximo para ejecutar la limpieza
      }
    );
  } catch (error) {
    // Un fallo de limpieza deja fixtures duplicados y contamina el resto de la
    // corrida: se reporta y se propaga en vez de silenciarse.
    console.error(`Error cleaning database ${dbName}:`, error);
    throw error;
  }
};

export default prisma;
