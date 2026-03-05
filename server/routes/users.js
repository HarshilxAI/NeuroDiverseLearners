const express = require('express');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// PUT /api/users/profile — Update user profile (interests, theme, etc.)
router.put('/profile', auth, async (req, res) => {
    try {
        const { interests, themePreference, onboardingComplete, name } = req.body;
        const updates = {};

        if (interests !== undefined) updates.interests = interests;
        if (themePreference !== undefined) updates.themePreference = themePreference;
        if (onboardingComplete !== undefined) updates.onboardingComplete = onboardingComplete;
        if (name !== undefined) updates.name = name;

        const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Server error updating profile.' });
    }
});

// PUT /api/users/cognitive-profile — Update cognitive profile after diagnostic
router.put('/cognitive-profile', auth, async (req, res) => {
    try {
        const { cognitiveProfile } = req.body;
        if (!['ADHD', 'Dyslexia', 'Typical'].includes(cognitiveProfile)) {
            return res.status(400).json({ error: 'Invalid cognitive profile.' });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { cognitiveProfile },
            { new: true }
        );
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/users/students — Teacher gets all linked students
router.get('/students', auth, requireRole('Teacher'), async (req, res) => {
    try {
        const students = await User.find({ role: 'Student' })
            .select('name email cognitiveProfile interests onboardingComplete')
            .sort({ name: 1 });
        res.json({ students });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/users/my-students — Parent gets linked students
router.get('/my-students', auth, requireRole('Parent'), async (req, res) => {
    try {
        const parent = await User.findById(req.userId).populate('linkedStudents', 'name email cognitiveProfile interests');
        res.json({ students: parent.linkedStudents || [] });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/users/link-student — Parent links a student by email
router.post('/link-student', auth, requireRole('Parent'), async (req, res) => {
    try {
        const { studentEmail } = req.body;
        const student = await User.findOne({ email: studentEmail, role: 'Student' });

        if (!student) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        await User.findByIdAndUpdate(req.userId, {
            $addToSet: { linkedStudents: student._id }
        });

        await User.findByIdAndUpdate(student._id, {
            linkedParent: req.userId
        });

        res.json({ message: 'Student linked successfully.', student: { name: student.name, email: student.email } });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/users/teachers — Get teachers for parent chat
router.get('/teachers', auth, async (req, res) => {
    try {
        const teachers = await User.find({ role: 'Teacher' }).select('name email');
        res.json({ teachers });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/users/parents — Get parents for teacher chat
router.get('/parents', auth, requireRole('Teacher'), async (req, res) => {
    try {
        const parents = await User.find({ role: 'Parent' }).select('name email');
        res.json({ parents });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
