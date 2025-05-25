import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import Chat from '../../models/Conversation.js';
import Message from '../../models/Message.js';
import User from '../../models/User.js';

const router = express.Router();

// Get or create a chat between two users
router.post('/chats', authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: {
        $all: [req.user.userId, receiverId]
      }
    }).populate('participants', 'username avatar isOnline');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = new Chat({
      participants: [req.user.userId, receiverId],
      lastMessage: null,
      lastMessageTime: null
    });

    await chat.save();
    chat = await chat.populate('participants', 'username avatar isOnline');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error in chat creation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all chats for a user
router.get('/chats', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.userId
    })
    .populate('participants', 'username avatar isOnline')
    .populate('lastMessage')
    .sort({ lastMessageTime: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific chat
router.get('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify user is participant
    if (!chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username avatar');

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify user is participant
    if (!chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = new Message({
      chatId,
      sender: req.user.userId,
      content,
      readBy: [req.user.userId]
    });

    await message.save();
    
    // Update chat's last message
    chat.lastMessage = message._id;
    chat.lastMessageTime = message.createdAt;
    await chat.save();

    const populatedMessage = await message.populate('sender', 'username avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/users/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        },
        { _id: { $ne: req.user.userId } }
      ]
    })
    .select('username email avatar isOnline')
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/chats/:chatId/messages/read', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Message.updateMany(
      {
        chatId,
        sender: { $ne: req.user.userId },
        readBy: { $ne: req.user.userId }
      },
      {
        $addToSet: { readBy: req.user.userId }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 