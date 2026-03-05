const mongoose = require('mongoose');

const testSessionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rawBehaviorData: {
        mouseMovements: { type: Number, default: 0 },
        rapidClicks: { type: Number, default: 0 },
        scrollReversals: { type: Number, default: 0 },
        reReadingCount: { type: Number, default: 0 },
        paragraphDwellTimes: { type: [Number], default: [] },
        totalTimeMs: { type: Number, default: 0 },
        volatilityScore: { type: Number, default: 0 },
        frictionScore: { type: Number, default: 0 },
        dwellVariance: { type: Number, default: 0 },
        cameraMotionScore: { type: Number, default: 0 },
        audioVariabilityScore: { type: Number, default: 0 }
    },
    calculatedCLI: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },
    resultProfile: {
        type: String,
        enum: ['ADHD', 'Dyslexia', 'Typical'],
        default: 'Typical'
    },
    textContent: {
        type: String
    },
    completed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TestSession', testSessionSchema);
