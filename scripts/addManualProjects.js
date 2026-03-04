import { connectDB, getDB } from '../db.js';
import { createProject } from '../models/projectModel.js';

// Define any manual projects here that are NOT on GitHub
// Example below
const manualProjects = [
    {
        "title": "ZeroHour",
        "category": "Full-Stack & Cloud",
        "featured": true,
        "description": "Engineered a high-precision event countdown PWA with a complex timezone synchronization engine and offline-first capabilities. Leverages Firebase for scalable, dynamically generated public profile pages.",
        "technologies": ["Next.js", "React", "TypeScript", "Firebase", "Tailwind CSS", "Framer Motion"],
        "github": "https://github.com/sivab193/ZeroHour",
        "demo": "https://zh.siv19.dev",
        "highlights": ["Timezone Sync Engine", "Offline-First PWA", "Dynamic OG Generation"]
    },
    {
        "title": "SplitLLM",
        "category": "AI & Machine Learning",
        "featured": true,
        "description": "Built an intelligent expense settlement engine using the Gemini API for receipt parsing. Implemented graph-based flow network algorithms to optimize and minimize peer-to-peer transaction volumes.",
        "technologies": ["Python", "Gemini API", "MongoDB", "React", "Graph Algorithms"],
        "github": "https://github.com/orgs/splitllmbill/repositories",
        "demo": "https://splitllm.vercel.app",
        "highlights": ["Graph Flow Optimization", "LLM Parsing Engine", "State Management"]
    },
    {
        "title": "Cloud-Clip",
        "category": "Full-Stack & Cloud",
        "featured": true,
        "description": "Architected a cross-device clipboard management tool for real-time synchronization. Optimized data retrieval using custom Firestore indexing and real-time document listeners.",
        "technologies": ["TypeScript", "Firebase", "React", "Firestore"],
        "github": "https://github.com/sivab193/cloud-clip-ui",
        "demo": "https://cloud-clip.vercel.app",
        "highlights": ["Multi-Client State Sync", "Firestore Index Optimization", "Real-Time Listeners"]
    },
    {
        "title": "Short-GPT",
        "category": "AI & Machine Learning",
        "featured": true,
        "description": "Developed a decoder-only transformer for shortest path prediction in graphs. Investigated algorithmic alignment via Reinforcement Learning, demonstrating improved pathing accuracy over standard supervised pretraining.",
        "technologies": ["Python", "PyTorch", "Transformers", "Reinforcement Learning"],
        "github": "https://github.com/MaxNickell/Short-GPT",
        "demo": null,
        "highlights": ["Transformer Architecture", "RL Finetuning", "Algorithmic Alignment"]
    },
    {
        "title": "LLMStudio API Gateway",
        "category": "Systems & Security",
        "featured": true,
        "description": "Designed a secure reverse proxy architecture for LMStudio, exposing OpenAI-compatible endpoints protected by JWT authentication and strict request rate limiting.",
        "technologies": ["TypeScript", "Node.js", "JWT", "Security"],
        "github": "https://github.com/sivab193/llmstudio-api-gateway",
        "demo": null,
        "highlights": ["Reverse Proxy Architecture", "JWT Authentication", "Throttling & Rate Limits"]
    },
    {
        "title": "CityBus Bot",
        "category": "Cloud & Automation",
        "featured": true,
        "description": "Developed a low-latency Telegram bot serving real-time transit telemetry for the Purdue and Greater Lafayette transit system, featuring fuzzy-search optimization and automated push alerts.",
        "technologies": ["Python", "GTFS", "Telegram API", "Google Cloud"],
        "github": "https://github.com/sivab193/citybus-bot",
        "demo": null,
        "highlights": ["Telemetry Ingestion", "Fuzzy Search Heuristics", "Event-Driven Alerts"]
    },
    {
        "title": "Speed Cuber",
        "category": "Full-Stack & Cloud",
        "featured": false,
        "description": "Specialized speed cubing platform featuring a precision timer built for competition standards, solve history tracking, and detailed performance analytics for 2x2 cubes and beyond.",
        "technologies": ["Next.js", "TypeScript", "CSS", "shadcn/ui"],
        "github": "https://github.com/sivab193/speed-cuber",
        "demo": "https://v0-speed-cubing-website.vercel.app",
        "highlights": ["WCA-Compliant Timer", "Solve Analytics", "Performance Tracking"]
    },
    {
        "title": "Movies Tracker",
        "category": "Full-Stack & Cloud",
        "featured": false,
        "description": "Comprehensive movie watch history tracker featuring a global leaderboard, TitleCard timer, and granular user privacy controls over shared data.",
        "technologies": ["TypeScript", "Next.js", "Python", "Vercel"],
        "github": "https://github.com/sivab193/movies-tracker",
        "demo": "https://m19t.vercel.app/",
        "highlights": ["State Management", "Global Leaderboard Logic", "Granular Access Control"]
    },
    {
        "title": "Statify",
        "category": "Full-Stack & Cloud",
        "featured": false,
        "description": "Spotify statistics dashboard providing insights into listening habits, top artists, and tracks, utilizing a modern UI and secure OAuth 2.0 flows.",
        "technologies": ["Next.js", "TypeScript", "Tailwind CSS", "Spotify API"],
        "github": "https://github.com/sivab193/statify",
        "demo": "https://s19.vercel.app",
        "highlights": ["OAuth 2.0 Auth Flow", "Data Visualization", "REST API Integration"]
    },
    {
        "title": "Homeo",
        "category": "Full-Stack & Cloud",
        "featured": false,
        "description": "Homeopathy tracking application and scheduling system built on a modern web architecture for reliable user reminders.",
        "technologies": ["Next.js", "TypeScript", "Tailwind CSS"],
        "github": "https://github.com/sivab193/homeo",
        "demo": "https://homeo-taupe.vercel.app",
        "highlights": ["CRON Scheduling", "State Management", "PWA Architecture"]
    },
    {
        "title": "UAV Attack Detection",
        "category": "Systems & Security",
        "featured": false,
        "description": "Computer vision model engineered to detect video replay attacks on UAVs utilizing shadow analysis heuristics and Otsu's thresholding techniques.",
        "technologies": ["Image Processing", "Computer Vision", "Security"],
        "github": null,
        "demo": null,
        "highlights": ["Shadow Analysis Heuristics", "Otsu's Thresholding", "Real-Time Processing"]
    },
    {
        "title": "Taxi Application",
        "category": "Foundations",
        "featured": false,
        "description": "C++ application for booking rides and estimating fares, utilizing Dijkstra's algorithm for shortest-path graph traversal and route optimization.",
        "technologies": ["C++", "SQLite", "Dijkstra's Algorithm"],
        "github": null,
        "demo": null,
        "highlights": ["Graph Traversal", "Resource Optimization", "Memory Management"]
    },
    {
        "title": "Encryption in MIPS",
        "category": "Foundations",
        "featured": false,
        "description": "Low-level encryption program written in MIPS assembly, converting text to pictorial formats via a modified Freemasonry Cipher and bitmap interfacing.",
        "technologies": ["MIPS Assembly", "Encryption", "Bitmap Interface"],
        "github": null,
        "demo": null,
        "highlights": ["Low-Level Architecture", "Cipher Implementation", "Memory Addressing"]
    }
];

const run = async () => {
    try {
        await connectDB();
        const collection = getDB().collection('projects');

        console.log(`Inserting ${manualProjects.length} manual projects...`);

        for (const pd of manualProjects) {
            // Upsert based on title so we don't insert duplicates if run twice
            const existing = await collection.findOne({ title: pd.title });

            if (existing) {
                console.log(`Project '${pd.title}' already exists. Skipping.`);
            } else {
                // If no github URL, ensure visible is false
                const pdToInsert = { ...pd };
                delete pdToInsert.featured; // Ignore featured as requested
                if (!pdToInsert.github) {
                    pdToInsert.visible = false;
                }

                const newProject = createProject(pdToInsert);
                await collection.insertOne(newProject);
                console.log(`Inserted manual project: '${pd.title}'`);
            }
        }

        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error("Error inserting manual projects:", e.message);
        process.exit(1);
    }
};

run();
