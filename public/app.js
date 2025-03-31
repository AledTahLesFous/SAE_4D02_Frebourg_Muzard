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
        console.log("Données reçues :", data); // Regarde la structure ici
        updateGraph(data);
    })
    .catch(error => console.error("Erreur lors du chargement des données :", error));

}


function updateGraph(actorData) {
    if (!actorData || !actorData.movies) {
        console.error("Les données ne contiennent pas de films :", actorData);
        return;
    }

    const movies = actorData.movies; // Utilise "movies" au lieu de "Movies"

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
        .attr("fill", d => (d.type === "actor" ? "red" : "blue"));

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
