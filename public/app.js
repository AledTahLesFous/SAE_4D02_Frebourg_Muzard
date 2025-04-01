// Création du SVG
const width = 800, height = 600;
const svg = d3.select("#graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

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

// Modification de la fonction addNodesAndLinks
function addNodesAndLinks(sourceNode, newNodes) {
    newNodes.forEach(node => {
        let existingNode = nodes.find(n => n.id === node.id);

        if (!existingNode) {
            // Si le nœud n'existe pas encore, on l'ajoute
            node.x = sourceNode.x + (Math.random() - 0.5) * 200;
            node.y = sourceNode.y + (Math.random() - 0.5) * 200;
            nodes.push(node);
            links.push({ source: sourceNode, target: node });

            // Ajouter le film à la liste si c'est un film
            if (node.type === 'movie') {
                addMovieToList(node.id, node.label);
            }
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

// Modification de la fonction handleClick pour les films
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

// Variable pour suivre les films déjà trouvés
let foundMovies = new Set();

function addMovieToList(id, title) {
    // Vérifier si le film est déjà dans la liste
    if (!foundMovies.has(id)) {
        foundMovies.add(id);
        
        const moviesList = document.getElementById('found-movies');
        const listItem = document.createElement('li');
        listItem.setAttribute('data-id', id);
        listItem.textContent = title;
        
        // Ajouter un événement pour mettre en évidence le nœud correspondant dans le graphe
        listItem.addEventListener('click', () => {
            const movieNode = nodes.find(n => n.id === id);
            if (movieNode) {
                highlightNode(movieNode);
            } else {
                // Si le film n'est pas déjà affiché dans le graphe, le rechercher
                redirectToMovie(id, title);
            }
        });
        
        moviesList.appendChild(listItem);
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

async function searchEntity() {
    const searchTerm = document.getElementById('search-input').value.trim();
    if (!searchTerm) return;

    try {
        // Recherche de films uniquement
        const moviesResponse = await fetch(`/api/search/movies?query=${encodeURIComponent(searchTerm)}`);
        if (moviesResponse.ok) {
            const movies = await moviesResponse.json();
            if (movies && movies.length > 0) {
                const movie = movies[0];
                let movieNode = nodes.find(n => n.id === movie.id);

                if (!movieNode) {
                    movieNode = { id: movie.id, label: movie.title, type: 'movie', x: center.x, y: center.y };
                    nodes.push(movieNode);
                    addMovieToList(movie.id, movie.title);
                }

                const movieData = await fetchData(`/api/movies/${movie.id}/actors`);
                if (movieData) {
                    const newNodes = movieData.map(actor => ({ id: actor.id, label: actor.name, type: 'actor' }));
                    addNodesAndLinks(movieNode, newNodes);
                    updateGraph();
                }

                // Mettre en évidence le film après l'avoir ajouté au graphe
                highlightNode(movieNode);
            } else {
                alert("Aucun film trouvé pour cette recherche.");
            }
        } else {
            alert("Erreur lors de la recherche de films.");
        }
    } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        alert("Une erreur est survenue lors de la recherche. Veuillez réessayer.");
    }
}

// Initialiser le graph avec un acteur de départ
initializeGraph();

// Ajouter l'événement de clic au bouton de recherche
document.addEventListener('DOMContentLoaded', function() {
    // Vider la liste des films trouvés au démarrage
    const moviesList = document.getElementById('found-movies');
    if (moviesList) {
        moviesList.innerHTML = ''; // Réinitialiser le contenu de la liste
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