// src/routes/wikipedia.js
const express = require('express');
const router = express.Router();
const axios = require('axios'); // Utiliser axios à la place de wikipedia qui peut être instable

// Route pour récupérer les informations Wikipedia
router.get('/api/wikipedia', async (req, res) => {
    try {
        const { title, type } = req.query;
        
        if (!title) {
            return res.status(400).json({ error: "Le paramètre 'title' est requis" });
        }
        
        console.log(`Recherche Wikipedia pour: ${title} (type: ${type})`);
        
        // Préparer le terme de recherche en fonction du type
        let searchTerm = title;
        if (type === 'movie') {
            searchTerm = `${title} film`;
        } else if (type === 'actor') {
            searchTerm = `${title} acteur`;
        }
        
        // Utiliser l'API MediaWiki directement
        const searchUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`;
        const searchResponse = await axios.get(searchUrl);
        
        if (!searchResponse.data.query.search || searchResponse.data.query.search.length === 0) {
            return res.status(404).json({ error: "Aucune information trouvée" });
        }
        
        // Récupérer la première page trouvée
        const pageTitle = searchResponse.data.query.search[0].title;
        const pageUrl = `https://fr.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=true&explaintext=true&titles=${encodeURIComponent(pageTitle)}&format=json&pithumbsize=300&origin=*`;
        
        const pageResponse = await axios.get(pageUrl);
        const pages = pageResponse.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        // Construire la réponse
        const result = {
            title: page.title,
            extract: page.extract,
            url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        };
        
        // Ajouter une image si disponible
        if (page.thumbnail && page.thumbnail.source) {
            result.thumbnail = page.thumbnail.source;
        }
        
        res.json(result);
    } catch (error) {
        console.error("Erreur Wikipedia:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des informations" });
    }
});

module.exports = router;