const Sequelize = require("sequelize");
const myDB = require("./config");

const Actors = myDB.define(
  "actors",
  {
    id: {
      type: Sequelize.STRING, // ID sous forme de chaîne
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  { timestamps: false }
);

const Genres = myDB.define(
  "genres",
  {
    id: {
      type: Sequelize.STRING, // ID sous forme de chaîne
      primaryKey: true,
    },
    genre: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  { timestamps: false }
);

const Movies = myDB.define(
  "movies",
  {
    id: {
      type: Sequelize.STRING, // ID sous forme de chaîne
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    year: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  },
  { timestamps: false }
);

const MoviesActor = myDB.define(
  "moviesactor",
  {
    id_movie: {
      type: Sequelize.STRING, // ID sous forme de chaîne
      references: {
        model: Movies, // Foreign key to Movies
        key: "id",
      },
      primaryKey: true,
    },
    id_actor: {
      type: Sequelize.STRING, // ID sous forme de chaîne
      references: {
        model: Actors, // Foreign key to Actors
        key: "id",
      },
      allowNull: false,
    },
  },
  { timestamps: false }
);

const MoviesGenre = myDB.define(
  "moviesgenres",
  {
    id_movie: {
      type: Sequelize.STRING, // ID sous forme de chaîne
      references: {
        model: Movies, // Foreign key to Movies
        key: "id",
      },
      primaryKey: true,
    },
    id_genre: {
      type: Sequelize.STRING, // ID sous forme de chaîne
      references: {
        model: Genres, // Foreign key to Genres
        key: "id",
      },
      allowNull: false,
    },
  },
  { timestamps: false }
);

Movies.belongsToMany(Actors, { through: MoviesActor, foreignKey: "id_movie" });
Actors.belongsToMany(Movies, { through: MoviesActor, foreignKey: "id_actor" });

Movies.belongsToMany(Genres, { through: MoviesGenre, foreignKey: "id_movie" });
Genres.belongsToMany(Movies, { through: MoviesGenre, foreignKey: "id_genre" });

module.exports = { Actors, Movies, MoviesActor, MoviesGenre, Genres };
