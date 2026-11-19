$ xd new my-app --ssr
$ cd my-app
$ npm start             # the dev server renders every page on the server
$ npm run build         # dist/client, for the browser, and dist/server
$ npm run serve         # node server.ts, on http://localhost:3000 (PORT to change it)
$ npm run prerender     # the routes of xaendar.json, into HTML files of dist/client
