const service = require("../services/sale.service");

async function create(req, res, next) {
  try {
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one sale item is required"
      });
    }

    const sale = await service.createSale(req.user.businessId, req.body);
    res.status(201).json({ success: true, data: sale });
  } catch (error) { next(error); }
}

async function list(req, res, next) {
  try {
    const sales = await service.listSales(
      req.user.businessId,
      req.query.from,
      req.query.to
    );
    res.json({ success: true, data: sales });
  } catch (error) { next(error); }
}

module.exports = { create, list };
