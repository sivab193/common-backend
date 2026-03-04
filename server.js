import express from 'express';
import cors from 'cors';
import dotenv from '@dotenvx/dotenvx';
import { connectDB } from './db.js';
import projectRoutes from './routes/projects.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);

// Database Connection & Server Startup
const startServer = async () => {
    try {
        await connectDB();
        if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        }
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Export for Vercel Serverless Functions
export default app;
