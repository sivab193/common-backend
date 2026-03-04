import dotenv from '@dotenvx/dotenvx';
import { MongoClient } from 'mongodb';
import { createProject } from '../models/projectModel.js';

dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) {
    console.error('MONGO_URI is missing from environment variables');
    process.exit(1);
}

const client = new MongoClient(uri);

const seedData = [
    {
        title: "ZeroHour",
        description: "Precision event countdown PWA with smart timezone handling, public profile pages with auto-generated OG cards",
        technologies: ["Next.js", "React", "TypeScript", "Firebase", "Tailwind CSS", "Framer Motion"],
        github: "https://github.com/sivab193/ZeroHour",
        demo: "https://zh.siv19.dev",
        highlights: ["Smart Timezone Support", "PWA with Offline Access", "Public Profiles & OG Sharing"]
    },
    {
        title: "CityBus Bot",
        description: "Real-time Telegram bot for tracking CityBus in Greater Lafayette. Features fuzzy stop search, live arrival predictions, and automated subscription alerts.",
        technologies: ["Python", "GTFS", "Telegram API", "Google Cloud"],
        github: "https://github.com/sivab193/citybus-bot",
        demo: null,
        highlights: ["Real-time tracking", "Fuzzy search", "Automated alerts"]
    },
    {
        title: "Short-GPT",
        description: "Decoder-only transformer for shortest path prediction in graphs. Investigates if algorithmic alignment (RL) improves performance over supervised pretraining.",
        technologies: ["Python", "PyTorch", "Transformers", "Reinforcement Learning"],
        github: "https://github.com/MaxNickell/Short-GPT",
        demo: null,
        highlights: ["Graph Transformer", "RL Finetuning", "Algorithmic Alignment"]
    },
    {
        title: "Movies Tracker",
        description: "Comprehensive movie watch history tracker with global leaderboard, TitleCard timer, and granular privacy controls.",
        technologies: ["TypeScript", "Next.js", "Python", "Vercel"],
        github: "https://github.com/sivab193/movies-tracker",
        demo: "https://m19t.vercel.app/",
        highlights: ["Watch History", "Global Leaderboard", "TitleCard Timer"]
    },
    {
        title: "Statify",
        description: "Spotify statistics dashboard providing insights into listening habits, top artists, and tracks with a modern UI.",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Spotify API"],
        github: "https://github.com/sivab193/statify",
        demo: "https://s19.vercel.app",
        highlights: ["Spotify Integration", "Listening Insights"]
    },
    {
        title: "Speed Cuber",
        description: "Specialized speed cubing platform with precision timer, solve history tracking, and performance analysis.",
        technologies: ["Next.js", "TypeScript", "CSS", "shadcn/ui"],
        github: "https://github.com/sivab193/speed-cuber",
        demo: "https://v0-speed-cubing-website.vercel.app",
        highlights: ["Precision Timer", "Solve Analysis", "Progress Tracking"]
    },
    {
        title: "Homeo",
        description: "Homeopathy tracking application and reminder system.",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
        github: "https://github.com/sivab193/homeo",
        demo: "https://homeo-taupe.vercel.app",
        highlights: ["Tracking System", "Reminders", "Modern Web Architecture"]
    },
    {
        title: "SplitLLM",
        description: "Gen AI-based expense tracker with bill scanning via Gemini API. Uses graph algorithms to minimize cash flow.",
        technologies: ["Python", "Gemini API", "MongoDB", "React", "Graph Algorithms"],
        github: "https://github.com/orgs/splitllmbill/repositories",
        demo: "https://splitllm.vercel.app",
        highlights: ["Bill Scanning", "Cash Flow Minimization", "AI Chatbot"]
    },
    {
        title: "Cloud-Clip",
        description: "Cross-device clipboard management tool for real-time synchronization. Optimized with custom Firestore indexes.",
        technologies: ["TypeScript", "Firebase", "React", "Firestore"],
        github: "https://github.com/sivab193/cloud-clip-ui",
        demo: "https://cloud-clip.vercel.app",
        highlights: ["Real-time Sync", "Cross-Device", "Optimized Queries"]
    },
    {
        title: "LLMStudio API Gateway",
        description: "Secure API gateway for LMStudio exposing OpenAI-compatible endpoints with JWT auth and rate limiting.",
        technologies: ["TypeScript", "Node.js", "JWT", "Security"],
        github: "https://github.com/sivab193/llmstudio-api-gateway",
        demo: null,
        highlights: ["Secure Gateway", "JWT Auth", "Rate Limiting"]
    },
    {
        title: "Taxi Application",
        description: "C++ application for booking rides, calculating shortest routes using Dijkstra's algorithm, and fare estimation.",
        technologies: ["C++", "SQLite", "Dijkstra's Algorithm"],
        github: null,
        demo: null,
        highlights: ["Route Optimization", "Fare Estimation", "Ride Booking"]
    },
    {
        title: "Encryption in MIPS",
        description: "Encryption program in MIPS assembly converting text to pictorial format using modified Freemasonry Cipher.",
        technologies: ["MIPS Assembly", "Encryption", "Bitmap Interface"],
        github: null,
        demo: null,
        highlights: ["Assembly Language", "Cipher Implementation", "Visual Output"]
    },
    {
        title: "UAV Attack Detection",
        description: "Model to detect video replay attacks on UAVs using shadow analysis and Otsu's thresholding.",
        technologies: ["Image Processing", "Computer Vision", "Security"],
        github: null,
        demo: null,
        highlights: ["Replay Attack Detection", "Shadow Analysis", "Real-time"]
    }
];

const seedDB = async () => {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('personal-website');
        const collection = db.collection('projects');

        // Clear existing collection
        console.log('Clearing existing projects collection...');
        await collection.deleteMany({});

        // Prepare documents using the helper to ensure schema consistency
        console.log('Preparing documents...');
        const documentsToInsert = seedData.map(data => createProject(data));

        // Insert documents
        console.log('Inserting documents...');
        const result = await collection.insertMany(documentsToInsert);

        console.log(`Successfully inserted ${result.insertedCount} projects`);

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await client.close();
        console.log('Connection closed');
    }
};

seedDB();
