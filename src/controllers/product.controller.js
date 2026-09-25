const { productSchema } = require("../validators/schemas");
const service = require("../services/product.service");

async function list(req, res, next) {
  try {
    res.json({
      success: true,
      data: await service.listProducts(req.user.businessId)
    });
  } catch (error) { next(error); }
}

async function create(req, res, next) {
  try {
    const data = productSchema.parse(req.body);
    const product = await service.createProduct(req.user.businessId, data);
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
}

async function getOne(req, res, next) {
  try {
    const product = await service.getProduct(req.user.businessId, req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
}

module.exports = { list, create, getOne };
