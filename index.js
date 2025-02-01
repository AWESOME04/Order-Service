const express = require("express");
const app = express();
const print = console.log;
const cors = require("cors");
const shoppingRoutes = require("./api/shopping");
const sequelize = require("./database/connection");
const { CreateChannel } = require("./utils");

require("dotenv").config();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://multi-vendor-system.vercel.app',
    'http://localhost:3000',
    'capacitor://localhost',
    'http://localhost',
    'http://localhost:64256'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Move CORS before other middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

async function startApp() {
  try {
    // Test database connection
    await sequelize.authenticate();
    print("Database Connection Established Successfully");

    // Sync models with database
    await sequelize.sync({ force: false });
    print("Database Models Synchronized");

    const channel = await CreateChannel();
    
    shoppingRoutes(app, channel);

    app.listen(8003, () => {
      console.log("Shopping Service is Listening to Port 8003");
    });
  } catch (err) {
    console.log("Failed to start app:", err);
  }
}

startApp();
