const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    originalText: {
        type: String,
        required: [true, 'Original text is required']
    },
    simplifiedText: {
        type: String,
        default: ''
    },
    topicTag: {
        type: String,
        required: [true, 'Topic tag is required'],
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    recommendedFor: {
        type: [String],
        enum: ['ADHD', 'Dyslexia', 'Typical'],
        default: ['ADHD', 'Dyslexia', 'Typical']
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Content', contentSchema);
