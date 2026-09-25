const service = require("../services/report.service");

async function dashboard(req, res, next) {
  try {
    const data = await service.dashboard(req.user.businessId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

async function profitLoss(req, res, next) {
  try {
    const from = req.query.from ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const to = req.query.to || new Date().toISOString();

    const data = await service.profitLoss(req.user.businessId, from, to);
    res.json({ success: true, data });
  } catch (error) { next(error); }
}

module.exports = { dashboard, profitLoss };
