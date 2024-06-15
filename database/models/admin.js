const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  condition: String,
  description: String,
  title: String,
  brand: String,
  price:String ,
  product_type: String,
  custom_label_0: String,
  Date: String
});

const AdminModel = mongoose.model("admin", adminSchema);

module.exports = AdminModel;

