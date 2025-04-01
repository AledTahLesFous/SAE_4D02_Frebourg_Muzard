require("dotenv").config();

const express = require("express");
const path = require("path");  // Nécessaire pour gérer les chemins de fichiers

const myDB = require("./src/sgbd/config.js");
require("./src/sgbd/models.js");


const routerActors = require("./src/routes/actors.js");
const movieRouter = require("./src/routes/movie.js"); // Assuming the file is named `movie.js`
const searchRoutes = require("./src/routes/recherche.js"); // Import des routes de recherche


const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use("/", searchRoutes);
app.use("/", routerActors);
app.use("/", movieRouter); // Use the movie router for routes under "/movies"


const PORT = process.env.PORT || 3000;

myDB
  .sync({ alter: false, logging: false })
  .then(() => {
    console.log("Database synchronized");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to synchronize database:", error);
  });

module.exports = app;
