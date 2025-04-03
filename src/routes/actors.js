const express = require('express');
const router = express.Router();
const { Movies, Actors, MoviesActor } = require('../sgbd/models.js');  // Assurez-vous que ces modèles sont correctement importés

/**
 * @swagger
 * /api/actors/{id}/movies:
 *   get:
 *     summary: Récupérer les films d'un acteur
 *     description: Récupère tous les films dans lesquels un acteur spécifique a joué
 *     tags: [Acteurs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Identifiant unique de l'acteur
 *     responses:
 *       200:
 *         description: Détails de l'acteur avec la liste de ses films
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Actor'
 *       400:
 *         description: ID d'acteur invalide
 *       404:
 *         description: Acteur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/api/actors/:id/movies', async (req, res) => {
    try {
        const actorId = req.params.id;
        
        // Validation de l'ID de l'acteur
        if (!actorId || typeof actorId !== 'string') {
            return res.status(400).json({ message: "ID d'acteur invalide" });
        }

        // Recherche de l'acteur avec ses films associés
        const actor = await Actors.findByPk(actorId, {
            include: {
                model: Movies,
                through: {
                    model: MoviesActor,
                    attributes: []  // Pas besoin d'inclure les données de la table de jointure
                }
            }
        });

        // Si l'acteur n'existe pas dans la base de données
        if (!actor) {
            return res.status(404).json({ message: "Acteur non trouvé" });
        }

        // Renvoyer l'acteur avec ses films associés
        res.json(actor);
    } catch (error) {
        // En cas d'erreur serveur
        console.error(error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

/**
 * @swagger
 * /api/movies/{id}/actors:
 *   get:
 *     summary: Récupérer les acteurs d'un film
 *     description: Récupère tous les acteurs qui ont joué dans un film spécifique
 *     tags: [Films]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Identifiant unique du film
 *     responses:
 *       200:
 *         description: Liste des acteurs ayant joué dans le film
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Actor'
 *       400:
 *         description: ID de film invalide
 *       404:
 *         description: Film non trouvé
 *       500:
 *         description: Erreur serveur
 */
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
