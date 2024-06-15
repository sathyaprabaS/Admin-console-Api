var express = require("express");
var router = express.Router();

const adminController = require("../controllers/adminControllers");

const use = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

//Admin
router.post("/admin", use(adminController.admin));

module.exports = router;