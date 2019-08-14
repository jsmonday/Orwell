const admin          = require("firebase-admin");
const serviceAccount = require("./firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://jsmonday-cms.firebaseio.com"
});

const db = admin.firestore();

module.exports = {
  analytics: db.collection('analytics')
}