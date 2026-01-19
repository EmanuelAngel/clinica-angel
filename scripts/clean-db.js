import { cleanDatabase } from "../tests/setup.js";

const main = async () => {
  try {
    console.log("🧹 Iniciando limpieza de base de datos...");
    await cleanDatabase();
    console.log("✅ Base de datos limpiada correctamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al limpiar la base de datos:", error);
    process.exit(1);
  }
};

main();
