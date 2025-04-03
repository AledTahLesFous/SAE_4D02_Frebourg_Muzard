const request = require('supertest');
const app = require('../index');
const { Movies, Actors, MoviesActor, Genres } = require('../src/sgbd/models');
const axios = require('axios'); // Pour pouvoir mocker les appels API Wikipedia

// Fonction utilitaire pour attendre que la base de données soit connectée
const waitForDB = async () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
};

// Avant tous les tests, s'assurer que la base de données est connectée
beforeAll(async () => {
  await waitForDB();
});

// Mock pour axios
jest.mock('axios');

// Après tous les tests, fermer la connexion à la base de données
afterAll(async () => {
  // Fermer la connexion à la base de données
  await require('../src/sgbd/config').close();
});

describe('Tests des routes API', () => {
  // Tests pour les routes de recherche
  describe('Routes de recherche', () => {
    // Test de recherche d'acteurs
    test('GET /api/search/actors - devrait retourner des acteurs correspondant à la recherche', async () => {
      const response = await request(app).get('/api/search/actors?query=Tom');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    // Test de recherche d'acteurs sans paramètre de recherche
    test('GET /api/search/actors - devrait retourner une erreur 400 sans paramètre de recherche', async () => {
      const response = await request(app).get('/api/search/actors');
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    // Test de recherche de films
    test('GET /api/search/movies - devrait retourner des films correspondant à la recherche', async () => {
      const response = await request(app).get('/api/search/movies?query=Star');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    // Test de recherche de films sans paramètre de recherche
    test('GET /api/search/movies - devrait retourner une erreur 400 sans paramètre de recherche', async () => {
      const response = await request(app).get('/api/search/movies');
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  // Tests pour les routes d'acteurs
  describe('Routes d\'acteurs', () => {
    // Test pour récupérer les films d'un acteur
    test('GET /api/actors/:id/movies - devrait retourner les films d\'un acteur', async () => {
      // Récupérer d'abord un acteur existant
      const actor = await Actors.findOne();
      if (actor) {
        const response = await request(app).get(`/api/actors/${actor.id}/movies`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('movies');
      } else {
        console.warn('Aucun acteur trouvé dans la base de données pour le test');
      }
    });

    // Test pour récupérer les acteurs d'un film
    test('GET /api/movies/:id/actors - devrait retourner les acteurs d\'un film', async () => {
      // Récupérer d'abord un film existant
      const movie = await Movies.findOne();
      if (movie) {
        const response = await request(app).get(`/api/movies/${movie.id}/actors`);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      } else {
        console.warn('Aucun film trouvé dans la base de données pour le test');
      }
    });
  });

  // Tests pour les routes de statistiques
  describe('Routes de statistiques', () => {
    // Test pour récupérer les statistiques de base
    test('GET /api/stats - devrait retourner les statistiques de base', async () => {
      const response = await request(app).get('/api/stats');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('actors');
      expect(response.body).toHaveProperty('movies');
    });

    // Test pour récupérer les statistiques détaillées
    test('GET /api/stats/detailed - devrait retourner les statistiques détaillées', async () => {
      const response = await request(app).get('/api/stats/detailed');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('totalMovies');
      expect(response.body).toHaveProperty('averageActorsPerMovie');
      expect(response.body).toHaveProperty('moviesByYear');
      expect(response.body).toHaveProperty('moviesByGenre');
    });
  });



  // Tests pour la route d'acteur aléatoire
  describe('Route d\'acteur aléatoire', () => {
    // Test pour récupérer un acteur aléatoire
    test('GET /api/actors/random - devrait retourner un acteur aléatoire', async () => {
      const response = await request(app).get('/api/actors/random');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
    });
  });

  // Tests pour les routes Wikipedia
  describe('Routes Wikipedia', () => {
    // Test pour récupérer des informations Wikipedia avec un titre valide
    test('GET /api/wikipedia - devrait retourner des informations Wikipedia avec un titre valide', async () => {
      // Mock de la réponse d'axios pour la recherche
      axios.get.mockImplementation((url) => {
        if (url.includes('list=search')) {
          return Promise.resolve({
            data: {
              query: {
                search: [{ title: 'Tom Hanks' }]
              }
            }
          });
        } else if (url.includes('prop=extracts')) {
          return Promise.resolve({
            data: {
              query: {
                pages: {
                  '12345': {
                    title: 'Tom Hanks',
                    extract: 'Tom Hanks est un acteur américain.',
                    thumbnail: { source: 'https://example.com/image.jpg' }
                  }
                }
              }
            }
          });
        }
      });

      const response = await request(app).get('/api/wikipedia?title=Tom%20Hanks&type=actor');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('extract');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('thumbnail');
    });

    // Test pour récupérer des informations Wikipedia sans titre
    test('GET /api/wikipedia - devrait retourner une erreur 400 sans paramètre de titre', async () => {
      const response = await request(app).get('/api/wikipedia');
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    // Test pour récupérer des informations Wikipedia avec un titre qui ne donne aucun résultat
    test('GET /api/wikipedia - devrait retourner une erreur 404 pour un titre sans résultat', async () => {
      // Mock de la réponse d'axios pour une recherche sans résultat
      axios.get.mockImplementation((url) => {
        if (url.includes('list=search')) {
          return Promise.resolve({
            data: {
              query: {
                search: []
              }
            }
          });
        }
      });

      const response = await request(app).get('/api/wikipedia?title=TitreInexistant');
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    // Test pour simuler une erreur serveur lors de la récupération des informations Wikipedia
    test('GET /api/wikipedia - devrait retourner une erreur 500 en cas d\'erreur serveur', async () => {
      // Mock de la réponse d'axios pour simuler une erreur
      axios.get.mockImplementation(() => {
        return Promise.reject(new Error('Erreur de connexion'));
      });

      const response = await request(app).get('/api/wikipedia?title=Tom%20Hanks');
      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});