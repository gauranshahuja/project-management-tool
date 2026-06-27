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
