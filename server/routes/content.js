const express = require('express');
const Content = require('../models/Content');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/content — Teacher uploads content
router.post('/', auth, requireRole('Teacher'), async (req, res) => {
    try {
        const { title, originalText, topicTag, difficulty, recommendedFor } = req.body;

        if (!title || !originalText || !topicTag) {
            return res.status(400).json({ error: 'Title, text, and topic tag are required.' });
        }

        const validDifficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
        const validRecommended = Array.isArray(recommendedFor)
            ? recommendedFor.filter(r => ['ADHD', 'Dyslexia', 'Typical'].includes(r))
            : ['ADHD', 'Dyslexia', 'Typical'];
        if (validRecommended.length === 0) validRecommended.push('ADHD', 'Dyslexia', 'Typical');

        const content = new Content({
            title,
            originalText,
            topicTag,
            difficulty: validDifficulty,
            recommendedFor: validRecommended,
            uploadedBy: req.userId
        });

        await content.save();
        res.status(201).json({ content });
    } catch (error) {
        res.status(500).json({ error: 'Server error saving content.' });
    }
});

// GET /api/content — Get all content (for students and teachers)
router.get('/', auth, async (req, res) => {
    try {
        const filter = {};
        if (req.query.topic) filter.topicTag = req.query.topic;
        if (req.query.difficulty) filter.difficulty = req.query.difficulty;

        const contents = await Content.find(filter)
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ contents });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/content/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const content = await Content.findById(req.params.id).populate('uploadedBy', 'name');
        if (!content) return res.status(404).json({ error: 'Content not found.' });
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// DELETE /api/content/:id — Teacher deletes own content
router.delete('/:id', auth, requireRole('Teacher'), async (req, res) => {
    try {
        const content = await Content.findOneAndDelete({ _id: req.params.id, uploadedBy: req.userId });
        if (!content) return res.status(404).json({ error: 'Content not found or not authorized.' });
        res.json({ message: 'Content deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
