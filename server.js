import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from '@dotenvx/dotenvx';
import { connectDB } from './db.js';
import projectRoutes from './routes/projects.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});
app.use(limiter);

app.use(cors());
app.use(express.json());

// Database Connection Middleware
// Ensures DB connects on cold start in Vercel before hitting routes
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// Routes
app.use('/api/projects', projectRoutes);

// Server Startup for local development
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export for Vercel Serverless Functions
export default app;
