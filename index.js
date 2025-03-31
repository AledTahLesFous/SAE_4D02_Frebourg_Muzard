require("dotenv").config();

const express = require("express");
const myDB = require("./src/sgbd/config.js");
require("./src/sgbd/models.js");


const app = express();

app.use(express.json());

app.get("/", function (req, res) {
  res.send("Hello World");
});



const PORT = process.env.PORT || 3000;

myDB
  .sync({ alter: false, logging: false })
  .then(() => {
    console.log("Database synchronized");

    app.listen(PORT, () => {
      console.log(`Server run on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to synchronize database:", error);
  });


  module.exports = app;