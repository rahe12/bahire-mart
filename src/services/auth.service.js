const bcrypt = require("bcrypt");
const pool = require("../config/database");
const { signToken } = require("../utils/jwt");

async function register(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM users WHERE LOWER(email)=LOWER($1)",
      [data.email]
    );

    if (existing.rowCount) {
      const error = new Error("Email is already registered");
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const userResult = await client.query(
      `INSERT INTO users(name,email,password_hash)
       VALUES($1,$2,$3)
       RETURNING id,name,email,created_at`,
      [data.name, data.email.toLowerCase(), passwordHash]
    );

    const user = userResult.rows[0];

    const businessResult = await client.query(
      `INSERT INTO businesses(owner_id,name)
       VALUES($1,$2)
       RETURNING id,name,currency`,
      [user.id, data.businessName]
    );

    await client.query("COMMIT");

    return {
      user,
      business: businessResult.rows[0],
      token: signToken(user)
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function login(email, password) {
  const result = await pool.query(
    `SELECT u.id,u.name,u.email,u.password_hash,
            b.id AS business_id,b.name AS business_name,b.currency
     FROM users u
     JOIN businesses b ON b.owner_id=u.id
     WHERE LOWER(u.email)=LOWER($1)
     LIMIT 1`,
    [email]
  );

  if (!result.rowCount) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const row = result.rows[0];

  if (!(await bcrypt.compare(password, row.password_hash))) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  return {
    user: { id: row.id, name: row.name, email: row.email },
    business: {
      id: row.business_id,
      name: row.business_name,
      currency: row.currency
    },
    token: signToken(row)
  };
}

module.exports = { register, login };
