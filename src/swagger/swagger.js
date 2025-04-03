const swaggerJsdoc = require('swagger-jsdoc');

// Options de configuration Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Films et Acteurs',
      version: '1.0.0',
      description: 'API permettant de consulter des informations sur les films et les acteurs',
      contact: {
        name: 'Support API',
        email: 'support@example.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement'
      }
    ],
    components: {
      schemas: {
        Actor: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant unique de l\'acteur'
            },
            name: {
              type: 'string',
              description: 'Nom de l\'acteur'
            },
            movies: {
              type: 'array',
              description: 'Liste des films dans lesquels l\'acteur a joué',
              items: {
                $ref: '#/components/schemas/Movie'
              }
            }
          }
        },
        Movie: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant unique du film'
            },
            title: {
              type: 'string',
              description: 'Titre du film'
            },
            year: {
              type: 'integer',
              description: 'Année de sortie du film'
            },
            actors: {
              type: 'array',
              description: 'Liste des acteurs ayant joué dans le film',
              items: {
                $ref: '#/components/schemas/Actor'
              }
            }
          }
        },
        Genre: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant unique du genre'
            },
            genre: {
              type: 'string',
              description: 'Nom du genre'
            }
          }
        },
        WikipediaInfo: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Titre de l\'article Wikipedia'
            },
            extract: {
              type: 'string',
              description: 'Extrait de l\'article Wikipedia'
            },
            url: {
              type: 'string',
              description: 'URL de l\'article Wikipedia'
            },
            thumbnail: {
              type: 'string',
              description: 'URL de l\'image miniature (si disponible)'
            }
          }
        },
        Stats: {
          type: 'object',
          properties: {
            actors: {
              type: 'integer',
              description: 'Nombre total d\'acteurs'
            },
            movies: {
              type: 'integer',
              description: 'Nombre total de films'
            }
          }
        },
        DetailedStats: {
          type: 'object',
          properties: {
            totalMovies: {
              type: 'integer',
              description: 'Nombre total de films'
            },
            averageActorsPerMovie: {
              type: 'number',
              description: 'Nombre moyen d\'acteurs par film'
            },
            moviesByYear: {
              type: 'array',
              description: 'Nombre de films par année',
              items: {
                type: 'object',
                properties: {
                  year: {
                    type: 'integer',
                    description: 'Année'
                  },
                  count: {
                    type: 'integer',
                    description: 'Nombre de films'
                  }
                }
              }
            },
            totalGenres: {
              type: 'integer',
              description: 'Nombre total de genres'
            },
            moviesByGenre: {
              type: 'array',
              description: 'Nombre de films par genre',
              items: {
                type: 'object',
                properties: {
                  genre: {
                    type: 'string',
                    description: 'Nom du genre'
                  },
                  count: {
                    type: 'integer',
                    description: 'Nombre de films'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  // Chemins vers les fichiers contenant les annotations JSDoc
  apis: [
    './src/routes/*.js',
    './index.js'
  ],
  paths: {
    '/api/stats': {
      get: {
        summary: 'Récupérer les statistiques de base',
        description: 'Récupère le nombre total de films et d\'acteurs dans la base de données',
        tags: ['Statistiques'],
        responses: {
          '200': {
            description: 'Statistiques de base récupérées avec succès',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Stats'
                }
              }
            }
          },
          '500': {
            description: 'Erreur serveur'
          }
        }
      }
    },
    '/api/stats/detailed': {
      get: {
        summary: 'Récupérer les statistiques détaillées',
        description: 'Récupère des statistiques détaillées sur les films, acteurs et genres',
        tags: ['Statistiques'],
        responses: {
          '200': {
            description: 'Statistiques détaillées récupérées avec succès',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DetailedStats'
                }
              }
            }
          },
          '500': {
            description: 'Erreur serveur'
          }
        }
      }
    }
  }
};

// Générer les spécifications Swagger
const specs = swaggerJsdoc(options);

module.exports = specs;