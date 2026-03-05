const express = require('express');
const ReadingPractice = require('../models/ReadingPractice');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/reading-practice — Save a reading practice session
router.post('/', auth, requireRole('Student'), async (req, res) => {
    try {
        const { originalText, transcript, mistakes, accuracy, durationSeconds, difficulty } = req.body;

        if (!originalText) {
            return res.status(400).json({ error: 'Original text is required.' });
        }

        const wordCount = originalText.trim().split(/\s+/).filter(Boolean).length;

        const practice = new ReadingPractice({
            studentId: req.userId,
            originalText,
            transcript: transcript || '',
            mistakes: mistakes || [],
            accuracy: typeof accuracy === 'number' ? accuracy : 0,
            durationSeconds: durationSeconds || 0,
            difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
            wordCount,
            completed: true
        });

        await practice.save();
        res.status(201).json({ practice });
    } catch (error) {
        console.error('ReadingPractice error:', error);
        res.status(500).json({ error: 'Server error saving reading practice.' });
    }
});

// GET /api/reading-practice/my — Get student's reading practice history
router.get('/my', auth, requireRole('Student'), async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const practices = await ReadingPractice.find({ studentId: req.userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit, 10))
            .select('-originalText -transcript -mistakes'); // Exclude full text for list view
        res.json({ practices });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/reading-practice/progress — Get aggregated progress for dashboard
router.get('/progress', auth, requireRole('Student'), async (req, res) => {
    try {
        const practices = await ReadingPractice.find({ studentId: req.userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .select('accuracy durationSeconds difficulty wordCount createdAt');

        const totalSessions = practices.length;
        const avgAccuracy = totalSessions > 0
            ? practices.reduce((s, p) => s + p.accuracy, 0) / totalSessions
            : 0;
        const recentAccuracy = practices.slice(0, 7).map(p => ({
            date: p.createdAt,
            accuracy: p.accuracy,
            words: p.wordCount
        }));

        res.json({
            totalSessions,
            avgAccuracy,
            recentSessions: recentAccuracy,
            byDifficulty: {
                easy: practices.filter(p => p.difficulty === 'easy').length,
                medium: practices.filter(p => p.difficulty === 'medium').length,
                hard: practices.filter(p => p.difficulty === 'hard').length,
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
