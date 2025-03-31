// Créer une scène Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ajouter une lumière ambiante à la scène
const light = new THREE.AmbientLight(0x404040);
scene.add(light);

// Créer une sphère juste pour initialiser la scène
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0x0077ff });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

camera.position.z = 20;

let movieCube = null;
let actorCubes = [];
let movieActorCubes = [];  // Pour stocker les cubes de films liés aux acteurs

// Fonction pour charger les acteurs d'un film
async function loadActorsForMovie(movieId) {
  try {
    const response = await fetch(`/api/movies/${movieId}/actors`);
    const actors = await response.json();

    // Ajouter un cube pour chaque acteur lié à ce film
    actorCubes.forEach(cube => scene.remove(cube)); // Enlever les anciens cubes d'acteurs
    actorCubes = []; // Réinitialiser le tableau des cubes

    actors.forEach((actor, i) => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
      const actorCube = new THREE.Mesh(cubeGeometry, cubeMaterial);

      // Positionner les cubes d'acteurs autour du cube du film
      actorCube.position.set(i * 3 - 5, 5, 0);
      scene.add(actorCube);
      actorCubes.push({ actor, cube: actorCube }); // Enregistrer l'acteur et son cube
    });
  } catch (error) {
    console.error("Erreur lors du chargement des acteurs:", error);
  }
}

// Fonction pour charger les films d'un acteur
async function loadMoviesForActor(actorId, actorCube) {
  try {
    const response = await fetch(`/api/actors/${actorId}/movies`);
    const data = await response.json();

    const movies = data.movies;  // Accède au tableau des films

    if (!Array.isArray(movies)) {
      console.error("La réponse ne contient pas un tableau de films");
      return;
    }

    // Ajouter un cube pour chaque film associé à cet acteur autour de l'acteur
    movieActorCubes.forEach(cube => scene.remove(cube)); // Enlever les anciens cubes de films
    movieActorCubes = []; // Réinitialiser le tableau des cubes

    movies.forEach((movie, i) => {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
      const movieCube = new THREE.Mesh(cubeGeometry, cubeMaterial);

      // Positionner les cubes de films autour du cube de l'acteur
      movieCube.position.set(actorCube.position.x + i * 3 - 5, actorCube.position.y, actorCube.position.z);
      scene.add(movieCube);
      movieActorCubes.push(movieCube);
    });
  } catch (error) {
    console.error("Erreur lors du chargement des films:", error);
  }
}

// Fonction de gestion du clic sur le cube du film
function onMovieCubeClick() {
  const movieId = "movie_1"; // Exemple d'ID de film, tu peux le changer dynamiquement
  loadActorsForMovie(movieId);
}

// Fonction de gestion du clic sur un acteur
function onActorCubeClick(actorId, actorCube) {
  loadMoviesForActor(actorId, actorCube);  // Charger les films de l'acteur
}

// Créer un cube pour un film
movieCube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
scene.add(movieCube);
movieCube.position.set(0, 0, 0); // Positionner le cube du film au centre

// Ajouter un détecteur de clic pour le cube du film
window.addEventListener('click', (event) => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Calculer les coordonnées normalisées de la souris
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Créer un rayon à partir de la position de la souris dans la scène 3D
  raycaster.setFromCamera(mouse, camera);

  // Vérifier si le rayon intersecte le cube du film
  const movieIntersects = raycaster.intersectObject(movieCube);
  if (movieIntersects.length > 0) {
    onMovieCubeClick(); // Charger les acteurs si le film est cliqué
  }

  // Vérifier si le rayon intersecte l'un des cubes d'acteur
  actorCubes.forEach(({ actor, cube }) => {
    const actorIntersects = raycaster.intersectObject(cube);
    if (actorIntersects.length > 0) {
      onActorCubeClick(actor.id, cube);  // Charger les films si l'acteur est cliqué
    }
  });
});

// Variables pour le mouvement de la caméra
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Gérer le mouvement de la souris pour déplacer la caméra
window.addEventListener('mousedown', (event) => {
  isDragging = true;
});

window.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    // Déplacer la caméra en fonction de la position de la souris
    camera.rotation.y += deltaX * 0.005;
    camera.rotation.x -= deltaY * 0.005;

    // Empêcher la caméra de faire une rotation trop extrême
    camera.rotation.x = Math.max(Math.min(camera.rotation.x, Math.PI / 2), -Math.PI / 2);
  }

  previousMousePosition = { x: event.clientX, y: event.clientY };
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

// Gérer le zoom de la caméra avec la molette de la souris
window.addEventListener('wheel', (event) => {
  camera.position.z += event.deltaY * 0.05;
  camera.position.z = Math.max(camera.position.z, 5);  // Limiter le zoom avant
  camera.position.z = Math.min(camera.position.z, 100);  // Limiter le zoom arrière
});

// Fonction d'animation
function animate() {
  movieCube.rotation.x += 0.01;
  movieCube.rotation.y += 0.01;

  actorCubes.forEach(({ cube }) => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  });

  movieActorCubes.forEach(cube => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  });

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
