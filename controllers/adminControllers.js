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
  exports.getFilterByInventoryCount = async (req, res) => {
    try {
      const { product_type, condition, Date: dateParam } = req.query;
  
      // Helper function to format a date to "M/D/YYYY"
      const formatDate = (date) => {
        const month = date.getMonth() + 1; // Months are zero-indexed
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };
  
      // Helper function to get the start and end dates for the given period
      const getDateRange = (period) => {
        const now = new Date();
        let startDate;
        let endDate;
  
        switch (period) {
          case 'this month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'last month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
          case 'last 3 months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'last 6 months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case '1 year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            endDate = now;
            break;
          case '2 years':
            startDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
            endDate = now;
            break;
          default:
            throw new Error('Invalid date parameter');
        }
        return {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
        };
      };
  
      // Build the match query object
      const matchQuery = {};
      if (product_type) matchQuery.product_type = product_type;
      if (dateParam) {
        const { startDate, endDate } = getDateRange(dateParam);
        matchQuery.Date = { $gte: startDate, $lte: endDate };
      }
      if (condition) matchQuery.condition = condition;
  
      // Aggregation pipeline
      const pipeline = [
        {
          $addFields: {
            parsedDate: {
              $dateFromString: {
                dateString: '$Date',
                format: '%m/%d/%Y',
                onError: new Date('2024-01-01'), // default value for invalid date strings
              },
            },
          },
        },
        { $match: matchQuery },
        {
          $group: {
            _id: {
              yearMonth: { $dateToString: { format: '%Y-%m', date: '$parsedDate' } }, // Extract year and month from parsedDate
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
      const filteredResults = results.map((result) => {
        const conditionCounts = result.conditions.reduce((acc, curr) => {
          if (!condition || curr.condition === condition) {
            acc.Count = curr.count;
          }
          return acc;
        }, {});
  
        // Format the yearMonth to the initial date of the month (e.g., "2024-03" to "3/1/2024")
        const [year, month] = result.yearMonth.split('-');
        const formattedMonth = `${parseInt(month, 10)}/1/${year}`;
  
        return {
          Date: formattedMonth,
          ...conditionCounts,
        };
      });
  
      // Filter out empty objects if a condition was specified
      const finalResults = condition
        ? filteredResults.filter((item) => Object.keys(item).length > 1)
        : filteredResults;
  
      res.json(finalResults);
    } catch (error) {
      res.status(500).send(error.message);
    }
  };

  /**
 * @param {Request} req - The Express request object
 * @param {Response} res - The Express response object
 */
  exports.getAllHistory = async (req, res, next) => {
    try {
      const products = await AdminModel.find();
  
      // Process data
      const dataByDate = products.reduce((acc, product) => {
        const date = product.Date;
        if (!acc[date]) {
          acc[date] = { new: [], used: [], cpo: [] };
        }
        if (product.condition === 'new') {
          acc[date].new.push(product);
        } else if (product.condition === 'used') {
          acc[date].used.push(product);
        } else if (product.condition === 'cpo') {
          acc[date].cpo.push(product);
        }
        return acc;
      }, {});
  
      const result = Object.keys(dataByDate).map(date => {
        const newProducts = dataByDate[date].new;
        const usedProducts = dataByDate[date].used;
        const cpoProducts = dataByDate[date].cpo;
  
        const newTotalPrice = newProducts.reduce((sum, product) => sum + parseFloat(product.price), 0);
        const usedTotalPrice = usedProducts.reduce((sum, product) => sum + parseFloat(product.price), 0);
        const cpoTotalPrice = cpoProducts.reduce((sum, product) => sum + parseFloat(product.price), 0);
  
        return {
          date,
          newCount: newProducts.length,
          newTotalPrice: Math.round(newTotalPrice),
          newAveragePrice: Math.round(newTotalPrice / newProducts.length || 0),
          usedCount: usedProducts.length,
          usedTotalPrice: Math.round(usedTotalPrice),
          usedAveragePrice: Math.round(usedTotalPrice / usedProducts.length || 0),
          cpoCount: cpoProducts.length,
          cpoTotalPrice: Math.round(cpoTotalPrice),
          cpoAveragePrice: Math.round(cpoTotalPrice / cpoProducts.length || 0)
        };
      });
  
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
  
    
