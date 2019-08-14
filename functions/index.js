const functions = require('firebase-functions');
const server    = require('./src/server');
const bigEye    = functions
                  .runWith({ memory: '512MB', timeoutSeconds: 540 })
                  .https
                  .onRequest(server)

module.exports = {
  bigEye
}