const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/chat — Send a message
router.post('/', auth, async (req, res) => {
    try {
        const { receiverId, message } = req.body;

        if (!receiverId || !message) {
            return res.status(400).json({ error: 'Receiver and message are required.' });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ error: 'Receiver not found.' });
        }

        // Only Teacher <-> Parent chat allowed
        const validPairs = [
            req.user.role === 'Teacher' && receiver.role === 'Parent',
            req.user.role === 'Parent' && receiver.role === 'Teacher'
        ];

        if (!validPairs.some(Boolean)) {
            return res.status(403).json({ error: 'Chat is only available between Teachers and Parents.' });
        }

        const chat = new Chat({
            senderId: req.userId,
            receiverId,
            message
        });

        await chat.save();
        res.status(201).json({ chat });
    } catch (error) {
        res.status(500).json({ error: 'Server error sending message.' });
    }
});

// GET /api/chat/:userId — Get conversation with a specific user
router.get('/:userId', auth, async (req, res) => {
    try {
        const messages = await Chat.find({
            $or: [
                { senderId: req.userId, receiverId: req.params.userId },
                { senderId: req.params.userId, receiverId: req.userId }
            ]
        })
            .sort({ createdAt: 1 })
            .limit(100);

        // Mark messages as read
        await Chat.updateMany(
            { senderId: req.params.userId, receiverId: req.userId, read: false },
            { read: true }
        );

        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET /api/chat — Get list of conversations (unique chat partners)
router.get('/', auth, async (req, res) => {
    try {
        const sent = await Chat.distinct('receiverId', { senderId: req.userId });
        const received = await Chat.distinct('senderId', { receiverId: req.userId });

        const partnerIds = [...new Set([...sent, ...received].map(String))];

        const partners = await User.find({ _id: { $in: partnerIds } }).select('name email role');

        // Get unread count per partner
        const partnersWithUnread = await Promise.all(
            partners.map(async (partner) => {
                const unreadCount = await Chat.countDocuments({
                    senderId: partner._id,
                    receiverId: req.userId,
                    read: false
                });
                return { ...partner.toObject(), unreadCount };
            })
        );

        res.json({ conversations: partnersWithUnread });
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
