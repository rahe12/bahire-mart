const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/report.controller");

router.use(auth);
router.get("/dashboard", controller.dashboard);
router.get("/profit-loss", controller.profitLoss);

module.exports = router;
