import { getDB } from '../db.js';
import { createProject } from '../models/projectModel.js';
import { generateProjectDataFromReadme } from './geminiService.js';

const GITHUB_USERNAME = 'sivab193';
const API_BASE = 'https://api.github.com';

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
            try {
                // 1. Check if project already exists
                const existing = await collection.findOne({
                    $or: [
                        { github: repo.html_url },
                        { title: repo.name }
                    ]
                });

                if (existing) {
                    const repoPushedAt = repo.pushed_at ? new Date(repo.pushed_at) : null;
                    const existingCommit = existing.lastCommitTimestamp ? new Date(existing.lastCommitTimestamp) : null;

                    const isSameCommit = repoPushedAt && existingCommit && repoPushedAt.getTime() === existingCommit.getTime();

                    if (isSameCommit) {
                        results.push({ name: repo.name, status: 'skipped_no_new_commits' });
                    } else {
                        // Update timestamp and commit tracking
                        await collection.updateOne(
                            { _id: existing._id },
                            {
                                $set: {
                                    updatedAt: new Date(),
                                    lastCommitTimestamp: repoPushedAt
                                }
                            }
                        );
                        results.push({ name: repo.name, status: 'updated_timestamp' });
                    }
                } else {
                    // 2. If it's a new project, fetch README and generate with Gemini
                    console.log(`New repo found: ${repo.name}. Fetching README...`);

                    let readmeContent = '';
                    try {
                        const readmeRes = await fetch(`${API_BASE}/repos/${GITHUB_USERNAME}/${repo.name}/readme`, { headers });
                        if (readmeRes.ok) {
                            const readmeData = await readmeRes.json();
                            // Decode base64 if necessary
                            if (!/\\s/.test(readmeData.content)) {
                                readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
                            } else {
                                readmeContent = readmeData.content;
                            }
                        }
                    } catch (err) {
                        console.warn(`Could not fetch README for ${repo.name}`);
                    }

                    // 3. Generate structured data using Gemini
                    // Fallback to basic data if no README or Gemini fails
                    let generatedData = {
                        title: repo.name,
                        description: repo.description || 'No description provided.',
                        technologies: repo.topics || [],
                        highlights: []
                    };

                    if (readmeContent) {
                        try {
                            const geminiData = await generateProjectDataFromReadme(readmeContent, repo.name, repo.html_url);
                            // Merge in generated data gracefully
                            generatedData = {
                                title: geminiData.title || generatedData.title,
                                description: geminiData.description || generatedData.description,
                                // Prefer extracted technologies, but fallback to GitHub topics
                                technologies: geminiData.technologies?.length > 0 ? geminiData.technologies : (repo.topics || []),
                                highlights: geminiData.highlights || []
                            };
                        } catch (err) {
                            console.error(`Gemini calculation failed for ${repo.name}`, err);
                        }
                    }

                    // Fallback for empty tech stack: use primary language
                    if (generatedData.technologies.length === 0 && repo.language) {
                        generatedData.technologies.push(repo.language);
                    }

                    const projectData = {
                        title: generatedData.title,
                        description: generatedData.description,
                        technologies: generatedData.technologies,
                        github: repo.html_url,
                        demo: repo.homepage || null,
                        highlights: generatedData.highlights,
                        visible: true,
                        lastCommitTimestamp: repo.pushed_at
                    };

                    const newProject = createProject(projectData);
                    await collection.insertOne(newProject);
                    results.push({ name: repo.name, status: 'inserted' });
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
