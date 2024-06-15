/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */
const csv = require('csv-parser');
const fs = require('fs');


const AdminModel = require('../database/models/admin');




/**
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 */

exports.createAdmin = async (req, res, next) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Process each row from CSV
        for (const row of results) {
          const { condition, description, title, brand, price, product_type, custom_label_0, Date } = row;

          // Create new AdminModel instance
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

          // Save admin to database
          await admin.save();
        }

        // Delete uploaded file after processing
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error(err);
          }
        });

        // Respond with success message
        res.status(201).json({ message: 'Admins created successfully', data: results });
      });
  } catch (error) {
    next(error);
  }
};

  
/**
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 */


  exports.getAllAdmin = async (req, res, next) => {
    try {
      const product = await AdminModel.find();
  console.log("product",product)
      res.json(product);
    } catch (error) {
      next(error);
    }
  };

  /**
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 */
  exports.getFilterBYInventoryCount = async (req, res) => {
    try {
      const { product_type, condition, Date } = req.query;
  
      // Build the match query object
      const matchQuery = {};
      if (product_type) matchQuery.product_type = product_type;
      if (Date) {
        // Assuming Date is in "MM/DD/YYYY" format
        const [month, day, year] = Date.split('/');
        matchQuery.Date = `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
      }
      if (condition) matchQuery.condition = condition;
  
      // Aggregation pipeline
      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: {
              yearMonth: { $dateToString: { format: '%Y-%m', date: { $dateFromString: { dateString: '$Date' } } } }, // Extract year and month from Date
              condition: '$condition',
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.yearMonth',
            conditions: {
              $push: {
                condition: '$_id.condition',
                count: '$count',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            yearMonth: '$_id',
            conditions: 1,
          },
        },
        {
          $sort: { yearMonth: 1 },
        },
      ];
  
      const results = await AdminModel.aggregate(pipeline);
  
      // Transform results into desired format
      const filteredResults = results.map(result => {
        const conditionCounts = result.conditions.reduce((acc, curr) => {
          if (!condition || curr.condition === condition) {
            acc.Count = curr.count;
          }
          return acc;
        }, {});
  
        // Format the yearMonth to the initial date of the month (e.g., "2024-03" to "03/01/2024")
        const [year, month] = result.yearMonth.split('-');
        const formattedMonth = `${month}/01/${year}`;
  
        return {
          Date: formattedMonth,
          ...conditionCounts,
        };
      });
  
      // Filter out empty objects if a condition was specified
      const finalResults = condition
        ? filteredResults.filter(item => Object.keys(item).length > 1)
        : filteredResults;
  
      res.json(finalResults);
    } catch (error) {
      res.status(500).send(error.message);
    }
  };


    
