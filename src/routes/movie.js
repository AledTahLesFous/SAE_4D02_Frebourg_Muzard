const express = require("express");
const router = express.Router();
const { Movies, Actors } = require("../sgbd/models.js");

// Route pour récupérer un film avec ses acteurs
router.get("/:id", async (req, res) => {
  try {
    const movieId = req.params.id;

    // Requête pour récupérer le film avec les acteurs associés
    const movie = await Movies.findOne({
      where: { id: movieId },
      include: [
        {
          model: Actors,  // Inclure les acteurs associés au film
          attributes: ["id", "name"],
        },
      ],
    });

    if (!movie) {
      return res.status(404).json({ message: "Film non trouvé" });
    }

    // Retourner le film avec les acteurs associés
    res.json(movie);
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
});


module.exports = router;
