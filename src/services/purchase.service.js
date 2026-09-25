const pool = require("../config/database");

async function createPurchase(businessId, data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const purchaseResult = await client.query(
      `INSERT INTO purchases(business_id,supplier_name,reference)
       VALUES($1,$2,$3) RETURNING *`,
      [businessId, data.supplierName || null, data.reference || null]
    );

    const purchase = purchaseResult.rows[0];
    let total = 0;

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
      const price = item.buyingPrice ?? Number(product.buying_price);

      await client.query(
        `INSERT INTO purchase_items
         (purchase_id,product_id,quantity,buying_price)
         VALUES($1,$2,$3,$4)`,
        [purchase.id, item.productId, item.quantity, price]
      );

      await client.query(
        `UPDATE products
         SET quantity=quantity+$1,buying_price=$2,updated_at=NOW()
         WHERE id=$3 AND business_id=$4`,
        [item.quantity, price, item.productId, businessId]
      );

      await client.query(
        `INSERT INTO stock_movements
         (business_id,product_id,movement_type,quantity,reference_type,reference_id)
         VALUES($1,$2,'PURCHASE',$3,'PURCHASE',$4)`,
        [businessId, item.productId, item.quantity, purchase.id]
      );

      total += Number(item.quantity) * Number(price);
    }

    const updated = await client.query(
      `UPDATE purchases SET total_amount=$1 WHERE id=$2 RETURNING *`,
      [total, purchase.id]
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

module.exports = { createPurchase };
