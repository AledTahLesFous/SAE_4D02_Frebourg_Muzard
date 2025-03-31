window.onload = function() {
    fetchData("/api/actors/actor_1/movies"); // Charger l'acteur initial avec ses films
};

const width = 800, height = 600;
const svg = d3.select("#graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2));

let nodes = [];
let links = [];

function fetchData(url) {
    fetch(url)
    .then(response => response.json())
    .then(data => {
        updateGraph(data);
    })
    .catch(error => console.error("Erreur lors du chargement des données :", error));
}

function updateGraph(actorData) {
    if (!actorData || !actorData.movies) {
        console.error("Les données ne contiennent pas de films :", actorData);
        return;
    }

    const movies = actorData.movies;

    nodes = [{ id: `Actor: ${actorData.id}`, name: actorData.name, type: "actor" }];
    links = [];

    movies.forEach(movie => {
        nodes.push({ id: `Movie: ${movie.id}`, name: movie.title, type: "movie" });
        links.push({ source: `Actor: ${actorData.id}`, target: `Movie: ${movie.id}` });
    });

    renderGraph();
}

function renderGraph() {
    svg.selectAll("*").remove();

    const link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", "#aaa");

    const node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", d => (d.type === "actor" ? 10 : 6))
        .attr("fill", d => (d.type === "actor" ? "pink" : "magenta"))
        .on("click", handleClick); // Ajout de l'événement click

    const text = svg.selectAll(".text")
        .data(nodes)
        .enter().append("text")
        .attr("dy", 3)
        .attr("x", 10)
        .text(d => d.name)
        .attr("font-size", "10px");

    simulation.nodes(nodes).on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);

        text.attr("x", d => d.x + 10)
            .attr("y", d => d.y);
    });

    simulation.force("link").links(links);
    simulation.alpha(1).restart();
}

// 🟢 Fonction pour ajouter un cercle lorsqu'on clique sur un nœud
function handleClick(event, d) {
    fetchData(`/api/movies/${d.id}/actors`)
    if(d.type == 'movie') {
        const newNode = {
            id: `NewNode_${nodes.length}`,
            name: "New Node",   
            type: "extra"
        };
        nodes.push(newNode);
        links.push({ source: d.id, target: newNode.id });
    
        renderGraph(); // Rafraîchir le graphe avec le nouveau nœud
    }

    
 
}
