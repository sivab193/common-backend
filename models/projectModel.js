import { ObjectId } from 'mongodb';
import { validateProjectInput, normalizeString, normalizeArray } from '../utils/validation.js';

export const createProject = (data) => {
    const errors = validateProjectInput(data);
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }

    const now = new Date();

    return {
        _id: new ObjectId(),
        title: normalizeString(data.title),
        description: normalizeString(data.description),
        technologies: normalizeArray(data.technologies),
        github: normalizeString(data.github),
        demo: normalizeString(data.demo),
        category: normalizeString(data.category),
        highlights: normalizeArray(data.highlights),
        visible: data.visible !== undefined ? data.visible : true,
        lastCommitTimestamp: data.lastCommitTimestamp ? new Date(data.lastCommitTimestamp) : null,
        createdAt: now,
        updatedAt: now
    };
};

export const updateProjectData = (data) => {
    const updateDoc = {
        updatedAt: new Date()
    };

    if (data.description !== undefined) {
        if (typeof data.description !== 'string') throw new Error('Description must be a string');
        updateDoc.description = data.description.trim();
    }

    if (data.technologies !== undefined) {
        if (!Array.isArray(data.technologies) || !data.technologies.every(t => typeof t === 'string')) {
            throw new Error('Technologies must be an array of strings');
        }
        updateDoc.technologies = data.technologies.map(t => t.trim());
    }

    if (data.github !== undefined) {
        if (data.github !== null && typeof data.github !== 'string') throw new Error('Github must be a string or null');
        updateDoc.github = data.github ? data.github.trim() : null;
    }

    if (data.demo !== undefined) {
        if (data.demo !== null && typeof data.demo !== 'string') throw new Error('Demo must be a string or null');
        updateDoc.demo = data.demo ? data.demo.trim() : null;
    }

    if (data.category !== undefined) {
        if (data.category !== null && typeof data.category !== 'string') throw new Error('Category must be a string or null');
        updateDoc.category = data.category ? data.category.trim() : null;
    }

    if (data.highlights !== undefined) {
        if (!Array.isArray(data.highlights) || !data.highlights.every(h => typeof h === 'string')) {
            throw new Error('Highlights must be an array of strings');
        }
        updateDoc.highlights = data.highlights.map(h => h.trim());
    }

    if (data.lastCommitTimestamp !== undefined) {
        updateDoc.lastCommitTimestamp = data.lastCommitTimestamp ? new Date(data.lastCommitTimestamp) : null;
    }

    return { $set: updateDoc };
};
