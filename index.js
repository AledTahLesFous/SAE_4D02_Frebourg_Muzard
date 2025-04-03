require("dotenv").config();

const express = require("express");
const path = require("path");  // Nécessaire pour gérer les chemins de fichiers
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/swagger/swagger.js');

const myDB = require("./src/sgbd/config.js");
require("./src/sgbd/models.js");


const routerActors = require("./src/routes/actors.js");
const movieRouter = require("./src/routes/movie.js"); // Assuming the file is named `movie.js`
const searchRoutes = require("./src/routes/recherche.js"); // Import des routes de recherche
const wikipediaRoutes = require("./src/routes/wikipedia.js"); // Nouvelle route pour Wikipedia
const randomActorRoutes = require("./src/routes/randomActor.js"); // Route pour acteur aléatoire
const statsRoutes = require("./src/routes/stats.js"); // Route pour les statistiques


const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));




app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use("/", searchRoutes);
app.use("/", routerActors);
app.use("/", movieRouter); // Use the movie router for routes under "/movies"
app.use("/", wikipediaRoutes);
app.use("/", randomActorRoutes); // Utilisation des routes pour acteur aléatoire
app.use("/", statsRoutes); // Utilisation des routes pour les statistiques

// Configuration de Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));

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
