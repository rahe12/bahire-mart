const { expenseSchema } = require("../validators/schemas");
const service = require("../services/expense.service");

async function create(req, res, next) {
  try {
    const data = expenseSchema.parse(req.body);
    const expense = await service.createExpense(req.user.businessId, data);
    res.status(201).json({ success: true, data: expense });
  } catch (error) { next(error); }
}

async function list(req, res, next) {
  try {
    const expenses = await service.listExpenses(
      req.user.businessId,
      req.query.from,
      req.query.to
    );
    res.json({ success: true, data: expenses });
  } catch (error) { next(error); }
}

module.exports = { create, list };
