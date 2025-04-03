const express = require('express');
const router = express.Router();
const { Actors } = require('../sgbd/models.js');
const { QueryTypes } = require('sequelize');
const myDB = require('../sgbd/config.js');

/**
 * @swagger
 * /api/actors/random:
 *   get:
 *     summary: Récupérer un acteur aléatoire
 *     description: Renvoie un acteur sélectionné aléatoirement dans la base de données
 *     tags: [Acteurs]
 *     responses:
 *       200:
 *         description: Un acteur aléatoire
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Actor'
 *       404:
 *         description: Aucun acteur trouvé dans la base de données
 *       500:
 *         description: Erreur serveur
 */
router.get('/api/actors/random', async (req, res) => {
    try {
        // Utilisation de la fonction RAND() de SQL pour sélectionner un acteur aléatoire
        const randomActor = await myDB.query(
            'SELECT * FROM actors ORDER BY RAND() LIMIT 1',
            { type: QueryTypes.SELECT }
        );

        if (randomActor && randomActor.length > 0) {
            res.json(randomActor[0]);
            console.log("Acteur aléatoire récupéré:", randomActor[0]);
        } else {
            res.status(404).json({ message: "Aucun acteur trouvé dans la base de données" });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération d'un acteur aléatoire:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

module.exports = router;