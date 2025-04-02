// Création du SVG
const width = 800, height = 600;
const svg = d3.select("#graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

let foundMoviesSet = new Set(); // Stocke les films déjà trouvés
let foundActorsSet = new Set(); // Stocke les acteurs déjà trouvés

// Ajout d'un groupe pour contenir les éléments du graphique
const g = svg.append("g");

// Appliquer le zoom sur le SVG
const zoom = d3.zoom()
    .scaleExtent([0.5, 5]) // Limites du zoom (min: 0.5x, max: 5x)
    .on("zoom", (event) => {
        g.attr("transform", event.transform); // Appliquer la transformation au groupe
    });

svg.call(zoom); // Activer le zoom sur le SVG

// Appliquer le drag sur les nœuds
const drag = d3.drag()
    .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart(); // Réactiver la simulation
        d.fx = d.x; // Fixer la position x
        d.fy = d.y; // Fixer la position y
    })
    .on("drag", (event, d) => {
        d.fx = event.x; // Mettre à jour la position x
        d.fy = event.y; // Mettre à jour la position y
    })
    .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0); // Arrêter la simulation
        d.fx = null; // Libérer la position x
        d.fy = null; // Libérer la position y
    });

// Position initiale du premier point
const center = { x: width / 2, y: height / 2 };

// Noeuds affichés
let nodes = [];
let links = [];

// Simulation de force pour D3.js
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(center.x, center.y))
    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
    .on("tick", ticked);

// Fonction pour récupérer les données
async function fetchData(endpoint) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des données depuis ${endpoint}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

// Fonction d'initialisation du graph avec un seul acteur
async function initializeGraph() {
    const actorData = await fetchData("http://localhost:3000/api/actors/actor_1/movies");

    if (actorData) {
        // Ajouter uniquement l'acteur initial au graphe
        let initialNode = { id: actorData.id, label: actorData.name, x: center.x, y: center.y, type: 'actor' };
        nodes.push(initialNode);
        updateGraph(); // Afficher seulement l'acteur au départ
    }
}

function addNodesAndLinks(sourceNode, newNodes) {
    newNodes.forEach(node => {
        let existingNode = nodes.find(n => n.id === node.id);

        if (!existingNode) {
            // Si le nœud n'existe pas encore, on l'ajoute
            node.x = sourceNode.x + (Math.random() - 0.5) * 200;
            node.y = sourceNode.y + (Math.random() - 0.5) * 200;
            nodes.push(node);
            links.push({ source: sourceNode, target: node });
        } else {
            // Si le nœud existe déjà et qu'il s'agit d'un film, on vérifie ses acteurs
            if (existingNode.type === 'movie') {
                let relatedActors = nodes.filter(n => links.some(l => 
                    (l.source.id === existingNode.id && l.target.id === n.id) ||
                    (l.target.id === existingNode.id && l.source.id === n.id)
                ));

                relatedActors.forEach(actor => {
                    if (actor.id !== sourceNode.id) {
                        // Si l'acteur trouvé n'est pas déjà connecté à la source, on crée un lien
                        links.push({ source: sourceNode, target: existingNode });
                    }
                });
            }
        }

        if (node.type === 'movie') {
            node.hidden = true; // Marquer le film comme caché
        }
    });
}

// Fonction pour mettre à jour le graphique
function updateGraph() {
    const link = g.selectAll("line").data(links);
    link.enter().append("line").merge(link).attr("stroke", "#aaa");
    link.exit().remove();

    const node = g.selectAll("circle").data(nodes, d => d.id);
    const nodeEnter = node.enter().append("circle")
        .attr("r", 10)
        .attr("fill", d => d.type === 'actor' ? "magenta" : d.type === 'movie' ? "pink" : "gray")
        .on("click", handleClick)
        .call(drag); // Appliquer le drag aux nœuds

    node.exit().remove();

    nodeEnter.merge(node)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    // Ajouter les labels (textes)
    const text = g.selectAll("text").data(nodes, d => d.id);
    const textEnter = text.enter().append("text")
        .attr("dx", 12)
        .attr("dy", 4)
        .text("?") // Les films affichent "?"
        .merge(text)
        .attr("x", d => d.x)
        .attr("y", d => d.y);
        
    text.exit().remove();

    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();
}

function updateText(nodeId, newLabel) {
    g.selectAll("text")
        .filter(d => d.id === nodeId) // Sélectionne uniquement le texte du bon nœud
        .text(newLabel); // Met à jour avec le bon nom
}

