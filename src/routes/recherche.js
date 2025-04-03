const express = require('express');
const router = express.Router();
const { Movies, Actors } = require('../sgbd/models.js');
const { Op } = require('sequelize');

/**
 * @swagger
 * /api/search/actors:
 *   get:
 *     summary: Recherche des acteurs par nom
 *     description: Recherche des acteurs dont le nom contient la chaîne de caractères spécifiée
 *     tags: [Recherche]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Terme de recherche pour les noms d'acteurs
 *     responses:
 *       200:
 *         description: Liste des acteurs correspondant à la recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Actor'
 *       400:
 *         description: Paramètre de recherche manquant
 *       500:
 *         description: Erreur serveur
 */
router.get('/api/search/actors', async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) {
            return res.status(400).json({ message: "Le paramètre de recherche est requis" });
        }

        const actors = await Actors.findAll({
            where: {
                name: {
                    [Op.like]: `%${query}%`
                }
            },
            limit: 10
        });

        res.json(actors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

/**
 * @swagger
 * /api/search/movies:
 *   get:
 *     summary: Recherche des films par titre
 *     description: Recherche des films dont le titre contient la chaîne de caractères spécifiée
 *     tags: [Recherche]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Terme de recherche pour les titres de films
 *     responses:
 *       200:
 *         description: Liste des films correspondant à la recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 *       400:
 *         description: Paramètre de recherche manquant
 *       500:
 *         description: Erreur serveur
 */
router.get('/api/search/movies', async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) {
            return res.status(400).json({ message: "Le paramètre de recherche est requis" });
        }

        const movies = await Movies.findAll({
            where: {
                title: {
                    [Op.like]: `%${query}%`
                }
            },
            limit: 10
        });

        res.json(movies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

module.exports = router;