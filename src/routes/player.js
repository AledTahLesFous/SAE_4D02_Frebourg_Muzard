const express = require("express");
const router = express.Router();
const { Actors, Movies } = require("../sgbd/models.js");

// Récupérer tous les joueurs
router.get("/", async (req, res) => {
    try {
        const actors = await Actors.findAll(); // Renamed to avoid conflict with model name
        const movies = await Movies.findAll();
        if (actors.length === 0) {
            return res.status(404).json({ message: "No actors found" }); // Handle empty result
        }
        res.json(actors); // Send the actors back as response
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});


router.get("/:id", async (req, res) => {
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
