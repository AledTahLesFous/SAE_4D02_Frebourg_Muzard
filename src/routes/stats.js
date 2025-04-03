const express = require('express');
const router = express.Router();
const { Movies, Actors, MoviesActor, Genres, MoviesGenre } = require('../sgbd/models.js');
const Sequelize = require('sequelize');

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

// Route pour récupérer les statistiques détaillées
router.get('/api/stats/detailed', async (req, res) => {
    try {
        // Nombre total de films
        const totalMovies = await Movies.count();
        
        // Nombre moyen d'acteurs par film
        const avgActorsPerMovie = await MoviesActor.findAll({
            attributes: [
                'id_movie',
                [Sequelize.fn('COUNT', Sequelize.col('id_actor')), 'actorCount']
            ],
            group: ['id_movie']
        });
        
        let totalActorsInMovies = 0;
        avgActorsPerMovie.forEach(movie => {
            totalActorsInMovies += parseInt(movie.dataValues.actorCount);
        });
        
        const averageActorsPerMovie = totalActorsInMovies / totalMovies;
        
        // Nombre de films par année
        const moviesByYear = await Movies.findAll({
            attributes: [
                'year',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['year'],
            order: [['year', 'ASC']]
        });
        
        // Formater les données pour les films par année
        const moviesByYearFormatted = moviesByYear.map(item => ({
            year: item.year,
            count: parseInt(item.dataValues.count)
        }));
        
        // Nombre total de genres
        const totalGenres = await Genres.count();
        
        // Nombre de films par genre
        const moviesByGenre = await MoviesGenre.findAll({
            attributes: [
                'id_genre',
                [Sequelize.fn('COUNT', Sequelize.col('id_movie')), 'count']
            ],
            include: [{
                model: Genres,
                attributes: ['genre']
            }],
            group: ['id_genre', 'genre.id'],
            order: [[Sequelize.col('count'), 'DESC']]
        });
        
        // Formater les données pour les films par genre
        const moviesByGenreFormatted = await Promise.all(moviesByGenre.map(async item => {
            const genre = await Genres.findByPk(item.id_genre);
            return {
                genre: genre ? genre.genre : 'Inconnu',
                count: parseInt(item.dataValues.count)
            };
        }));
        
        // Renvoyer les statistiques détaillées
        res.json({
            totalMovies,
            averageActorsPerMovie: parseFloat(averageActorsPerMovie.toFixed(2)),
            moviesByYear: moviesByYearFormatted,
            totalGenres,
            moviesByGenre: moviesByGenreFormatted
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques détaillées:', error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

module.exports = router;