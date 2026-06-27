const admin = require("firebase-admin");
const serviceAccount = require("../config/project-management-tool-82a1c-firebase-adminsdk-fbsvc-cf77160a48.json"); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
