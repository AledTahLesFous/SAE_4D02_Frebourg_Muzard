const express = require("express");
const router = express.Router();
const { Movies, Actors, MoviesActor } = require("../sgbd/models.js"); // Assuming MoviesActor is the join table

// Route pour récupérer les films d'un acteur
router.get("/api/actors/:id/movies", async (req, res) => {
    try {
        const actorId = req.params.id;

        // Requête pour récupérer un acteur avec les films associés
        const actor = await Actors.findOne({
            where: { id: actorId },
            include: [
                {
                    model: Movies,  // Inclure les films associés à cet acteur
                    attributes: ["id", "title", "year"], // Sélectionner les attributs des films
                },
            ],
        });

        if (!actor) {
            return res.status(404).json({ message: "Acteur non trouvé" });
        }

        // Retourner l'acteur avec ses films associés
        res.json(actor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

module.exports = router;
