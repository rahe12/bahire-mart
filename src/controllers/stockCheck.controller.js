const service = require("../services/stockCheck.service");


async function create(req, res, next) {
  try {
    if (
      !Array.isArray(req.body.items) ||
      req.body.items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required"
      });
    }

    for (const item of req.body.items) {
      if (
        item.productId === undefined ||
        item.remainingQuantity === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each item requires productId and remainingQuantity"
        });
      }
    }

    const result =
      await service.createStockCheck(
        req.user.businessId,
        req.body
      );

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}


async function list(req, res, next) {
  try {
    const results =
      await service.listStockChecks(
        req.user.businessId,
        req.query.from,
        req.query.to
      );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
}


module.exports = {
  create,
  list
};
