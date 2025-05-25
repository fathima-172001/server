import { Router } from 'express';
import Message from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Add new message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newMessage = new Message({
      conversationId: req.body.conversationId,
      sender: req.user.id,
      text: req.body.text
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages of a conversation
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;