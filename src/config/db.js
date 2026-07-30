import { Pool } from "pg";
import { config } from "./env.js";

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("[DB Pool] Error inesperado en la conexión:", err);
});

export default pool;

export const query = (text, params) => pool.query(text, params);

export async function testConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("[DB Pool] Conexión exitosa a la base de datos");
  } catch (err) {
    console.error(
      "[DB Pool] No se pudo conectar a la base de datos:",
      err.message,
    );
    process.exit(1);
  }
}
