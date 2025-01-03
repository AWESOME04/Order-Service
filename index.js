const express = require("express");
const app = express();
const print = console.log;
const cors = require("cors");
const shoppingRoutes = require("./api/shopping");
const sequelize = require("./database/connection");
const { CreateChannel } = require("./utils");

require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));

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
