const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/product.controller");

router.use(auth);
router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.getOne);

module.exports = router;
