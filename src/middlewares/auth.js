const jwt = require("jsonwebtoken");
const pool = require("../config/database");

async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  try {
    const token = header.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      "SELECT id FROM businesses WHERE owner_id=$1 ORDER BY id LIMIT 1",
      [payload.userId]
    );

    if (!result.rowCount) {
      return res.status(403).json({
        success: false,
        message: "No business is associated with this account"
      });
    }

    req.user = payload;
    req.user.businessId = result.rows[0].id;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
}

module.exports = auth;
