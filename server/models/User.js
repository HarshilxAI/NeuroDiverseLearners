const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['Student', 'Parent', 'Teacher'],
        required: [true, 'Role is required']
    },
    interests: {
        type: [String],
        default: []
    },
    themePreference: {
        type: String,
        default: 'default'
    },
    cognitiveProfile: {
        type: String,
        enum: ['ADHD', 'Dyslexia', 'Typical'],
        default: 'Typical'
    },
    onboardingComplete: {
        type: Boolean,
        default: false
    },
    linkedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    linkedParent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    linkedTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
