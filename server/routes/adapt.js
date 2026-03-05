const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/adapt — Adapt/simplify text using AI
// This is a mock endpoint that simulates AI text adaptation
// In production, replace with actual LLM API call (OpenAI, etc.)
router.post('/', auth, async (req, res) => {
    try {
        const { text, mode } = req.body; // mode: 'simplify' | 'summarize' | 'bullets'

        if (!text) {
            return res.status(400).json({ error: 'Text is required.' });
        }

        // Simulated AI response — in production, call an LLM API here
        const simplified = simplifyText(text);
        const bullets = extractBullets(text);
        const keywords = extractKeywords(text);

        res.json({
            simplified,
            bullets,
            keyKeywords: keywords,
            original: text
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during text adaptation.' });
    }
});

// Mock simplification logic
function simplifyText(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    return sentences
        .map(s => {
            const words = s.trim().split(/\s+/);
            if (words.length > 15) {
                return words.slice(0, 12).join(' ') + '...';
            }
            return s.trim();
        })
        .join('. ') + '.';
}

function extractBullets(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 5).map(s => s.trim());
}

function extractKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'with', 'by', 'from', 'that', 'this', 'it', 'as', 'be', 'has', 'have', 'had', 'not', 'they', 'their', 'can', 'will', 'do', 'does', 'did', 'been', 'being', 'which', 'who', 'whom', 'what']);

    const freq = {};
    words.forEach(w => {
        const cleaned = w.replace(/[^a-z]/g, '');
        if (cleaned.length > 3 && !stopWords.has(cleaned)) {
            freq[cleaned] = (freq[cleaned] || 0) + 1;
        }
    });

    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word);
}

module.exports = router;
