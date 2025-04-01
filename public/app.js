// Création du SVG
const width = 800, height = 600;
const svg = d3.select("#graph")  // Assurez-vous que l'élément SVG est appendu à #graph
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("cursor", "move");  // Pour indiquer que l'élément est déplaçable

// Variable pour suivre la position de déplacement
let offsetX = 0, offsetY = 0;

// Ajouter le déplacement (drag) pour l'élément SVG
svg.call(d3.drag()
    .on("drag", function(event) {
        offsetX = event.x;  // Mise à jour de l'offset X
        offsetY = event.y;  // Mise à jour de l'offset Y

        svg.attr("transform", `translate(${offsetX},${offsetY})`);
    })
);
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

// Fonction d'initialisation du graph avec les films d'un acteur
async function initializeGraph() {
    const actorData = await fetchData("http://localhost:3000/api/actors/actor_1/movies");

    if (actorData) {
        let initialNode = { id: actorData.id, label: actorData.name, x: center.x, y: center.y, type: 'actor' };
        nodes.push(initialNode);

        // Créer des nœuds pour les films associés à cet acteur
        const newNodes = actorData.movies.map(movie => ({ id: movie.id, label: movie.title, type: 'movie' }));
        addNodesAndLinks(initialNode, newNodes);
        updateGraph();
    }
}

// Fonction pour ajouter des nœuds et des liens au graph
function addNodesAndLinks(sourceNode, newNodes) {
    newNodes.forEach(node => {
        if (!nodes.find(n => n.id === node.id)) {
            node.x = sourceNode.x + (Math.random() - 0.5) * 200;
            node.y = sourceNode.y + (Math.random() - 0.5) * 200;
            nodes.push(node);
            links.push({ source: sourceNode, target: node });
        }
    });
}

// Fonction pour mettre à jour le graphique
function updateGraph() {
    const link = svg.selectAll("line").data(links);
    link.enter().append("line").merge(link).attr("stroke", "#aaa");
    link.exit().remove();

    const node = svg.selectAll("circle").data(nodes, d => d.id);
    const nodeEnter = node.enter().append("circle")
        .attr("r", 10)
        .attr("fill", d => d.type === 'actor' ? "magenta" : d.type === 'movie' ? "pink" : "gray")
        .on("click", handleClick);

    node.exit().remove();

    nodeEnter.merge(node)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    // Ajouter les labels (textes)
    const text = svg.selectAll("text").data(nodes, d => d.id);
    const textEnter = text.enter().append("text")
        .attr("dx", 12)
        .attr("dy", 4)
        .text(d => d.label)
        .merge(text)
        .attr("x", d => d.x)
        .attr("y", d => d.y);

    text.exit().remove();

    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();
}

// Fonction appelée lors d'un clic sur un nœud (acteur ou film)
async function handleClick(event, d) {
    console.log("Clicked node:", d); // Vérification de l'objet d (nœud)

    // Vérification de son type avant de continuer
    console.log("Node type:", d.type);

    if (d.type === 'actor') {
        console.log(`Fetching movies for actor: ${d.id}`);

        const actorData = await fetchData(`/api/actors/${d.id}/movies`);

        // Vérification de la réponse
        console.log("Actor data:", actorData);

        if (actorData && actorData.movies) {
            const newNodes = actorData.movies.map(movie => ({ id: movie.id, label: movie.title, type: 'movie' }));
            addNodesAndLinks(d, newNodes);
            updateGraph();
        } else {
            console.log("No movies found for this actor.");
        }
    } else if (d.type === 'movie') {
        console.log(`Fetching actors for movie: ${d.id}`);

        const movieData = await fetchData(`/api/movies/${d.id}/actors`);

        // Vérification de la réponse
        console.log("Movie data:", movieData);

        if (movieData) {
            const newNodes = movieData.map(actor => ({ id: actor.id, label: actor.name, type: 'actor' }));
            addNodesAndLinks(d, newNodes);
            updateGraph();
        } else {
            console.log("No actors found for this movie.");
        }
    }
}

// Fonction de mise à jour des positions des nœuds à chaque tick de la simulation
function ticked() {
    svg.selectAll("line")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    svg.selectAll("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    svg.selectAll("text")   
        .attr("x", d => d.x)
        .attr("y", d => d.y);
}

// Initialiser le graph avec un acteur de départ
initializeGraph();
