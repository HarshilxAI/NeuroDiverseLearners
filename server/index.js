const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const testSessionRoutes = require('./routes/testSessions');
const contentRoutes = require('./routes/content');
const chatRoutes = require('./routes/chat');
const adaptRoutes = require('./routes/adapt');
const readingPracticeRoutes = require('./routes/readingPractice');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/test-sessions', testSessionRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/adapt', adaptRoutes);
app.use('/api/reading-practice', readingPracticeRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

async function startServer() {
    let mongoUri = process.env.MONGO_URI;

    // Try connecting to the configured MongoDB first
    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.log('⚠️  Local MongoDB not available. Starting in-memory database...');
        // Fall back to in-memory MongoDB
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to in-memory MongoDB');
        console.log('⚠️  Note: Data will be lost when server stops. Install MongoDB for persistence.');
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

startServer().catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
});
