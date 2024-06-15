const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require('express-session');

const app = express();

const PORT = process.env.PORT || 3000;
const connectionString = process.env.CONNECTION_STRING || "";
const sessionSecret = process.env.SESSION_SECRET || 'Password';

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000, 
    httpOnly: true, 
  },
}));

const allowedOriginsWithCredentials = [
  "http://localhost:5173",
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOriginsWithCredentials.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Routes imports
const adminRouter = require("./routes/admin");

// Database connection
mongoose
  .connect(connectionString)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Routes
app.use("/admin", adminRouter);

// 404 handler
app.use("*", (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on the server`);
  err.status = "fail";
  err.statusCode = 404;
  next(err);
});

// Error handling middleware
app.use((error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  console.log(error);
  res.status(error.statusCode).json({
    statusCode: error.statusCode,
    status: error.status,
    message: error.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
