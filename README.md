La structure devrait ressembler a ca : 

/sae
    /nodes_modules
        -*tout les modules*
    /public
        /image
            logo.png
        app.js
        index.html
    /src
        /routes
            actors.js
            movie.js
            randomActor.js
            recherche.js
            stats.js
            wikipedia.js
        /swagger
            swagger.js
        /sgbd
            config.js
            models.js
    /tests
        api.test.js
        jest.config.js
    .env
    index.js
    package.json
    package-lock.json

Pour les memes, la clé API est dans le app.js et donc accessible a tous....