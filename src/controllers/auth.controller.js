const { registerSchema } = require("../validators/schemas");
const service = require("../services/auth.service");

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await service.register(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const result = await service.login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

module.exports = { register, login };
