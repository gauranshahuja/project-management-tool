// Local dev entry — Atlas ki jagah in-memory MongoDB use karta hai.
// Data process band hone par ud jata hai (sirf dev/demo ke liye).
// Run: npm run dev:memory  (server/ folder se)
require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27017, dbName: 'pmtool-dev' },
  });

  process.env.MONGO_URI = mongod.getUri('pmtool-dev');
  console.log('In-memory MongoDB started at', process.env.MONGO_URI);

  require('./index');
})();
