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

    if (actorData && !nodes.find(node => node.id === actorData.id)) {
        // Ajouter uniquement l'acteur initial s'il n'est pas déjà dans le graphe
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

function updateGraph() {
    const link = g.selectAll("line").data(links);
    link.enter().append("line").merge(link).attr("stroke", "#aaa");
    link.exit().remove();

    const node = g.selectAll("circle").data(nodes, d => d.id);
    const nodeEnter = node.enter().append("circle")
        .attr("r", 10)
        .attr("fill", d => d.type === 'actor' ? "magenta" : "pink")
        .on("click", handleClick)
        .call(drag);
    node.exit().remove();

    nodeEnter.merge(node)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

        const text = g.selectAll("text").data(nodes, d => d.id);
        const textEnter = text.enter().append("text")
            .attr("dx", 12)
            .attr("dy", 4)
            .text(d => d.found ? d.label : "?") // Utiliser le label mis à jour ici
            .merge(text)
            .attr("x", d => d.x)
            .attr("y", d => d.y);
        



        
    text.exit().remove();

    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();

    saveGraphToLocalStorage() 

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

async function getWikipediaInfo(title, type) {
    try {
        console.log(`Recherche d'informations pour ${title} (type: ${type})`);
        
        // URL complète
        const response = await fetch(`/api/wikipedia?title=${encodeURIComponent(title)}&type=${type}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erreur HTTP ${response.status}: ${errorText}`);
            throw new Error(`Erreur lors de la récupération des informations Wikipedia: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Erreur Wikipedia détaillée:", error);
        return { error: "Impossible de récupérer les informations Wikipedia" };
    }
}

// Fonction pour afficher les informations Wikipedia dans une modal
function showWikipediaInfoModal(title, type) {
    Swal.fire({
        title: `Recherche d'informations pour ${title}`,
        text: 'Chargement...',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading();
        }
    });

    getWikipediaInfo(title, type)
        .then(data => {
            if (data.error) {
                Swal.fire({
                    title: "Information non trouvée",
                    text: "Impossible de trouver des informations sur Wikipedia pour " + title,
                    icon: "error"
                });
            } else {
                Swal.fire({
                    title: data.title || title,
                    html: `
                        <div style="text-align: left; max-height: 300px; overflow-y: auto;">
                            ${data.thumbnail ? `<img src="${data.thumbnail}" alt="${title}" style="float: right; max-width: 150px; margin-left: 10px;">` : ''}
                            <p>${data.extract || "Aucune description disponible."}</p>
                            ${data.url ? `<p><a href="${data.url}" target="_blank">En savoir plus sur Wikipedia</a></p>` : ''}
                        </div>
                    `,
                    confirmButtonText: "Fermer",
                    width: '600px'
                });
            }
        })
        .catch(error => {
            console.error("Erreur lors de l'affichage des infos:", error);
            Swal.fire({
                title: "Erreur",
                text: "Une erreur est survenue lors de la récupération des informations",
                icon: "error"
            });
        });
}

// Fonction pour ajouter des films à la liste avec icône d'info
function addMovieToList(id, title) {
    if (!foundMoviesSet.has(title)) {
        foundMoviesSet.add(title); // Ajouter à l'ensemble des films trouvés

        const moviesList = document.getElementById('found-movies');
        const listItem = document.createElement('li');
        listItem.setAttribute('data-id', id);
        
        // Créer le span pour le titre du film
        const titleSpan = document.createElement('span');
        titleSpan.textContent = title;
        titleSpan.style.cursor = 'pointer';
        titleSpan.addEventListener('click', () => {
            const movieNode = nodes.find(n => n.id === id);
            if (movieNode) {
                highlightNode(movieNode);
            }
        });
        
        // Créer l'icône d'information
        const infoIcon = document.createElement('i');
        infoIcon.className = 'fas fa-info-circle';
        infoIcon.style.marginLeft = '10px';
        infoIcon.style.cursor = 'pointer';
        infoIcon.style.color = '#007bff';
        infoIcon.title = 'Informations sur Wikipedia';
        infoIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            showWikipediaInfoModal(title, 'movie');
        });
        
        // Assembler les éléments
        listItem.appendChild(titleSpan);
        listItem.appendChild(infoIcon);
        moviesList.appendChild(listItem);
        saveGraphToLocalStorage();
    }
}
function updateFoundMoviesList() {
    const moviesList = document.getElementById('found-movies');
    if (moviesList) {
        // Vider la liste des films avant de la remplir
        moviesList.innerHTML = ''; 

        // Ajouter les films trouvés à la liste
        foundMoviesSet.forEach(movie => {
            const listItem = document.createElement('li');
            listItem.textContent = movie;
            moviesList.appendChild(listItem);
        });
    }
}

