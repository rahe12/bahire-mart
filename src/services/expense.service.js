const pool = require("../config/database");

async function createExpense(businessId, data) {
  const result = await pool.query(
    `INSERT INTO expenses
     (business_id,category,description,amount,expense_date)
     VALUES($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      businessId,
      data.category,
      data.description || null,
      data.amount,
      data.expenseDate || new Date().toISOString()
    ]
  );
  return result.rows[0];
}

async function listExpenses(businessId, from, to) {
  const values = [businessId];
  let where = "business_id=$1";

  if (from) {
    values.push(from);
    where += ` AND expense_date >= $${values.length}`;
  }

  if (to) {
    values.push(to);
    where += ` AND expense_date <= $${values.length}`;
  }

  const result = await pool.query(
    `SELECT * FROM expenses WHERE ${where} ORDER BY expense_date DESC`,
    values
  );
  return result.rows;
}

module.exports = { createExpense, listExpenses };