// Modification de la fonction handleClick pour les acteurs et les films
async function handleClick(event, d) {
    console.log("Clicked node:", d);

    if (d.type === 'actor') {
        console.log(`Fetching movies for actor: ${d.id}`);
        const actorData = await fetchData(`/api/actors/${d.id}/movies`);
        console.log("Actor data:", actorData);

        Swal.fire({
            title: "Entrez le nom de l'acteur/actrice",
            input: 'text',
            inputPlaceholder: 'Nom',
            showCancelButton: true,
            confirmButtonText: 'Valider',
            cancelButtonText: 'Annuler',
            inputValidator: (value) => value ? null : 'Veuillez entrer un nom !'
        }).then((result) => {
            if (result.isConfirmed) {
                const actorName = result.value;
                if (actorName == d.label || actorName == 'a') {
                    console.log("PASS");
                    updateText(d.id, d.label);
                    
                    // Ajouter l'acteur à la liste des acteurs trouvés
                    addActorToList(d.id, d.label);
                    
                    if (actorData && actorData.movies) {
                        const newNodes = actorData.movies.map(movie => ({
                            id: movie.id,
                            label: movie.title,
                            type: 'movie'
                        }));
                        addNodesAndLinks(d, newNodes);
                        updateGraph();
                    }
                } else {
                    Swal.fire(`ALed`);
                }
            }
        });
    } else if (d.type === 'movie') {
        console.log(`Fetching actors for movie: ${d.id}`);
        const movieData = await fetchData(`/api/movies/${d.id}/actors`);
        console.log("Movie data:", movieData);

        Swal.fire({
            title: "Entrez le nom du film",
            input: 'text',
            inputPlaceholder: 'Nom du film',
            showCancelButton: true,
            confirmButtonText: 'Valider',
            cancelButtonText: 'Annuler',
            inputValidator: (value) => value ? null : 'Veuillez entrer un nom !'
        }).then((result) => {
            if (result.isConfirmed) {
                const movieName = result.value;
                if (movieName == d.label || movieName == "a") {
                    updateText(d.id, d.label);
                    
                    // Maintenant qu'on a trouvé le film, on l'ajoute à la liste
                    addMovieToList(d.id, d.label);
                    
                    if (movieData) {
                        const newNodes = movieData.map(actor => ({
                            id: actor.id,
                            label: actor.name,
                            type: 'actor'
                        }));
                        addNodesAndLinks(d, newNodes);
                        updateGraph();
                    }
                } else {
                    Swal.fire(`ALed`);
                }
            }
        });
    }
}

// Fonction de mise à jour des positions des nœuds à chaque tick de la simulation
function ticked() {
    g.selectAll("line")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    g.selectAll("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    g.selectAll("text")   
        .attr("x", d => d.x)
        .attr("y", d => d.y);
}

// Fonction pour ajouter des films à la liste
function addMovieToList(id, title) {
    if (!foundMoviesSet.has(title)) {
        foundMoviesSet.add(title); // Ajouter à l'ensemble des films trouvés

        const moviesList = document.getElementById('found-movies');
        const listItem = document.createElement('li');
        listItem.setAttribute('data-id', id);
        listItem.textContent = title;

        listItem.addEventListener('click', () => {
            const movieNode = nodes.find(n => n.id === id);
            if (movieNode) {
                highlightNode(movieNode);
            }
        });

        moviesList.appendChild(listItem);
    }
}

// Nouvelle fonction pour ajouter des acteurs à la liste
function addActorToList(id, name) {
    if (!foundActorsSet.has(name)) {
        foundActorsSet.add(name); // Ajouter à l'ensemble des acteurs trouvés

        const actorsList = document.getElementById('found-actors');
        const listItem = document.createElement('li');
        listItem.setAttribute('data-id', id);
        listItem.textContent = name;

        listItem.addEventListener('click', () => {
            const actorNode = nodes.find(n => n.id === id);
            if (actorNode) {
                highlightNode(actorNode);
            }
        });

        actorsList.appendChild(listItem);
    }
}

function highlightNode(node) {
    // Réinitialisation des styles
    g.selectAll("circle")
        .attr("r", 10)
        .attr("stroke", "none")
        .attr("stroke-width", 0);
    
    // Mettre en évidence le nœud sélectionné
    g.selectAll("circle")
        .filter(d => d.id === node.id)
        .attr("r", 15)
        .attr("stroke", "#FFD700")
        .attr("stroke-width", 3);

    // Recentrer la vue sur le nœud sélectionné
    const transform = d3.zoomTransform(svg.node());
    const newX = width / 2 - node.x * transform.k;
    const newY = height / 2 - node.y * transform.k;

    svg.transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity.translate(newX, newY).scale(transform.k));
}

