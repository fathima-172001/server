import { Router } from 'express';
import Conversation from '../models/Conversation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Create new conversation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newConversation = new Conversation({
      members: [req.user.id, req.body.receiverId]
    });

    const savedConversation = await newConversation.save();
    res.status(201).json(savedConversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get conversations of a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user.id] }
    });
    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get conversation between two users
router.get('/find/:secondUserId', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.user.id, req.params.secondUserId] }
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;