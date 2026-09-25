const pool = require("../config/database");

async function dashboard(businessId) {
  const [sales, expenses, inventory] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(total_amount),0) sales,
              COALESCE(SUM(total_cost),0) cost,
              COALESCE(SUM(gross_profit),0) gross_profit
       FROM sales
       WHERE business_id=$1 AND sold_at >= CURRENT_DATE`,
      [businessId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount),0) expenses
       FROM expenses
       WHERE business_id=$1 AND expense_date >= CURRENT_DATE`,
      [businessId]
    ),
    pool.query(
      `SELECT COUNT(*)::int product_count,
              COALESCE(SUM(quantity),0) total_units,
              COUNT(*) FILTER (WHERE quantity <= minimum_stock)::int low_stock_products
       FROM products
       WHERE business_id=$1 AND active=true`,
      [businessId]
    )
  ]);

  const s = sales.rows[0];
  const e = expenses.rows[0];
  const i = inventory.rows[0];

  return {
    today: {
      sales: Number(s.sales),
      cost: Number(s.cost),
      grossProfit: Number(s.gross_profit),
      expenses: Number(e.expenses),
      netProfit: Number(s.gross_profit) - Number(e.expenses)
    },
    inventory: {
      productCount: i.product_count,
      totalUnits: Number(i.total_units),
      lowStockProducts: i.low_stock_products
    }
  };
}

async function profitLoss(businessId, from, to) {
  const result = await pool.query(
    `SELECT
      COALESCE((SELECT SUM(total_amount) FROM sales
        WHERE business_id=$1 AND sold_at >= $2 AND sold_at <= $3),0) revenue,
      COALESCE((SELECT SUM(total_cost) FROM sales
        WHERE business_id=$1 AND sold_at >= $2 AND sold_at <= $3),0) cost,
      COALESCE((SELECT SUM(gross_profit) FROM sales
        WHERE business_id=$1 AND sold_at >= $2 AND sold_at <= $3),0) gross_profit,
      COALESCE((SELECT SUM(amount) FROM expenses
        WHERE business_id=$1 AND expense_date >= $2 AND expense_date <= $3),0) expenses`,
    [businessId, from, to]
  );

  const row = result.rows[0];
  const revenue = Number(row.revenue);
  const cost = Number(row.cost);
  const grossProfit = Number(row.gross_profit);
  const expenses = Number(row.expenses);

  return {
    from, to, revenue, cost, grossProfit, expenses,
    netProfit: grossProfit - expenses
  };
}

module.exports = { dashboard, profitLoss };