// Fonction pour rediriger vers un film
async function redirectToMovie(id, title) {
    try {
        // Ajouter le film au graphe s'il n'y est pas déjà
        let movieNode = nodes.find(n => n.id === id);
        
        if (!movieNode) {
            movieNode = { id: id, label: title, type: 'movie', x: center.x, y: center.y };
            nodes.push(movieNode);
        }
        
        // Récupérer les acteurs du film
        const movieData = await fetchData(`/api/movies/${id}/actors`);
        if (movieData) {
            const newNodes = movieData.map(actor => ({ id: actor.id, label: actor.name, type: 'actor' }));
            addNodesAndLinks(movieNode, newNodes);
            updateGraph();
        }
        
        // Mettre en évidence le film
        highlightNode(movieNode);
    } catch (error) {
        console.error("Erreur lors de la redirection vers le film:", error);
    }
}

// Nouvelle fonction pour rediriger vers un acteur
async function redirectToActor(id, name) {
    try {
        // Ajouter l'acteur au graphe s'il n'y est pas déjà
        let actorNode = nodes.find(n => n.id === id);
        
        if (!actorNode) {
            actorNode = { id: id, label: name, type: 'actor', x: center.x, y: center.y };
            nodes.push(actorNode);
        }
        
        // Récupérer les films de l'acteur
        const actorData = await fetchData(`/api/actors/${id}/movies`);
        if (actorData && actorData.movies) {
            const newNodes = actorData.movies.map(movie => ({ id: movie.id, label: movie.title, type: 'movie' }));
            addNodesAndLinks(actorNode, newNodes);
            updateGraph();
        }
        
        // Mettre en évidence l'acteur
        highlightNode(actorNode);
    } catch (error) {
        console.error("Erreur lors de la redirection vers l'acteur:", error);
    }
}

// Fonction de recherche modifiée pour prendre en compte les acteurs
async function searchEntity() {
    const searchTerm = document.getElementById('search-input').value.trim();
    if (!searchTerm) return;
    
    // Vérifier si c'est un film trouvé
    if (foundMoviesSet.has(searchTerm)) {
        try {
            const moviesResponse = await fetch(`/api/search/movies?query=${encodeURIComponent(searchTerm)}`);
            if (moviesResponse.ok) {
                const movies = await moviesResponse.json();
                if (movies.length > 0) {
                    const movie = movies[0];
                    redirectToMovie(movie.id, movie.title);
                }
            }
        } catch (error) {
            console.error("Erreur lors de la recherche de film:", error);
            Swal.fire("Erreur", "Une erreur s'est produite lors de la recherche.", "error");
        }
        return;
    }
    
    // Vérifier si c'est un acteur trouvé
    if (foundActorsSet.has(searchTerm)) {
        try {
            const actorsResponse = await fetch(`/api/search/actors?query=${encodeURIComponent(searchTerm)}`);
            if (actorsResponse.ok) {
                const actors = await actorsResponse.json();
                if (actors.length > 0) {
                    const actor = actors[0];
                    redirectToActor(actor.id, actor.name);
                }
            }
        } catch (error) {
            console.error("Erreur lors de la recherche d'acteur:", error);
            Swal.fire("Erreur", "Une erreur s'est produite lors de la recherche.", "error");
        }
        return;
    }
    
    // Si ni film ni acteur n'a été trouvé dans les listes
    Swal.fire("Entité non trouvée", "Cette entité n'a pas encore été trouvée dans le graphe !", "error");
}

// Initialiser le graph avec un acteur de départ
initializeGraph();

// Ajouter l'événement de clic au bouton de recherche
document.addEventListener('DOMContentLoaded', function() {
    // Vider les listes des films et acteurs trouvés au démarrage
    const moviesList = document.getElementById('found-movies');
    if (moviesList) {
        moviesList.innerHTML = ''; // Réinitialiser le contenu de la liste
    }
    
    const actorsList = document.getElementById('found-actors');
    if (actorsList) {
        actorsList.innerHTML = ''; // Réinitialiser le contenu de la liste
    }

    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', searchEntity);
    }
    
    // Ajouter l'événement pour la touche Entrée dans la barre de recherche
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                searchEntity();
            }
        });
    }
});