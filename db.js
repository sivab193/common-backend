import { MongoClient } from 'mongodb';
import dotenv from '@dotenvx/dotenvx';

dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let dbConnection;

export const connectDB = async () => {
  try {
    await client.connect();
    dbConnection = client.db('personal-website');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

export const getDB = () => {
  if (!dbConnection) {
    throw new Error('Call connectDB first');
  }
  return dbConnection;
};
