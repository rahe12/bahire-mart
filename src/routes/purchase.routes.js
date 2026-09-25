const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/purchase.controller");

router.use(auth);
router.post("/", controller.create);

module.exports = router;
