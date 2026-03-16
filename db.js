import { MongoClient } from 'mongodb';
import dotenv from '@dotenvx/dotenvx';

dotenv.config();

let client;
let dbConnection;

export const connectDB = async () => {
  if (dbConnection) return;
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI environment variable is not set");
    }
    if (!client) {
      client = new MongoClient(uri);
    }
    await client.connect();
    dbConnection = client.db('personal-website');
    console.log('MongoDB connected successfully');

    // Create indexes for performance
    try {
      const collection = dbConnection.collection('projects');
      await collection.createIndex({ visible: 1, createdAt: -1 });
      await collection.createIndex({ createdAt: -1 });
      await collection.createIndex({ github: 1 });
      await collection.createIndex({ title: 1 });
      console.log('MongoDB indexes created/verified successfully');
    } catch (indexError) {
      console.warn('MongoDB index creation failed (might lack permissions):', indexError.message);
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
};

export const getDB = () => {
  if (!dbConnection) {
    throw new Error('Call connectDB first');
  }
  return dbConnection;
};
