const pool = require("../config/database");

async function listProducts(businessId) {
  const result = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.business_id=$1 AND p.active=true
     ORDER BY p.name`,
    [businessId]
  );
  return result.rows;
}

async function createProduct(businessId, data) {
  const result = await pool.query(
    `INSERT INTO products
     (business_id,category_id,name,sku,description,buying_price,
      selling_price,minimum_stock,unit)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      businessId, data.categoryId ?? null, data.name, data.sku ?? null,
      data.description ?? null, data.buyingPrice, data.sellingPrice,
      data.minimumStock ?? 0, data.unit ?? "piece"
    ]
  );
  return result.rows[0];
}

async function getProduct(businessId, id) {
  const result = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.business_id=$1 AND p.id=$2`,
    [businessId, id]
  );
  return result.rows[0] || null;
}

module.exports = { listProducts, createProduct, getProduct };
