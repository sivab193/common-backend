import { getDB } from '../db.js';
import { createProject } from '../models/projectModel.js';

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
                        // Update timestamp, commit tracking, AND set visible to true
                        await collection.updateOne(
                            { _id: existing._id },
                            {
                                $set: {
                                    updatedAt: new Date(),
                                    lastCommitTimestamp: repoPushedAt,
                                    visible: true
                                }
                            }
                        );
                        results.push({ name: repo.name, status: 'updated_timestamp' });
                    }
                } else {
                    // 2. If it's a new project, map it directly from the GitHub payload
                    console.log(`New repo found: ${repo.name}. Generating initial data.`);

                    const projectData = {
                        title: repo.name,
                        description: repo.description || 'No description provided.',
                        technologies: [],
                        highlights: repo.topics || [], // User mapping: topics to highlights
                        github: repo.html_url,
                        demo: repo.homepage || null,
                        category: null, // Manually populated later
                        visible: false, // Default hidden so user can manually update title/tech first
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