// Nouvelle fonction pour ajouter des acteurs à la liste
// Fonction pour ajouter des acteurs à la liste avec icône d'info
function addActorToList(id, name) {
    if (!foundActorsSet.has(name)) {
        foundActorsSet.add(name); // Ajouter à l'ensemble des acteurs trouvés

        const actorsList = document.getElementById('found-actors');
        const listItem = document.createElement('li');
        listItem.setAttribute('data-id', id);
        
        // Créer le span pour le nom de l'acteur
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.style.cursor = 'pointer';
        nameSpan.addEventListener('click', () => {
            const actorNode = nodes.find(n => n.id === id);
            if (actorNode) {
                highlightNode(actorNode);
            }
        });
        
        // Créer l'icône d'information
        const infoIcon = document.createElement('i');
        infoIcon.className = 'fas fa-info-circle';
        infoIcon.style.marginLeft = '10px';
        infoIcon.style.cursor = 'pointer';
        infoIcon.style.color = '#007bff';
        infoIcon.title = 'Informations sur Wikipedia';
        infoIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            showWikipediaInfoModal(name, 'actor');
        });
        
        // Assembler les éléments
        listItem.appendChild(nameSpan);
        listItem.appendChild(infoIcon);
        actorsList.appendChild(listItem);
        saveGraphToLocalStorage();
    }
}

function updateFoundActorsList() {
    const actorsList = document.getElementById('found-actors');
    if (actorsList) {
        // Vider la liste des acteurs avant de la remplir
        actorsList.innerHTML = ''; 

        // Ajouter les acteurs trouvés à la liste
        foundActorsSet.forEach(actor => {
            const listItem = document.createElement('li');
            listItem.textContent = actor;
            actorsList.appendChild(listItem);
        });
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

// Fonction pour rediriger vers un acteur
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

function saveGraphToLocalStorage() {
    const graphData = {
        nodes: nodes.map(n => ({
            id: n.id,
            label: n.label,
            type: n.type,
            x: n.x,
            y: n.y,
            found: foundMoviesSet.has(n.label) || foundActorsSet.has(n.label), // Vérification si trouvé
        })),
        links: links.map(l => ({
            source: l.source.id,
            target: l.target.id,
        })),
        foundMovies: Array.from(foundMoviesSet), // Ajouter les films trouvés
        foundActors: Array.from(foundActorsSet), // Ajouter les acteurs trouvés
    };

    // Sauvegarde dans le localStorage
    localStorage.setItem("graphData", JSON.stringify(graphData));
    console.log("Graph saved to localStorage.");
    console.log(graphData.foundActors);
}

function loadGraphFromLocalStorage() {
    const savedData = localStorage.getItem("graphData");

    if (savedData) {
        const graphData = JSON.parse(savedData);
        
        // Réinitialiser les ensembles trouvés avant de charger les données
        foundMoviesSet.clear();
        foundActorsSet.clear();

        // Ajouter les films et acteurs trouvés aux ensembles
        if (graphData.foundMovies) {
            graphData.foundMovies.forEach(movie => foundMoviesSet.add(movie));
        }
        if (graphData.foundActors) {
            graphData.foundActors.forEach(actor => foundActorsSet.add(actor));
        }

        // Réinitialisation des nœuds et des liens
        nodes = [];
        links = [];

// Charger les nœuds
        graphData.nodes.forEach(n => {
            // Si l'acteur ou le film a été trouvé, on l'ajoute aux ensembles appropriés
            if (n.found) {
                if (n.type === 'movie') {
                    foundMoviesSet.add(n.label);
                } else if (n.type === 'actor') {
                    foundActorsSet.add(n.label);
                }
            }

            // Ajouter le nœud au graphe
            // Remplace "?" par le label réel si l'acteur/film a été trouvé
            nodes.push({
                ...n,
                label: n.found ? n.label : "?" // Ne mettre "?" que si le nœud n'a pas été trouvé
            });
        });


        // Charger les liens
        links = graphData.links.map(l => ({
            source: nodes.find(n => n.id === l.source),
            target: nodes.find(n => n.id === l.target),
        }));

        // Mettre à jour le graphe après avoir chargé les données
        updateGraph();

        // Mettre à jour les listes d'acteurs et de films dans le HTML
        updateFoundMoviesList();
        updateFoundActorsList();

        console.log("Graph loaded from localStorage.");
    } else {
        console.log("No graph data found in localStorage.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Vérifie si des données sont présentes dans le localStorage
    if (localStorage.getItem("graphData")) {
        // Charge le graphe à partir du localStorage
        loadGraphFromLocalStorage();
        console.log("LC")
    } else {
        // Si aucune donnée n'est trouvée, initialise un graphe de départ
        initializeGraph();
    }
});

document.getElementById('reset-button').addEventListener('click', () => {
    Swal.fire({
        title: "Êtes-vous sûr ?",
        text: "Cela supprimera toutes les données enregistrées !",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Oui, réinitialiser",
        cancelButtonText: "Annuler"
    }).then((result) => {
        if (result.isConfirmed) {
            // Suppression des données dans localStorage
            localStorage.removeItem("graphData");

            // Réinitialisation des ensembles de films et d'acteurs trouvés
            foundMoviesSet.clear();
            foundActorsSet.clear();

            // Réinitialisation des nœuds et des liens
            nodes = [];
            links = [];

            // Mise à jour du graphe (efface tout)
            updateGraph();

            // Notification de succès
            Swal.fire("Réinitialisé !", "Le graphe a été réinitialisé.", "success");
        }
    });
});
