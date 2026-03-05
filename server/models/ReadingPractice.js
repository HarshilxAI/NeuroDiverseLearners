const mongoose = require('mongoose');

const mistakeSchema = new mongoose.Schema({
    expectedWord: String,
    saidWord: String,
    position: Number,
}, { _id: false });

const readingPracticeSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalText: {
        type: String,
        required: true
    },
    transcript: {
        type: String,
        default: ''
    },
    mistakes: [mistakeSchema],
    accuracy: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    durationSeconds: {
        type: Number,
        default: 0
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    wordCount: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ReadingPractice', readingPracticeSchema);
