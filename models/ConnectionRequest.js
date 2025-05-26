import mongoose from 'mongoose';

const connectionRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Ensure unique requests between users
connectionRequestSchema.index(
  { sender: 1, receiver: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);

export default ConnectionRequest; 