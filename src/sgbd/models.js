// src/sgbd/models.js
const Sequelize = require("sequelize");
const myDB = require("./config");

const Player = myDB.define(
  "player",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    first: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    last: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    country: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    birthdate: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    hand: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  { timestamps: false }
);

const Championship = myDB.define(
  "championship",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  { timestamps: false }
);

const Play = myDB.define(
  "play",
  {
    player1_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      references: {
        model: Player,
        key: "id",
      },
    },
    player2_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      references: {
        model: Player,
        key: "id",
      },
    },
    championship_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      references: {
        model: Championship,
        key: "id",
      },
    },
    year: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    score: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  { timestamps: false }
);

const Win = myDB.define(
  "win",
  {
    championship_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      references: {
        model: Championship,
        key: "id",
      },
    },
    winner_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      references: {
        model: Player,
        key: "id",
      },
    },
    year: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  },
  { timestamps: false }
);

module.exports = { Player, Championship, Play, Win };
