import { getDB } from '../db.js';
import { createProject } from '../models/projectModel.js';

const GITHUB_USERNAME = 'sivab193';
const API_BASE = 'https://api.github.com';

/**
 * Calculates a score for the README based on length and standard sections.
 * @param {string} content Base64 encoded README content or raw text
 * @returns {number} Score from 0 to 100
 */
const calculateReadmeScore = (content) => {
    if (!content) return 0;

    // GitHub API returns base64 for readme contents usually. We need to decode it if it's base64.
    // A simple heuristic: if it contains spaces or markdown characters, it's likely raw text.
    // If not, try to decode it.
    let text = content;
    try {
        // Attempt base64 decode if it looks like base64 (no spaces, etc)
        if (!/\s/.test(content)) {
            text = Buffer.from(content, 'base64').toString('utf-8');
        }
    } catch (e) {
        // Ignore, assume it's already text
    }

    let score = 0;
    const lowerText = text.toLowerCase();

    // 1. Length Bonus (up to 40 points)
    // 500 characters = 10 pts, 2000+ characters = 40 pts
    const lengthScore = Math.min(40, Math.floor(text.length / 50));
    score += lengthScore;

    // 2. Contains Images/Badges (up to 20 points)
    const imageCount = (text.match(/!\[.*?\]\(.*?\)/g) || []).length + (text.match(/<img.*?>/g) || []).length;
    score += Math.min(20, imageCount * 10);

    // 3. Has Standard Sections (up to 40 points)
    const sections = ['features', 'installation', 'usage', 'tech', 'api', 'license', 'getting started'];
    let sectionCount = 0;
    for (const sec of sections) {
        // Look for headings: # Features or ## Features
        const regex = new RegExp(`^#{1,4}\\s+.*${sec}.*$`, 'm');
        if (regex.test(lowerText)) {
            sectionCount++;
        }
    }
    // 10 pts per standard section found, max 40
    score += Math.min(40, sectionCount * 10);

    return score;
};

export const syncGithubProjects = async () => {
    try {
        const collection = getDB().collection('projects');

        console.log(`Fetching repositories for ${GITHUB_USERNAME}...`);

        // Use a GitHub token if provided to increase rate limits
        const headers = {
            'User-Agent': 'Portfolio-Backend-Sync',
            'Accept': 'application/vnd.github.v3+json'
        };

        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
        }

        const response = await fetch(`${API_BASE}/users/${GITHUB_USERNAME}/repos?per_page=100&type=owner`, { headers });

        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
        }

        const repos = await response.json();
        const results = [];

        console.log(`Found ${repos.length} repositories.`);

        for (const repo of repos) {
            // Skip forks if desired
            if (repo.fork) continue;

            // Default project mapping
            const projectData = {
                title: repo.name,
                description: repo.description || 'No description provided.',
                technologies: repo.topics || [],
                github: repo.html_url,
                demo: repo.homepage || null,
                highlights: [],
                visible: true
            };

            // Default languages if topics are empty (GitHub provides primary language)
            if (projectData.technologies.length === 0 && repo.language) {
                projectData.technologies.push(repo.language);
            }

            // Fetch README for score
            let readmeScore = 0;
            try {
                const readmeRes = await fetch(`${API_BASE}/repos/${GITHUB_USERNAME}/${repo.name}/readme`, { headers });
                if (readmeRes.ok) {
                    const readmeData = await readmeRes.json();
                    readmeScore = calculateReadmeScore(readmeData.content);
                }
            } catch (err) {
                console.warn(`Could not fetch README for ${repo.name}`);
            }

            // Upsert Logic
            try {
                // Check if project exists by github URL or title
                const existing = await collection.findOne({
                    $or: [
                        { github: projectData.github },
                        { title: projectData.title }
                    ]
                });

                if (existing) {
                    // Update descriptions and URLs but leave explicit user choices (highlights, technologies if they modified them manually)
                    await collection.updateOne(
                        { _id: existing._id },
                        {
                            $set: {
                                description: projectData.description,
                                demo: projectData.demo || existing.demo,
                                updatedAt: new Date()
                            }
                        }
                    );
                    results.push({ name: repo.name, status: 'updated', readmeScore });
                } else {
                    // Create new
                    const newProject = createProject(projectData);
                    await collection.insertOne(newProject);
                    results.push({ name: repo.name, status: 'inserted', readmeScore });
                }
            } catch (dbErr) {
                console.error(`DB error for ${repo.name}:`, dbErr.message);
                results.push({ name: repo.name, status: 'error', error: dbErr.message });
            }
        }

        return {
            success: true,
            message: `Processed ${repos.length} repositories`,
            results
        };

    } catch (error) {
        console.error('Error syncing GitHub projects:', error);
        throw error;
    }
};
