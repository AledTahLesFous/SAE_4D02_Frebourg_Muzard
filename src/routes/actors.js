const express = require('express');
const router = express.Router();
const { Movies, Actors, MoviesActor } = require('../sgbd/models.js');  // Assurez-vous que ces modèles sont correctement importés

// Récupérer les acteurs pour un film
router.get('/api/movies/:id/actors', async (req, res) => {
    try {
        const movieId = req.params.id;
        
        // Validation de l'ID du film (assurez-vous qu'il s'agit d'un format d'ID valide)
        if (!movieId || typeof movieId !== 'string') {
            return res.status(400).json({ message: "ID de film invalide" });
        }

        // Recherche du film avec ses acteurs associés
        const movie = await Movies.findByPk(movieId, {
            include: {
                model: Actors,
                through: {
                    model: MoviesActor,
                    attributes: []  // Pas besoin d'inclure les données de la table de jointure
                }
            }
        });

        // Si le film n'existe pas dans la base de données
        if (!movie) {
            return res.status(404).json({ message: "Film non trouvé" });
        }

        // Renvoyer les acteurs associés à ce film
        res.json(movie.actors);
    } catch (error) {
        // En cas d'erreur serveur
        console.error(error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

module.exports = router;
