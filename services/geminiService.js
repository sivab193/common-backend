import { GoogleGenAI } from '@google/genai';

let ai = null;
const getAI = () => {
    if (!ai) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set in the environment variables.");
        }
        ai = new GoogleGenAI({});
    }
    return ai;
};

/**
 * Analyzes a GitHub README and generates project data matching the MongoDB schema.
 * 
 * @param {string} readmeText The parsed markdown/text of the README
 * @param {string} repoName The name of the repository
 * @param {string} repoUrl The GitHub URL
 * @returns {Promise<Object>} An object containing { title, description, technologies, highlights }
 */
export const generateProjectDataFromReadme = async (readmeText, repoName, repoUrl) => {
    try {
        const geminiAi = getAI();
        const prompt = `
You are an expert technical writer and AI assistant that processes GitHub README files and converts them into standardized JSON data for a developer portfolio database.

I will provide you with the README content for a repository named "${repoName}" located at "${repoUrl}".

Please extract or infer the following fields to exactly match this JSON structure:
{
    "title": "A clean, reader-friendly title for the project (do not just use the raw repo name unless it's already clean)",
    "description": "A well-written, professional 2-3 sentence summary of what this project does and what it's for. If the README is very short, infer the best you can based on the repo name and content.",
    "technologies": ["List", "of", "technologies", "frameworks", "tools", "languages", "used in the project"],
    "highlights": ["3 to 5", "bullet points", "highlighting the key features", "or technical accomplishments"]
}

Rules:
1. ONLY return valid JSON. Do not include markdown wrappers like \`\`\`json.
2. If the README is completely empty or extremely short, infer a basic description and use your best judgment for technologies (e.g., if it says Node, include Node.js).
3. Ensure highlights are concise and professional.
4. If you cannot determine technologies, return an empty array for that field.

README CONTENT REPOSITORY "${repoName}":
---
${readmeText.substring(0, 15000) /* Limit to prevent token overflow if README is massive */}
---
`;

        const response = await geminiAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2, // Keep it deterministic
                responseMimeType: 'application/json' // Force JSON response
            }
        });

        const rawText = response.text;

        // Ensure we parse it safely, stripping out anything that isn't JSON
        const cleanJsonString = rawText.replace(/```json\n?|```/g, '').trim();
        const data = JSON.parse(cleanJsonString);

        return {
            title: data.title || repoName,
            description: data.description || 'No description provided.',
            technologies: Array.isArray(data.technologies) ? data.technologies : [],
            highlights: Array.isArray(data.highlights) ? data.highlights : []
        };

    } catch (error) {
        console.error(`Error generating data from Gemini for ${repoName}:`, error.message);
        // Fallback to basic data on failure
        return {
            title: repoName,
            description: 'Could not generate description from README.',
            technologies: [],
            highlights: []
        };
    }
};
