var express = require("express");
var router = express.Router();
const multer = require('multer'); // Add this line to import multer
const upload = multer({ dest: 'uploads/' });


const adminController = require("../controllers/adminControllers");

const use = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

//Admin
router.post('/createAdmin', upload.single('csvfile'), use(adminController.createAdmin));
router.get("/getAllAdmin", use(adminController.getAllAdmin));
router.get("/getFilterByInventoryCount", use(adminController.getFilterByInventoryCount));
router.get("/getAllHistory", use(adminController.getAllHistory));



module.exports = router;
