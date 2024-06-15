/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

const AdminModel = require('../database/models/admin');


/**
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 */

exports.createAdmin = async (req, res, next) => {
    try {
      const { condition, description, title, brand, price, product_type, custom_label_0, Date } = req.body;
  
      if (!condition || !description || !title || !brand || !price || !product_type || !custom_label_0 || !Date) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const admin = new AdminModel({
        condition,
        description,
        title,
        brand,
        price,
        product_type,
        custom_label_0,
        Date
      });
  
      const savedAdmin = await admin.save();
      res.status(201).json(savedAdmin);
    } catch (error) {
      next(error);
    }
  };
  
