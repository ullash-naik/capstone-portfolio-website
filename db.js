const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);

let dbConnection;

async function connectDB() {
  try {
    await client.connect();
    dbConnection = client.db('PortfolioDB');
    console.log('Connected to MongoDB Database.');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
}

function getDB() {
  if (!dbConnection) throw new Error('Database not initialized');
  return dbConnection;
}

module.exports = { connectDB, getDB };