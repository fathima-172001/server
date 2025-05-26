// Mark messages as read
router.put('/chats/:chatId/messages/read', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify user is participant
    if (!chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update all unread messages in this chat where the user is not the sender
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