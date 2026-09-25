require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../src/config/database");

async function migrate() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "migrations", "001_initial.sql"),
      "utf8"
    );
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Neon database migration completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
