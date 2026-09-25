require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    console.log("Connected to Neon PostgreSQL:", result.rows[0].now);

    const server = app.listen(PORT, () => {
      console.log(`Stock Management API running on http://localhost:${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down...`);
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to connect to Neon PostgreSQL:", error.message);
    process.exit(1);
  }
}

startServer();
