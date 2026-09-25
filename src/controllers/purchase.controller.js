const service = require("../services/purchase.service");

async function create(req, res, next) {
  try {
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one purchase item is required"
      });
    }

    const purchase = await service.createPurchase(req.user.businessId, req.body);
    res.status(201).json({ success: true, data: purchase });
  } catch (error) { next(error); }
}

module.exports = { create };
