import { connectDB, getDB } from '../db.js';

/**
 * Helper Script to quickly update the "technologies" array for your synced repositories.
 * 
 * Instructions:
 * 1. Find the github URL of the synced project you want to update.
 * 2. Add an array of exactly what you want the "technologies" field to be. (Max 5 recommended).
 * 3. Run: `node scripts/updateTechnologies.js`
 */

const updates = [
    {
        github: "https://github.com/sivab193/home-away-weather",
        technologies: ["React Native", "Expo", "OpenWeather API"]
    },
    {
        github: "https://github.com/sivab193/cloud-clip-ui",
        technologies: ["Next.js", "TailwindCSS", "React"]
    }
    // Add more here...
];

const run = async () => {
    try {
        await connectDB();
        const collection = getDB().collection('projects');

        console.log(`Processing ${updates.length} technology updates...`);

        let updatedCount = 0;
        for (const item of updates) {
            if (!item.github || !Array.isArray(item.technologies)) {
                console.error(`Invalid formatting for payload: ${JSON.stringify(item)}`);
                continue;
            }

            const result = await collection.updateOne(
                { github: item.github },
                { $set: { technologies: item.technologies, updatedAt: new Date() } }
            );

            if (result.matchedCount > 0) {
                console.log(`Updated technologies for ${item.github}`);
                updatedCount++;
            } else {
                console.warn(`Could not find project with github URL: ${item.github}`);
            }
        }

        console.log(`Successfully updated ${updatedCount} projects.`);
        process.exit(0);
    } catch (e) {
        console.error("Error updating technologies:", e.message);
        process.exit(1);
    }
};

run();
