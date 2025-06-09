# HTTPS

- In production mode, this project uses HTTPS to create the server. To enable HTTPS, follow these steps:

* Install mkcert
* Run: mkcert -install
* Then run: npm run generate:cert

- Alternatively, you can replace the https package with the http package in the file [src/server/app.ts].
