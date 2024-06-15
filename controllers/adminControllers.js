/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

const AdminModel = require("../../database/models/admin");

/**
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 */

exports.createDiningOutProduct = async (req, res, next) => {
  try {
    const { menu } = req.body;

    const menuItems = [];
    for (const menuItem of menu) {
      const { menuId, productIds } = menuItem;
      const menuItemData = {
        mainMenuId: menuId,
        productIds: productIds,
      };
      menuItems.push(menuItemData);
    }

    const newDiningOutProduct = await DiningOutModel.create({
      menu: menuItems,
    });
       res.json({
      data: newDiningOutProduct,
      success: true,
      statusCode: 200,
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 */
