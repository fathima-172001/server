import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import User from '../models/User.js';

const router = express.Router();

// Get pending connection requests
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({
      receiver: req.user._id,
      status: 'pending'
    }).populate('sender', 'username avatar');
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Failed to fetch connection requests' });
  }
});

// Send connection request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.body;
    console.log('Connection request received:', { 
      receiverId, 
      user: req.user,
      body: req.body,
      headers: req.headers 
    });
    
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    console.log('Receiver found:', receiver);
    
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if trying to connect with self
    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send connection request to yourself' });
    }

    // Check if request already exists
    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiverId },
        { sender: receiverId, receiver: req.user._id }
      ],
      status: 'pending'
    }).lean();
    console.log('Existing request:', existingRequest);

    if (existingRequest) {
      return res.status(400).json({ message: 'Connection request already exists' });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      members: { $all: [req.user._id, receiverId] }
    }).lean();
    console.log('Existing chat:', existingChat);

    if (existingChat) {
      return res.status(400).json({ message: 'Chat already exists' });
    }

    // Create new request
    const request = new ConnectionRequest({
      sender: req.user._id,
      receiver: receiverId,
      status: 'pending'
    });
    console.log('New request created:', request);
    
    await request.save();
    console.log('Request saved successfully');

    // Populate sender details
    const populatedRequest = await ConnectionRequest.findById(request._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .lean();

    console.log('Populated request:', populatedRequest);
    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error('Error in connection request:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      user: req.user
    });
    res.status(500).json({ 
      message: 'Failed to send connection request',
      error: error.message,
      details: error.name
    });
  }
});

// Respond to connection request
router.post('/request/:requestId/respond', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { accept } = req.body;

    const request = await ConnectionRequest.findOne({
      _id: requestId,
      receiver: req.user._id,
      status: 'pending'
    }).populate('sender', 'username avatar');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (accept) {
      // Create new chat
      const chat = new Chat({
        members: [request.sender._id, request.receiver]
      });
      await chat.save();

      // Create welcome message
      const message = new Message({
        conversationId: chat._id,
        sender: request.sender._id,
        text: "Hey, Hope you're doing well. May I connect with you?"
      });
      await message.save();

      // Update chat with last message
      chat.lastMessage = message._id;
      await chat.save();

      // Mark request as accepted
      request.status = 'accepted';
      await request.save();

      // Return chat with populated data
      const populatedChat = await Chat.findById(chat._id)
        .populate('members', 'username avatar')
        .populate('lastMessage');

      res.json({
        ...populatedChat.toObject(),
        otherUser: request.sender,
        lastMessage: message
      });
    } else {
      // Mark request as rejected
      request.status = 'rejected';
      await request.save();
      res.json({ message: 'Request rejected' });
    }
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ message: 'Failed to process connection request response' });
  }
});

// Get all chats for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      members: req.user._id
    })
    .populate('members', 'username avatar')
    .populate('lastMessage');

    // Format chats to include otherUser
    const formattedChats = chats.map(chat => {
      const otherUser = chat.members.find(member => member._id.toString() !== req.user._id);
      return {
        ...chat.toObject(),
        otherUser
      };
    });

    res.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
});

export default router; 