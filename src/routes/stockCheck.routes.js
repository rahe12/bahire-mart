const router = require("express").Router();

const auth = require("../middlewares/auth");

const controller =
  require("../controllers/stockCheck.controller");


router.use(auth);


/*
 * Check the physical remaining stock.
 *
 * POST /api/v1/stock-checks
 */
router.post("/", controller.create);


/*
 * View previous stock checks.
 *
 * GET /api/v1/stock-checks
 */
router.get("/", controller.list);


module.exports = router;
