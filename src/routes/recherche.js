const express = require('express');
const router = express.Router();
const { Movies, Actors } = require('../sgbd/models.js');
const { Op } = require('sequelize');

// Route pour rechercher des acteurs
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

// Route pour rechercher des films
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