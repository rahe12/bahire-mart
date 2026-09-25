const pool = require("../config/database");

async function createSale(businessId, data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const saleResult = await client.query(
      `INSERT INTO sales(business_id,invoice_number,customer_name)
       VALUES($1,$2,$3) RETURNING *`,
      [businessId, data.invoiceNumber || null, data.customerName || null]
    );

    const sale = saleResult.rows[0];
    let total = 0;
    let cost = 0;

    for (const item of data.items) {
      const productResult = await client.query(
        `SELECT * FROM products
         WHERE id=$1 AND business_id=$2 AND active=true
         FOR UPDATE`,
        [item.productId, businessId]
      );

      if (!productResult.rowCount) {
        const error = new Error(`Product ${item.productId} not found`);
        error.status = 404;
        throw error;
      }

      const product = productResult.rows[0];

      if (Number(product.quantity) < Number(item.quantity)) {
        const error = new Error(
          `Insufficient stock for ${product.name}. Available: ${product.quantity}`
        );
        error.status = 400;
        throw error;
      }

      const sellingPrice = item.sellingPrice ?? Number(product.selling_price);
      const buyingPrice = Number(product.buying_price);

      await client.query(
        `INSERT INTO sale_items
         (sale_id,product_id,quantity,selling_price,buying_price)
         VALUES($1,$2,$3,$4,$5)`,
        [sale.id, item.productId, item.quantity, sellingPrice, buyingPrice]
      );

      await client.query(
        `UPDATE products
         SET quantity=quantity-$1,updated_at=NOW()
         WHERE id=$2 AND business_id=$3`,
        [item.quantity, item.productId, businessId]
      );

      await client.query(
        `INSERT INTO stock_movements
         (business_id,product_id,movement_type,quantity,reference_type,reference_id)
         VALUES($1,$2,'SALE',$3,'SALE',$4)`,
        [businessId, item.productId, item.quantity, sale.id]
      );

      total += Number(item.quantity) * Number(sellingPrice);
      cost += Number(item.quantity) * buyingPrice;
    }

    const updated = await client.query(
      `UPDATE sales
       SET total_amount=$1,total_cost=$2,gross_profit=$3
       WHERE id=$4 RETURNING *`,
      [total, cost, total - cost, sale.id]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function listSales(businessId, from, to) {
  const values = [businessId];
  let where = "business_id=$1";

  if (from) {
    values.push(from);
    where += ` AND sold_at >= $${values.length}`;
  }

  if (to) {
    values.push(to);
    where += ` AND sold_at <= $${values.length}`;
  }

  const result = await pool.query(
    `SELECT * FROM sales WHERE ${where} ORDER BY sold_at DESC`,
    values
  );

  return result.rows;
}

module.exports = { createSale, listSales };
