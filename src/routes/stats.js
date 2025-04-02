const express = require('express');
const router = express.Router();
const { Movies, Actors } = require('../sgbd/models.js');

// Route pour récupérer les statistiques (nombre total d'acteurs et de films)
router.get('/api/stats', async (req, res) => {
    try {
        // Compter le nombre total d'acteurs dans la base de données
        const actorsCount = await Actors.count();
        
        // Compter le nombre total de films dans la base de données
        const moviesCount = await Movies.count();
        
        // Renvoyer les statistiques
        res.json({
            actors: actorsCount,
            movies: moviesCount
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

module.exports = router;