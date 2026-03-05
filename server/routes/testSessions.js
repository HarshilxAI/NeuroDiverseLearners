const express = require('express');
const TestSession = require('../models/TestSession');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/test-sessions — Create a new test session with behavior data
router.post('/', auth, requireRole('Student'), async (req, res) => {
    try {
        const { rawBehaviorData, textContent } = req.body;

        // Require minimum reading time (45 seconds) for reliable analysis
        const minTimeMs = 45000;
        if (rawBehaviorData?.totalTimeMs < minTimeMs) {
            return res.status(400).json({ error: 'Please read for at least 45 seconds before submitting. Take your time to read the passage naturally.' });
        }

        // Calculate CLI (Cognitive Load Index) from behavior data
        const { volatilityScore, frictionScore, dwellVariance } = calculateScores(rawBehaviorData);

        const cli = calculateCLI(volatilityScore, frictionScore, dwellVariance);
        const resultProfile = determineProfile(volatilityScore, frictionScore, dwellVariance);

        const session = new TestSession({
            studentId: req.userId,
            rawBehaviorData: {
                ...rawBehaviorData,
                volatilityScore,
                frictionScore,
                dwellVariance
            },
            calculatedCLI: cli,
            resultProfile,
            textContent,
            completed: true
        });

        await session.save();

        // Update user's cognitive profile and mark onboarding complete
        await User.findByIdAndUpdate(req.userId, { cognitiveProfile: resultProfile, onboardingComplete: true });

        res.status(201).json({ session, resultProfile, cli });
    } catch (error) {
        console.error('TestSession error:', error);
        res.status(500).json({ error: 'Server error saving test session.' });
    }
});

// GET /api/test-sessions/my — Get student's own sessions
router.get('/my', auth, requireRole('Student'), async (req, res) => {
    try {
        const sessions = await TestSession.find({ studentId: req.userId })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ sessions });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/test-sessions/student/:id — Teacher/Parent views student sessions
router.get('/student/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Teacher' && req.user.role !== 'Parent') {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const sessions = await TestSession.find({ studentId: req.params.id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ sessions });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// --- Scoring functions (calibrated for accurate ADHD vs Dyslexia detection) ---

function calculateScores(data) {
    const {
        mouseMovements = 0,
        rapidClicks = 0,
        reReadingCount = 0,
        scrollReversals = 0,
        paragraphDwellTimes = [],
        totalTimeMs = 1,
        cameraMotionScore = 0,
        audioVariabilityScore = 0
    } = data;

    const minutes = Math.max(0.5, totalTimeMs / 60000);

    // ADHD indicators: restlessness, rapid/frequent movements, impulsivity, difficulty sustaining focus
    // Normalize per minute - typical: ~20-50 mouse events/min, ADHD: 100+
    const mousePerMin = mouseMovements / minutes;
    const clicksPerMin = rapidClicks / minutes;
    const volatilityFromMouse = Math.min(1, mousePerMin / 150);
    const volatilityFromClicks = Math.min(1, clicksPerMin / 8);
    const volatilityScore = Math.min(1, (volatilityFromMouse * 0.4 + volatilityFromClicks * 0.4 + (cameraMotionScore || 0) * 0.2));

    // Dyslexia indicators: re-reading, backtracking, uneven pacing (struggling with word decoding)
    // Typical: 0-1 re-reads per min; Dyslexia: 3+ re-reads, many scroll reversals
    const reReadsPerMin = reReadingCount / minutes;
    const reversalsPerMin = scrollReversals / minutes;
    const frictionScore = Math.min(1, reReadsPerMin * 0.4 + reversalsPerMin * 0.15);

    // Dwell variance: dyslexia causes uneven time per paragraph (some words harder)
    let dwellVariance = 0;
    if (paragraphDwellTimes.length > 1) {
        const valid = paragraphDwellTimes.filter(t => t > 0);
        if (valid.length > 1) {
            const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
            const variance = valid.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / valid.length;
            dwellVariance = Math.min(1, (Math.sqrt(variance) / (mean || 1)) * 0.8);
        }
    }

    return { volatilityScore, frictionScore, dwellVariance };
}

function calculateCLI(volatility, friction, dwellVar) {
    return Math.min(1, Math.max(0, volatility * 0.35 + friction * 0.40 + dwellVar * 0.25));
}

function determineProfile(volatility, friction, dwellVar) {
    // ADHD: high restlessness/volatility, relatively lower friction
    if (volatility >= 0.45 && volatility > friction && friction < 0.6) return 'ADHD';
    // Dyslexia: high re-reading/friction, uneven dwell; volatility can be moderate
    if (friction >= 0.4 && (friction > volatility || dwellVar >= 0.35)) return 'Dyslexia';
    // Mixed or borderline: if both high, favor Dyslexia (reading-specific)
    if (friction >= 0.5 && volatility >= 0.4) return 'Dyslexia';
    return 'Typical';
}

module.exports = router;
