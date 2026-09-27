const pool = require("../config/database");

async function createStockCheck(businessId, data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!Array.isArray(data.items) || data.items.length === 0) {
      const error = new Error("At least one product is required");
      error.status = 400;
      throw error;
    }

    /*
     * Create the stock-check first.
     * We will update its totals after calculating every product.
     */
    const checkResult = await client.query(
      `INSERT INTO stock_checks(business_id, checked_at)
       VALUES($1, COALESCE($2, NOW()))
       RETURNING *`,
      [
        businessId,
        data.checkedAt || null
      ]
    );

    const stockCheck = checkResult.rows[0];

    let totalSold = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    const soldItems = [];

    for (const item of data.items) {
      const productResult = await client.query(
        `SELECT *
         FROM products
         WHERE id=$1
           AND business_id=$2
           AND active=true
         FOR UPDATE`,
        [
          item.productId,
          businessId
        ]
      );

      if (!productResult.rowCount) {
        const error = new Error(
          `Product ${item.productId} not found`
        );

        error.status = 404;
        throw error;
      }

      const product = productResult.rows[0];

      const availableQuantity = Number(product.quantity);

      const remainingQuantity = Number(
        item.remainingQuantity
      );

      if (!Number.isFinite(remainingQuantity)) {
        const error = new Error(
          `Invalid remaining quantity for ${product.name}`
        );

        error.status = 400;
        throw error;
      }

      if (remainingQuantity < 0) {
        const error = new Error(
          `Remaining quantity cannot be negative for ${product.name}`
        );

        error.status = 400;
        throw error;
      }

      if (remainingQuantity > availableQuantity) {
        const error = new Error(
          `${product.name}: remaining quantity (${remainingQuantity}) cannot be greater than available stock (${availableQuantity})`
        );

        error.status = 400;
        throw error;
      }

      const soldQuantity =
        availableQuantity - remainingQuantity;

      const buyingPrice =
        Number(product.buying_price);

      const sellingPrice =
        Number(product.selling_price);

      const revenue =
        soldQuantity * sellingPrice;

      const cost =
        soldQuantity * buyingPrice;

      const profit =
        revenue - cost;

      /*
       * Save the stock-check result.
       */
      await client.query(
        `INSERT INTO stock_check_items
         (
           stock_check_id,
           product_id,
           available_quantity,
           remaining_quantity,
           sold_quantity,
           buying_price,
           selling_price,
           revenue,
           cost,
           profit
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          stockCheck.id,
          product.id,
          availableQuantity,
          remainingQuantity,
          soldQuantity,
          buyingPrice,
          sellingPrice,
          revenue,
          cost,
          profit
        ]
      );

      /*
       * The physical stock count becomes
       * the new quantity in the product table.
       */
      await client.query(
        `UPDATE products
         SET quantity=$1,
             updated_at=NOW()
         WHERE id=$2
           AND business_id=$3`,
        [
          remainingQuantity,
          product.id,
          businessId
        ]
      );

      /*
       * Only products that actually sold
       * become automatic sales.
       */
      if (soldQuantity > 0) {
        soldItems.push({
          productId: product.id,
          quantity: soldQuantity,
          sellingPrice,
          buyingPrice
        });

        await client.query(
          `INSERT INTO stock_movements
           (
             business_id,
             product_id,
             movement_type,
             quantity,
             reference_type,
             reference_id,
             note
           )
           VALUES
           (
             $1,
             $2,
             'SALE',
             $3,
             'STOCK_CHECK',
             $4,
             'Automatic sale calculated from stock check'
           )`,
          [
            businessId,
            product.id,
            soldQuantity,
            stockCheck.id
          ]
        );
      }

      totalSold += soldQuantity;
      totalRevenue += revenue;
      totalCost += cost;
      totalProfit += profit;
    }

    /*
     * If products were sold, create ONE automatic sale
     * containing all products checked in this operation.
     */
    let sale = null;

    if (soldItems.length > 0) {
      const saleResult = await client.query(
        `INSERT INTO sales
         (
           business_id,
           invoice_number,
           customer_name,
           total_amount,
           total_cost,
           gross_profit,
           sold_at
         )
         VALUES
         (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           COALESCE($7, NOW())
         )
         RETURNING *`,
        [
          businessId,
          `STOCK-CHECK-${stockCheck.id}`,
          "Automatic stock reconciliation",
          totalRevenue,
          totalCost,
          totalProfit,
          data.checkedAt || null
        ]
      );

      sale = saleResult.rows[0];

      for (const item of soldItems) {
        await client.query(
          `INSERT INTO sale_items
           (
             sale_id,
             product_id,
             quantity,
             selling_price,
             buying_price
           )
           VALUES($1,$2,$3,$4,$5)`,
          [
            sale.id,
            item.productId,
            item.quantity,
            item.sellingPrice,
            item.buyingPrice
          ]
        );
      }
    }

    /*
     * Save totals on the stock check.
     */
    const updatedCheck = await client.query(
      `UPDATE stock_checks
       SET
         sale_id=$1,
         total_sold=$2,
         total_revenue=$3,
         total_cost=$4,
         total_profit=$5
       WHERE id=$6
       RETURNING *`,
      [
        sale ? sale.id : null,
        totalSold,
        totalRevenue,
        totalCost,
        totalProfit,
        stockCheck.id
      ]
    );

    await client.query("COMMIT");

    return {
      stockCheck: updatedCheck.rows[0],
      sale,
      summary: {
        totalSold,
        totalRevenue,
        totalCost,
        totalProfit
      }
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}


async function listStockChecks(businessId, from, to) {
  const values = [businessId];

  let where = "business_id=$1";

  if (from) {
    values.push(from);
    where += ` AND checked_at >= $${values.length}`;
  }

  if (to) {
    values.push(to);
    where += ` AND checked_at <= $${values.length}`;
  }

  const result = await pool.query(
    `SELECT *
     FROM stock_checks
     WHERE ${where}
     ORDER BY checked_at DESC`,
    values
  );

  return result.rows;
}


module.exports = {
  createStockCheck,
  listStockChecks
};
