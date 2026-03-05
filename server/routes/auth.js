const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        if (!['Student', 'Parent', 'Teacher'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        const user = new User({ name, email, password, role });
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                interests: user.interests,
                themePreference: user.themePreference,
                cognitiveProfile: user.cognitiveProfile,
                onboardingComplete: user.onboardingComplete
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                interests: user.interests,
                themePreference: user.themePreference,
                cognitiveProfile: user.cognitiveProfile,
                onboardingComplete: user.onboardingComplete
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        res.json({
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                interests: req.user.interests,
                themePreference: req.user.themePreference,
                cognitiveProfile: req.user.cognitiveProfile,
                onboardingComplete: req.user.onboardingComplete,
                linkedStudents: req.user.linkedStudents,
                linkedParent: req.user.linkedParent
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
