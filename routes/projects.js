import express from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../db.js';
import { createProject, updateProjectData } from '../models/projectModel.js';

const router = express.Router();

// Helper to get projects collection
const getCollection = () => getDB().collection('projects');

// GET /api/projects - Get all visible projects
router.get('/', async (req, res) => {
    try {
        const projects = await getCollection()
            .find({ visible: true })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(projects);
    } catch (error) {
        console.error('Error fetching visible projects:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/projects/all - Get all projects (visible and hidden)
router.get('/all', async (req, res) => {
    try {
        const projects = await getCollection()
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        res.json(projects);
    } catch (error) {
        console.error('Error fetching all projects:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/projects - Add new project
router.post('/', async (req, res) => {
    try {
        const project = createProject(req.body);
        const result = await getCollection().insertOne(project);
        res.status(201).json({ ...project, _id: result.insertedId });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH /api/projects/:id/visibility - Update visibility
router.patch('/:id/visibility', async (req, res) => {
    try {
        const { id } = req.params;
        const { visible } = req.body;

        if (typeof visible !== 'boolean') {
            return res.status(400).json({ message: 'Visible must be a boolean' });
        }

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const result = await getCollection().updateOne(
            { _id: new ObjectId(id) },
            { $set: { visible, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({ message: 'Visibility updated successfully' });
    } catch (error) {
        console.error('Error updating visibility:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PATCH /api/projects/:id - Update project info
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const updateDoc = updateProjectData(req.body);

        const result = await getCollection().updateOne(
            { _id: new ObjectId(id) },
            updateDoc
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({ message: 'Project updated successfully' });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const result = await getCollection().deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
