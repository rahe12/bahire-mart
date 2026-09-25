const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/sale.controller");

router.use(auth);
router.post("/", controller.create);
router.get("/", controller.list);

module.exports = router;
