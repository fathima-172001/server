import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure members array always has exactly 2 users
chatSchema.pre('save', function(next) {
  if (this.members.length !== 2) {
    next(new Error('Chat must have exactly 2 participants'));
  }
  this.updatedAt = new Date();
  next();
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat; 