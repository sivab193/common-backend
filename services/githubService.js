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

        const htmlUrls = repos.map(r => r.html_url);
        const names = repos.map(r => r.name);

        const existingProjects = await collection.find({
            $or: [
                { github: { $in: htmlUrls } },
                { title: { $in: names } }
            ]
        }).toArray();

        const existingProjectsByGithub = new Map();
        const existingProjectsByName = new Map();

        for (const p of existingProjects) {
            if (p.github) existingProjectsByGithub.set(p.github, p);
            if (p.title) existingProjectsByName.set(p.title, p);
        }

        const bulkOperations = [];

        for (const repo of repos) {
            try {
                // 1. Check if project already exists
                const existing = existingProjectsByGithub.get(repo.html_url) || existingProjectsByName.get(repo.name);

                if (existing) {
                    const repoPushedAt = repo.pushed_at ? new Date(repo.pushed_at) : null;
                    const existingCommit = existing.lastCommitTimestamp ? new Date(existing.lastCommitTimestamp) : null;

                    const isSameCommit = repoPushedAt && existingCommit && repoPushedAt.getTime() === existingCommit.getTime();

                    if (isSameCommit) {
                        results.push({ name: repo.name, status: 'skipped_no_new_commits' });
                    } else {
                        // Update timestamp, commit tracking, AND set visible to true
                        bulkOperations.push({
                            updateOne: {
                                filter: { _id: existing._id },
                                update: {
                                    $set: {
                                        updatedAt: new Date(),
                                        lastCommitTimestamp: repoPushedAt,
                                        visible: true
                                    }
                                }
                            }
                        });
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
                    bulkOperations.push({
                        insertOne: {
                            document: newProject
                        }
                    });
                    results.push({ name: repo.name, status: 'inserted' });
                }
            } catch (dbErr) {
                console.error(`DB error for ${repo.name}:`, dbErr.message);
                results.push({ name: repo.name, status: 'error', error: dbErr.message });
            }
        }

        if (bulkOperations.length > 0) {
            await collection.bulkWrite(bulkOperations, { ordered: false });
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
