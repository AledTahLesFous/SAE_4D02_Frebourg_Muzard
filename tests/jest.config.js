module.exports = {
  testEnvironment: 'node',
  verbose: true,
  // Définir un timeout plus long pour les tests qui interagissent avec la base de données
  testTimeout: 10000,
  // Ne pas exécuter les tests dans le dossier node_modules
  testPathIgnorePatterns: ['/node_modules/']
};